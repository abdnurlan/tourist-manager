package handler

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/pkg/apperror"
)

// maxUploadBytes caps a single uploaded image at 8 MiB.
const maxUploadBytes = 8 << 20

// allowedImageExt is the whitelist of accepted image extensions.
var allowedImageExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".avif": true,
}

// UploadHandler stores uploaded files on disk and returns their public URL.
type UploadHandler struct {
	dir     string // absolute path where files are written (e.g. /data/uploads)
	pathabs string // public path prefix served statically (e.g. /uploads)
	baseURL string // externally reachable origin (no trailing slash); "" → use request origin
}

// NewUploadHandler builds an UploadHandler. dir is created if missing.
// baseURL is the backend's public origin; when empty the request's own
// scheme+host is used so the returned URL is always absolute.
func NewUploadHandler(dir, pathPrefix, baseURL string) *UploadHandler {
	_ = os.MkdirAll(dir, 0o755)
	return &UploadHandler{
		dir:     dir,
		pathabs: "/" + strings.Trim(pathPrefix, "/"),
		baseURL: strings.TrimRight(baseURL, "/"),
	}
}

// origin returns the base origin to prefix onto uploaded file paths.
func (h *UploadHandler) origin(c *fiber.Ctx) string {
	if h.baseURL != "" {
		return h.baseURL
	}
	return c.Protocol() + "://" + c.Hostname()
}

// randomName returns a 16-byte hex string (unpredictable file name).
func randomName() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// UploadImage handles POST /uploads (admin, multipart form field "file").
// It validates the extension + size, writes the file under dir, and returns
// { "url": "/uploads/<name>.<ext>" } — the caller stores that URL as image_url.
func (h *UploadHandler) UploadImage(c *fiber.Ctx) error {
	fh, err := c.FormFile("file")
	if err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	if fh.Size > maxUploadBytes {
		return middleware.JSONError(c, apperror.New(
			fiber.StatusRequestEntityTooLarge, "FILE_TOO_LARGE", "Şəkil çox böyükdür (maksimum 8 MB)."))
	}

	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if !allowedImageExt[ext] {
		return middleware.JSONError(c, apperror.New(
			fiber.StatusUnprocessableEntity, "UNSUPPORTED_FILE_TYPE", "Yalnız şəkil faylları qəbul olunur (jpg, png, webp, gif, avif)."))
	}

	name, err := randomName()
	if err != nil {
		return middleware.JSONError(c, apperror.Internal())
	}
	filename := name + ext
	dest := filepath.Join(h.dir, filename)

	if err := c.SaveFile(fh, dest); err != nil {
		return middleware.JSONError(c, apperror.Internal())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"url": h.origin(c) + h.pathabs + "/" + filename,
	})
}
