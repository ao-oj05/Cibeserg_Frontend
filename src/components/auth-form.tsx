"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login, register } from "@/services/auth-service";
import { listScans } from "@/services/scan-service";
import { ApiError } from "@/services/http-client";

interface AuthFormProps {
  mode: "login" | "register";
}

function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister && !isValidPassword(password)) {
      setError(
        "Usa entre 8 y 128 caracteres, con mayúscula, minúscula, número y carácter especial.",
      );
      return;
    }

    if (isRegister && password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({
          email: email.trim(),
          password,
          ...(name.trim() ? { name: name.trim() } : {}),
        });
        setSuccess("Tu cuenta quedó creada. Ya puedes iniciar sesión.");
        setPassword("");
        setPasswordConfirmation("");
      } else {
        await login({ email: email.trim(), password });
        await listScans({ page: 1, limit: 1 });
        router.replace("/dashboard");
      }
    } catch (submitError: unknown) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(messageFromError(submitError));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-heading">
        <Link aria-label="Volver a ScanDev" className="auth-brand" href="/">
          <span aria-hidden="true" className="auth-brand-icon">✓</span>
          <span>Scan<span>Dev</span></span>
        </Link>

        <div className="auth-heading">
          <span className="section-label">
            {isRegister ? "EMPIEZA A CUIDAR TU SITIO" : "QUÉ BUENO TENERTE DE VUELTA"}
          </span>
          <h1 id="auth-heading">
            {isRegister ? "Crea tu cuenta" : "Inicia sesión"}
          </h1>
          <p>
            {isRegister
              ? "Guarda tus análisis y consulta recomendaciones cuando las necesites."
              : "Accede a tus escaneos, resultados y reportes de seguridad."}
          </p>
        </div>

        {success ? (
          <div className="auth-success" role="status">
            <p>{success}</p>
            <Link className="button button-accent button-full" href="/login">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="form-field">
                <span>Nombre <span className="field-optional">(opcional)</span></span>
                <input
                  autoComplete="name"
                  maxLength={100}
                  minLength={2}
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                  value={name}
                />
              </label>
            )}

            <label className="form-field">
              <span>Correo electrónico</span>
              <input
                autoComplete="email"
                maxLength={255}
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="form-field">
              <span>Contraseña</span>
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                maxLength={128}
                minLength={isRegister ? 8 : 1}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {isRegister && (
              <>
                <p className="password-hint">
                  Mínimo 8 caracteres: mayúscula, minúscula, número y símbolo.
                </p>
                <label className="form-field">
                  <span>Confirma tu contraseña</span>
                  <input
                    autoComplete="new-password"
                    maxLength={128}
                    minLength={8}
                    name="passwordConfirmation"
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    required
                    type="password"
                    value={passwordConfirmation}
                  />
                </label>
              </>
            )}

            {error && (
              <p className="form-message form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="button button-accent button-full"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? "Un momento..."
                : isRegister
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </button>
          </form>
        )}

        {!success && (
          <p className="auth-switch">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </Link>
          </p>
        )}

        <p className="auth-back">
          <Link href="/">← Volver a ScanDev</Link>
        </p>
      </section>
    </main>
  );
}
