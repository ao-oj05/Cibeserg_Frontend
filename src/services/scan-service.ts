import { requestJson } from "@/services/http-client";
import type {
  ScanCreated,
  ScanDetail,
  ScanListResponse,
} from "@/services/contracts";

export interface ScanQuery {
  page?: number;
  limit?: number;
}

export function listScans(
  query: ScanQuery = {},
  signal?: AbortSignal,
): Promise<ScanListResponse> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
  });

  return requestJson<ScanListResponse>(`/api/scans?${params}`, { signal });
}

export function createScan(
  targetUrl: string,
): Promise<{ message: string; data: ScanCreated }> {
  return requestJson<{ message: string; data: ScanCreated }>("/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUrl, confirmedOwnership: true }),
  });
}

export function getScan(
  scanId: string,
  signal?: AbortSignal,
): Promise<{ data: ScanDetail }> {
  return requestJson<{ data: ScanDetail }>(
    `/api/scans/${encodeURIComponent(scanId)}`,
    { signal },
  );
}

export function deleteScan(scanId: string): Promise<{ message: string }> {
  return requestJson<{ message: string }>(
    `/api/scans/${encodeURIComponent(scanId)}`,
    { method: "DELETE" },
  );
}
