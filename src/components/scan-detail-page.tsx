"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type {
  FindingSeverity,
  FindingStatus,
  RiskLevel,
  ScanDetail,
  ScanStatus,
} from "@/services/contracts";
import { ApiError } from "@/services/http-client";
import { getScan } from "@/services/scan-service";

interface ScanDetailPageProps {
  scanId: string;
}

const scanStatusLabels: Record<ScanStatus, string> = {
  PENDING: "En cola",
  RUNNING: "En curso",
  COMPLETED: "Completado",
  FAILED: "Fallido",
  CANCELED: "Cancelado",
};

const riskLabels: Record<RiskLevel, string> = {
  SAFE: "Seguro",
  WARNING: "Riesgo medio",
  CRITICAL: "Riesgo alto",
};

const severityLabels: Record<FindingSeverity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
  INFO: "Informativa",
};

const findingStatusLabels: Record<FindingStatus, string> = {
  PASSED: "Correcto",
  FAILED: "Requiere atención",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

export function ScanDetailPage({ scanId }: ScanDetailPageProps) {
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    let controller: AbortController | undefined;

    async function loadScan() {
      controller = new AbortController();
      try {
        const result = await getScan(scanId, controller.signal);
        if (disposed) return;
        setScan(result.data);
        setError("");
      } catch (requestError: unknown) {
        if (disposed || controller?.signal.aborted) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudo cargar el detalle del escaneo.",
        );
      } finally {
        if (!disposed) {
          setLoading(false);
          if (scan?.status === "PENDING" || scan?.status === "RUNNING") {
            timer = window.setTimeout(() => {
              void loadScan();
            }, 3000);
          }
        }
      }
    }

    void loadScan();
    return () => {
      disposed = true;
      controller?.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [router, scan?.status, scanId]);

  return (
    <DashboardShell
      title={scan ? `Resultado de ${scan.host}` : "Detalle del escaneo"}
      description="Consulta el estado, el puntaje y cada comprobación realizada."
    >
      <div className="detail-back-row">
        <Link className="text-link detail-back-link" href="/dashboard">
          ← Volver a escaneos
        </Link>
        {scan && <span className="scan-date">Creado {formatDate(scan.createdAt)}</span>}
      </div>

      {error && (
        <p className="form-message form-error dashboard-alert" role="alert">
          {error}
        </p>
      )}

      {loading && !scan ? (
        <section className="panel empty-state" role="status">
          Cargando el resultado...
        </section>
      ) : !scan ? (
        <section className="panel empty-state">
          <h2>No se encontró el escaneo</h2>
          <p>Puede que ya no exista o no esté disponible para tu cuenta.</p>
          <Link className="button button-accent" href="/dashboard">Ir al historial</Link>
        </section>
      ) : (
        <>
          <section className="panel scan-summary-panel">
            <div className="scan-summary-top">
              <div>
                <span className="section-label">RESUMEN DE SEGURIDAD</span>
                <h2>{scan.host}</h2>
                <span className="scan-url">
                  {scan.targetUrl}
                </span>
              </div>
              <span className={`status-pill status-${scan.status.toLowerCase()}`}>
                {scanStatusLabels[scan.status]}
              </span>
            </div>

            {scan.status === "COMPLETED" ? (
              <>
                <div className="result-score-row">
                  <div
                    className={`result-score-ring risk-${scan.riskLevel.toLowerCase()}`}
                    style={{
                      "--score": `${Math.min(100, Math.max(0, scan.riskScore))}%`,
                    } as CSSProperties}
                  >
                    <strong>{scan.riskScore}</strong>
                    <span>/100</span>
                  </div>
                  <div className="result-score-copy">
                    <span className={`risk-label risk-${scan.riskLevel.toLowerCase()}`}>
                      {riskLabels[scan.riskLevel]}
                    </span>
                    <p>
                      El puntaje resume las comprobaciones realizadas. Revisa cada
                      hallazgo y aplica las recomendaciones que correspondan.
                    </p>
                  </div>
                </div>
                <div className="result-metrics">
                  <article>
                    <span>Certificado TLS</span>
                    <strong>{scan.sslValid ? "Válido" : "No válido o no detectado"}</strong>
                  </article>
                  <article>
                    <span>Redirección HTTPS</span>
                    <strong>{scan.httpsRedirect ? "Detectada" : "No detectada"}</strong>
                  </article>
                  <article>
                    <span>Protocolo TLS</span>
                    <strong>{scan.sslProtocol ?? "No disponible"}</strong>
                  </article>
                  <article>
                    <span>Tiempo de respuesta</span>
                    <strong>
                      {scan.responseTimeMs === null
                        ? "No disponible"
                        : `${scan.responseTimeMs} ms`}
                    </strong>
                  </article>
                </div>
              </>
            ) : (
              <div className="scan-progress-state" role="status">
                <span className={`status-pill status-${scan.status.toLowerCase()}`}>
                  {scanStatusLabels[scan.status]}
                </span>
                <p>
                  {scan.status === "FAILED"
                    ? "El análisis no pudo completarse. Puedes iniciar un nuevo escaneo desde el panel."
                    : scan.status === "CANCELED"
                      ? "Este escaneo fue cancelado."
                      : "El análisis se procesa en segundo plano. Esta vista se actualizará automáticamente."}
                </p>
                {(scan.status === "FAILED" || scan.status === "CANCELED") && (
                  <Link className="button button-accent" href="/dashboard">
                    Iniciar otro escaneo
                  </Link>
                )}
              </div>
            )}
          </section>

          {scan.status === "COMPLETED" && (
            <section className="panel findings-panel" aria-labelledby="findings-heading">
              <div className="panel-heading">
                <div>
                  <span className="section-label">COMPROBACIONES</span>
                  <h2 id="findings-heading">Hallazgos y recomendaciones</h2>
                </div>
                <span className="history-count">{scan.findings.length} comprobaciones</span>
              </div>

              {scan.findings.length === 0 ? (
                <p className="empty-state">No hay comprobaciones disponibles para este escaneo.</p>
              ) : (
                <div className="finding-list">
                  {scan.findings.map((finding) => (
                    <article
                      className={`finding-card finding-${finding.status.toLowerCase()}`}
                      key={finding.id}
                    >
                      <div className="finding-title-row">
                        <div>
                          <span className="finding-category">{finding.category.replaceAll("_", " ")}</span>
                          <h3>{finding.title}</h3>
                        </div>
                        <div className="finding-badges">
                          <span className={`finding-status finding-${finding.status.toLowerCase()}`}>
                            {findingStatusLabels[finding.status]}
                          </span>
                          <span className={`severity-pill severity-${finding.severity.toLowerCase()}`}>
                            {severityLabels[finding.severity]}
                          </span>
                        </div>
                      </div>
                      <p>{finding.description}</p>
                      {finding.status === "FAILED" && finding.remediation && (
                        <div className="remediation">
                          <strong>Recomendación</strong>
                          <p>{finding.remediation}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </DashboardShell>
  );
}
