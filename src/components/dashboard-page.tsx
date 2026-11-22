"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ScanForm } from "@/components/scan-form";
import type { ScanCreated, ScanStatus, ScanSummary } from "@/services/contracts";
import { ApiError } from "@/services/http-client";
import { listScans } from "@/services/scan-service";

const pageSize = 10;

const statusLabels: Record<ScanStatus, string> = {
  PENDING: "En cola",
  RUNNING: "En curso",
  COMPLETED: "Completado",
  FAILED: "Fallido",
  CANCELED: "Cancelado",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo cargar el historial de escaneos.";
}

export function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    let activeController: AbortController | undefined;
    let shouldPoll = false;

    async function loadScans(isInitialLoad: boolean) {
      activeController = new AbortController();
      try {
        const result = await listScans(
          { page, limit: pageSize },
          activeController.signal,
        );
        if (disposed) return;

        setScans(result.data);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages);
        setLoadError("");
        shouldPoll = result.data.some(
          (scan) => scan.status === "PENDING" || scan.status === "RUNNING",
        );
      } catch (error: unknown) {
        if (disposed || activeController?.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setLoadError(getErrorMessage(error));
        shouldPoll = true;
      } finally {
        if (!disposed) {
          if (isInitialLoad) setLoading(false);
          if (shouldPoll) {
            timer = window.setTimeout(() => {
              void loadScans(false);
            }, 3500);
          }
        }
      }
    }

    void loadScans(true);
    return () => {
      disposed = true;
      activeController?.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [page, refreshKey, router]);

  function handleScanCreated(scan: ScanCreated) {
    const newScan: ScanSummary = {
      ...scan,
      _count: { findings: 0 },
    };
    setPage(1);
    setScans((current) => [
      newScan,
      ...current.filter((item) => item.id !== newScan.id),
    ].slice(0, pageSize));
    setTotal((current) => current + 1);
    setTotalPages((current) => Math.max(current, 1));
    setRefreshKey((current) => current + 1);
  }

  const activeCount = scans.filter(
    (scan) => scan.status === "PENDING" || scan.status === "RUNNING",
  ).length;
  const completedScans = scans.filter((scan) => scan.status === "COMPLETED");
  const averageScore =
    completedScans.length === 0
      ? null
      : Math.round(
          completedScans.reduce((sum, scan) => sum + scan.riskScore, 0) /
            completedScans.length,
        );

  return (
    <DashboardShell
      title="Escaneos de seguridad"
      description="Inicia un análisis autorizado y revisa cómo evoluciona la seguridad de tus sitios."
    >
      <section className="stats-grid" aria-label="Resumen de escaneos">
        <article className="stat-card">
          <span className="stat-label">Escaneos registrados</span>
          <strong>{total}</strong>
          <span className="stat-foot">En tu cuenta</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">En curso</span>
          <strong>{activeCount}</strong>
          <span className="stat-foot">En esta página</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Puntaje promedio</span>
          <strong>{averageScore === null ? "—" : `${averageScore}/100`}</strong>
          <span className="stat-foot">Escaneos completados en esta página</span>
        </article>
      </section>

      <div className="dashboard-grid">
        <ScanForm onCreated={handleScanCreated} />
        <aside className="panel dashboard-note">
          <span className="section-label">ANÁLISIS RESPONSABLE</span>
          <h2>Solo sitios que administras</h2>
          <p>
            Antes de iniciar, confirma que eres propietario/a del dominio o tienes
            autorización para revisarlo. El análisis es pasivo y el servidor
            bloquea destinos privados o no permitidos.
          </p>
          <div className="note-divider" />
          <p className="dashboard-note-foot">
            Los escaneos se procesan en segundo plano. Los estados y resultados se
            actualizan automáticamente.
          </p>
        </aside>
      </div>

      <section className="panel history-panel" aria-labelledby="history-heading">
        <div className="panel-heading history-heading">
          <div>
            <span className="section-label">ACTIVIDAD RECIENTE</span>
            <h2 id="history-heading">Historial de escaneos</h2>
          </div>
          <span className="history-count">{total} en total</span>
        </div>

        {loadError && (
          <p className="form-message form-error dashboard-alert" role="alert">
            {loadError}
          </p>
        )}

        {loading ? (
          <p className="empty-state" role="status">Cargando tus escaneos...</p>
        ) : scans.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">⌕</span>
            <h3>Aún no hay escaneos</h3>
            <p>Cuando inicies un análisis, aparecerá aquí su estado y resultado.</p>
          </div>
        ) : (
          <div className="scan-list">
            {scans.map((scan) => (
              <article className="scan-list-item" key={scan.id}>
                <div className="scan-list-main">
                  <Link
                    className="scan-host"
                    href={`/dashboard/scans/${encodeURIComponent(scan.id)}`}
                  >
                    {scan.host}
                  </Link>
                  <span className="scan-url">{scan.targetUrl}</span>
                  <span className="scan-date">{formatDate(scan.createdAt)}</span>
                </div>
                <div className="scan-list-meta">
                  <span className={`status-pill status-${scan.status.toLowerCase()}`}>
                    {statusLabels[scan.status]}
                  </span>
                  {scan.status === "COMPLETED" ? (
                    <span className={`risk-score risk-${scan.riskLevel.toLowerCase()}`}>
                      {scan.riskScore}/100
                    </span>
                  ) : (
                    <span className="finding-count">
                      {scan.status === "FAILED"
                        ? "Reintenta el análisis"
                        : "Resultado pendiente"}
                    </span>
                  )}
                  <Link
                    aria-label={`Ver detalle de ${scan.host}`}
                    className="scan-open-link"
                    href={`/dashboard/scans/${encodeURIComponent(scan.id)}`}
                  >
                    Ver detalle <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="button button-outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              className="button button-outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
