import { requestDownload, requestJson } from "@/services/http-client";
import type {
  ReportRecord,
  ReportType,
} from "@/services/contracts";

export function listReports(): Promise<{ data: ReportRecord[] }> {
  return requestJson<{ data: ReportRecord[] }>("/api/reports");
}

export function createReport(input: {
  scanId: string;
  type: Exclude<ReportType, "COMPARATIVE">;
}): Promise<{ message: string; data: ReportRecord }> {
  return requestJson<{ message: string; data: ReportRecord }>("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function downloadReport(reportId: string) {
  return requestDownload(
    `/api/reports/${encodeURIComponent(reportId)}/download`,
    `reporte-${reportId}.pdf`,
  );
}

export function exportScansCsv() {
  return requestDownload(
    "/api/reports/export-csv",
    `scandev-escaneos-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}
