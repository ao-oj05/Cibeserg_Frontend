"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/services/auth-service";
import { ApiError } from "@/services/http-client";

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function DashboardShell({
  title,
  description,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setLogoutError("");
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setLogoutError(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la sesión. Inténtalo de nuevo.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link className="dashboard-brand" href="/dashboard">
            <span className="dashboard-brand-icon" aria-hidden="true">✓</span>
            <span>Scan<span>Dev</span></span>
          </Link>
          <nav aria-label="Navegación de ScanDev" className="dashboard-nav">
            <Link href="/dashboard">Escaneos</Link>
            <Link href="/dashboard/reports">Reportes</Link>
          </nav>
          <button
            className="button button-outline dashboard-logout"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {logoutError && (
          <p className="form-message form-error dashboard-alert" role="alert">
            {logoutError}
          </p>
        )}
        <div className="dashboard-title">
          <span className="section-label">TU ESPACIO DE SEGURIDAD</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
