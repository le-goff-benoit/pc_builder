/** Browser-side client for the Établi JSON API. */
import type { BuildDetail, BuildSummary, Offer, Part, Vendor } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Erreur ${res.status}`);
  }
  return data as T;
}

const body = (value: unknown) => JSON.stringify(value);

export const api = {
  listBuilds: () => request<BuildSummary[]>('/api/builds'),

  getBuild: (id: number) => request<BuildDetail>(`/api/builds/${id}`),

  createBuild: (data: { name: string; description: string }) =>
    request<BuildDetail>('/api/builds', { method: 'POST', body: body(data) }),

  updateBuild: (id: number, data: { name?: string; description?: string }) =>
    request<BuildDetail>(`/api/builds/${id}`, { method: 'PATCH', body: body(data) }),

  deleteBuild: (id: number) =>
    request<{ ok: true }>(`/api/builds/${id}`, { method: 'DELETE' }),

  uploadBuildImage: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/builds/${id}/image`, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.error) || `Erreur ${res.status}`);
    }
    return data as BuildDetail;
  },

  removeBuildImage: (id: number) =>
    request<BuildDetail>(`/api/builds/${id}/image`, { method: 'DELETE' }),

  createPart: (buildId: number, data: object) =>
    request<Part>(`/api/builds/${buildId}/parts`, { method: 'POST', body: body(data) }),

  updatePart: (id: number, data: object) =>
    request<Part>(`/api/parts/${id}`, { method: 'PATCH', body: body(data) }),

  deletePart: (id: number) =>
    request<{ ok: true }>(`/api/parts/${id}`, { method: 'DELETE' }),

  createOffer: (partId: number, data: object) =>
    request<Offer>(`/api/parts/${partId}/offers`, { method: 'POST', body: body(data) }),

  updateOffer: (id: number, data: object) =>
    request<Offer>(`/api/offers/${id}`, { method: 'PATCH', body: body(data) }),

  deleteOffer: (id: number) =>
    request<{ ok: true }>(`/api/offers/${id}`, { method: 'DELETE' }),

  listVendors: () => request<Vendor[]>('/api/vendors'),
};
