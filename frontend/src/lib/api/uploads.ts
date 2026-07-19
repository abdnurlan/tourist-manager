import { api } from "./axios";

/**
 * POST /uploads — admin, multipart image upload.
 * Sends the file as form field "file" and returns the stored absolute URL.
 */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<{ url: string }>("/uploads", form, {
    // Let the browser set the multipart boundary; drop the JSON default.
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
