import { api } from "./axios";
import type {
  Tour,
  ListResponse,
  ToursQuery,
  CreateTourRequest,
  UpdateTourRequest,
  SuccessResponse,
} from "@/lib/types";

/** GET /tours?status=&q= — protected. Returns list (ordered by start_date desc). */
export async function listTours(query: ToursQuery = {}): Promise<Tour[]> {
  const { data } = await api.get<ListResponse<Tour>>("/tours", { params: query });
  return data.data;
}

/** GET /tours/:id — protected. Bare Tour. */
export async function getTour(id: string): Promise<Tour> {
  const { data } = await api.get<Tour>(`/tours/${id}`);
  return data;
}

/** POST /tours — protected. Returns created Tour (201, bare). */
export async function createTour(body: CreateTourRequest): Promise<Tour> {
  const { data } = await api.post<Tour>("/tours", body);
  return data;
}

/** PATCH /tours/:id — protected. Partial update; returns updated Tour. */
export async function updateTour(id: string, body: UpdateTourRequest): Promise<Tour> {
  const { data } = await api.patch<Tour>(`/tours/${id}`, body);
  return data;
}

/** DELETE /tours/:id — protected. Cascades. */
export async function deleteTour(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/tours/${id}`);
  return data;
}
