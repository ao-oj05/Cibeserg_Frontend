"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { ReportRecord, ReportType, ScanSummary } from "@/services/contracts";
import { ApiError, saveDownload } from "@/services/http-client";
import {
  createReport,
  downloadReport,
  exportScansCsv,
  listReports,
} from "@/services/report-service";
import { listScans } from "@/services/scan-service";

const reportTypeLabels: Record<ReportType, string> = {
  EXECUTIVE: "Reporte ejecutivo",
  TECHNICAL: "Reporte técnico",
  COMPARATIVE: "Reporte comparativo",
};

function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) || timestamp <= Date.now();
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}

export function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [completedScans, setCompletedScans] = useState<ScanSummary[]>([]);
  const [selectedScanId, setSelectedScanId] = useState("");
  const [reportType, setReportType] = useState<"EXECUTIVE" | "TECHNICAL">("EXECUTIVE");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadData() {
      try {
        const [reportResponse, scanResponse] = await Promise.all([
          listReports(),
          listScans({ page: 1, limit: 100 }, controller.signal),
        ]);
        if (!active) return;
        setReports(reportResponse.data);
        const eligibleScans = scanResponse.data.filter(
          (scan) => scan.status === "COMPLETED",
        );
        setCompletedScans(eligibleScans);
        setSelectedScanId(eligibleScans[0]?.id ?? "");
        setError("");
      } catch (requestError: unknown) {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(errorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
      controller.abort();
    };
  }, [router]);

  function handleReportTypeChange(value: string) {
    if (value === "EXECUTIVE" || value === "TECHNICAL") {
      setReportType(value);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!selectedScanId) {
      setError("Completa un escaneo antes de generar un reporte.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await createReport({
        scanId: selectedScanId,
        type: reportType,
      });
      setReports((current) => [
        response.data,
        ...current.filter((report) => report.id !== response.data.id),
      ]);
      setNotice("Reporte generado. Puedes descargarlo desde la lista.");
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(errorMessage(requestError));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(report: ReportRecord) {
    setError("");
    setDownloadingId(report.id);
    try {
      const file = await downloadReport(report.id);
      saveDownload(file.blob, file.fileName);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(errorMessage(requestError));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleCsvExport() {
    setError("");
    setIsExportingCsv(true);
    try {
      const file = await exportScansCsv();
      saveDownload(file.blob, file.fileName);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(errorMessage(requestError));
    } finally {
      setIsExportingCsv(false);
    }
  }

  return (
    <DashboardShell
      title="Reportes de seguridad"
      description="Genera documentos PDF de tus análisis o exporta tu historial en CSV."
    >
      {error && (
        <p className="form-message form-error dashboard-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-message report-notice" role="status">
          {notice}
        </p>
      )}

      <div className="reports-actions-grid">
        <section className="panel report-generator" aria-labelledby="report-generator-heading">
          <div className="panel-heading">
            <div>
              <span className="section-label">DOCUMENTO PDF</span>
              <h2 id="report-generator-heading">Generar un reporte</h2>
            </div>
            <span className="panel-icon" aria-hidden="true">▤</span>
          </div>
          <p className="panel-description">
            Elige un escaneo completado y el tipo de reporte que necesitas.
          </p>

          <form className="report-form" onSubmit={handleGenerate}>
            <label className="form-field">
              <span>Escaneo</span>
              <select
                disabled={loading || completedScans.length === 0 || isGenerating}
                onChange={(event) => setSelectedScanId(event.target.value)}
                required
                value={selectedScanId}
              >
                {completedScans.length === 0 ? (
                  <option value="">No hay escaneos completados</option>
                ) : (
                  completedScans.map((scan) => (
                    <option key={scan.id} value={scan.id}>
                      {scan.host} · {scan.riskScore}/100
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="form-field">
              <span>Tipo de reporte</span>
              <select
                disabled={isGenerating}
                onChange={(event) => handleReportTypeChange(event.target.value)}
                value={reportType}
              >
                <option value="EXECUTIVE">Ejecutivo</option>
                <option value="TECHNICAL">Técnico</option>
              </select>
            </label>

            <button
              className="button button-accent"
              disabled={loading || completedScans.length === 0 || isGenerating}
              type="submit"
            >
              {isGenerating ? "Generando..." : "Generar PDF"}
            </button>
          </form>

          <p className="report-expiration-note">
            Los archivos se guardan de forma privada y caducan a los 7 días.
          </p>
        </section>

        <section className="panel csv-export-card" aria-labelledby="csv-heading">
          <span className="section-label">DATOS PORTABLES</span>
          <h2 id="csv-heading">Exporta tu historial</h2>
          <p>
            Descarga tus escaneos en CSV para analizarlos en una hoja de cálculo.
            La exportación del servidor neutraliza contenido de fórmulas.
          </p>
          <button
            className="button button-outline"
            disabled={loading || isExportingCsv}
            onClick={handleCsvExport}
            type="button"
          >
            {isExportingCsv ? "Preparando CSV..." : "Descargar CSV"}
            <span aria-hidden="true">↓</span>
          </button>
        </section>
      </div>

      <section className="panel report-list-panel" aria-labelledby="reports-heading">
        <div className="panel-heading">
          <div>
            <span className="section-label">TUS DOCUMENTOS</span>
            <h2 id="reports-heading">Reportes generados</h2>
          </div>
          <span className="history-count">{reports.length} reportes</span>
        </div>

        {loading ? (
          <p className="empty-state" role="status">Cargando tus reportes...</p>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">▤</span>
            <h3>Aún no hay reportes</h3>
            <p>Genera un reporte cuando tengas un escaneo completado.</p>
          </div>
        ) : (
          <div className="report-list">
            {reports.map((report) => {
              const expired = isExpired(report.expiresAt);
              return (
                <article className="report-list-item" key={report.id}>
                  <span className="report-file-icon" aria-hidden="true">PDF</span>
                  <div className="report-info">
                    <strong>{report.scan?.host ?? report.fileName}</strong>
                    <span>
                      {reportTypeLabels[report.type]}
                      {" · "}
                      Generado {formatDate(report.createdAt)}
                    </span>
                    <span className={expired ? "report-expired" : "report-validity"}>
                      {expired ? "Descarga vencida" : `Disponible hasta ${formatDate(report.expiresAt)}`}
                    </span>
                  </div>
                  <button
                    className="button button-outline report-download"
                    disabled={expired || downloadingId === report.id}
                    onClick={() => void handleDownload(report)}
                    type="button"
                  >
                    {downloadingId === report.id ? "Descargando..." : "Descargar"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
