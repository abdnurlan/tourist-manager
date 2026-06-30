# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Backend (multi-stage build)
# ─────────────────────────────────────────────────────────────

# --- Build stage ---
FROM golang:1.26 AS build

WORKDIR /src

# Cache dependencies first.
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a static (CGO-off) binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# --- Runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

# Static binary only — no shell, no libc needed.
COPY --from=build /out/server /app/server

EXPOSE 8080

USER nonroot:nonroot

# Binary özünü yoxlayır (distroless-də shell/curl yoxdur) — exec forması.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["/app/server", "healthcheck"]

ENTRYPOINT ["/app/server"]
