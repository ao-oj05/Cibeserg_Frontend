import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const maxRequestBodyBytes = 64 * 1024;

export function proxy(request: NextRequest) {
  if (!unsafeMethods.has(request.method)) {
    return NextResponse.next();
  }

  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return NextResponse.json({ error: "Solicitud entre sitios no permitida." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type");
  const isJson = contentType
    ? /^application\/json(?:\s*;|$)/i.test(contentType)
    : false;
  if ((!contentType && request.method !== "DELETE") || (contentType && !isJson)) {
    return NextResponse.json({ error: "Tipo de contenido no permitido." }, { status: 415 });
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > maxRequestBodyBytes)
  ) {
    return NextResponse.json({ error: "El cuerpo de la solicitud excede el límite permitido." }, {
      status: 413,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
