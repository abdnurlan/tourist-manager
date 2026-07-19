import { api } from "./axios";
import type {
  CatalogTour,
  CatalogTourPayload,
  ListResponse,
  SuccessResponse,
} from "@/lib/types";

/** GET /catalog-tours — admin, all tours (published + drafts). */
export async function listCatalogTours(params: { category?: string } = {}): Promise<CatalogTour[]> {
  const { data } = await api.get<ListResponse<CatalogTour>>("/catalog-tours", { params });
  return data.data;
}

/** GET /catalog-tours/:id — admin, bare CatalogTour. */
export async function getCatalogTour(id: string): Promise<CatalogTour> {
  const { data } = await api.get<CatalogTour>(`/catalog-tours/${id}`);
  return data;
}

/** POST /catalog-tours — admin, returns created (201, bare). */
export async function createCatalogTour(body: CatalogTourPayload): Promise<CatalogTour> {
  const { data } = await api.post<CatalogTour>("/catalog-tours", body);
  return data;
}

/** PATCH /catalog-tours/:id — admin, partial update. */
export async function updateCatalogTour(
  id: string,
  body: Partial<CatalogTourPayload>,
): Promise<CatalogTour> {
  const { data } = await api.patch<CatalogTour>(`/catalog-tours/${id}`, body);
  return data;
}

/** DELETE /catalog-tours/:id — admin. */
export async function deleteCatalogTour(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/catalog-tours/${id}`);
  return data;
}
