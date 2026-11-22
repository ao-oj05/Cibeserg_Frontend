export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  return fallback;
}

function assertApiPath(path: string): void {
  if (!path.startsWith("/api/") || path.startsWith("//")) {
    throw new ApiError("La ruta solicitada no es válida.", 0);
  }
}

async function sendRequest(path: string, init?: RequestInit): Promise<Response> {
  assertApiPath(path);

  try {
    return await fetch(path, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "No se pudo conectar con ScanDev. Revisa tu conexión e inténtalo de nuevo.",
      0,
    );
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await sendRequest(path, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(
      response.ok
        ? "La API devolvió un formato de respuesta inesperado."
        : response.status >= 500
          ? "El servicio de ScanDev no está disponible temporalmente."
          : "No se pudo completar la solicitud.",
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("La API devolvió una respuesta JSON inválida.", response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "No se pudo completar la solicitud."),
      response.status,
    );
  }

  return payload as T;
}

export async function requestDownload(
  path: string,
  fallbackFileName: string,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await sendRequest(path);
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = "No se pudo descargar el archivo.";

    if (contentType.toLowerCase().includes("application/json")) {
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ApiError("La API devolvió una respuesta de error inválida.", response.status);
      }
      message = getErrorMessage(payload, message);
    }

    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const headerFileName = disposition.match(/filename="([^"]+)"/i)?.[1];
  const fileName =
    headerFileName && /^[A-Za-z0-9._-]+$/.test(headerFileName)
      ? headerFileName
      : fallbackFileName;

  return { blob, fileName };
}

export function saveDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
