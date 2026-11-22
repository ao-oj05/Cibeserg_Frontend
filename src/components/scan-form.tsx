"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ScanCreated } from "@/services/contracts";
import { ApiError } from "@/services/http-client";
import { createScan } from "@/services/scan-service";

interface ScanFormProps {
  onCreated: (scan: ScanCreated) => void;
}

function normalizeTargetUrl(value: string): string {
  const trimmedValue = value.trim();
  const candidate = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
  const parsedUrl = new URL(candidate);

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new Error("Ingresa una URL HTTP o HTTPS válida, sin credenciales.");
  }

  return parsedUrl.toString();
}

export function ScanForm({ onCreated }: ScanFormProps) {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [confirmedOwnership, setConfirmedOwnership] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeTargetUrl(targetUrl);
    } catch (validationError: unknown) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Ingresa una URL válida.",
      );
      return;
    }

    if (!confirmedOwnership) {
      setError("Confirma que administras el sitio o tienes autorización para analizarlo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createScan(normalizedUrl);
      onCreated(response.data);
      setTargetUrl("");
      setConfirmedOwnership(false);
    } catch (requestError: unknown) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo iniciar el escaneo. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel scan-form-panel" aria-labelledby="scan-form-heading">
      <div className="panel-heading">
        <div>
          <span className="section-label">NUEVO ANÁLISIS</span>
          <h2 id="scan-form-heading">Escanea tu sitio</h2>
        </div>
        <span className="panel-icon" aria-hidden="true">⌕</span>
      </div>
      <p className="panel-description">
        Revisamos señales públicas de seguridad sin realizar cambios en tu sitio.
      </p>

      <form className="scan-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>URL del sitio</span>
          <input
            autoCapitalize="none"
            autoComplete="url"
            autoCorrect="off"
            maxLength={2048}
            name="targetUrl"
            onChange={(event) => setTargetUrl(event.target.value)}
            placeholder="https://ejemplo.com"
            required
            spellCheck={false}
            type="text"
            value={targetUrl}
          />
        </label>

        <label className="ownership-confirmation">
          <input
            checked={confirmedOwnership}
            onChange={(event) => setConfirmedOwnership(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            Confirmo que soy propietario/a del sitio o tengo autorización para analizarlo.
          </span>
        </label>

        {error && (
          <p className="form-message form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="button button-accent"
          disabled={isSubmitting || !confirmedOwnership || !targetUrl.trim()}
          type="submit"
        >
          {isSubmitting ? "Enviando..." : "Iniciar escaneo"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>

      <p className="scan-form-footnote">
        Solo analizamos objetivos públicos. El servidor aplica controles adicionales contra destinos no permitidos.
      </p>
    </section>
  );
}
