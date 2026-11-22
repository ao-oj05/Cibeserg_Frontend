import Link from "next/link";

const copyrightYear = new Date().getFullYear();

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" className="brand-mark">
      <path
        d="M18 2.5 31 7v9.7c0 8.2-5.5 13.7-13 17.3C10.5 30.4 5 24.9 5 16.7V7l13-4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m11.5 18.5 4.2 4.2 8.8-9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon">
      <path
        d="M4.5 15.5 15 5m0 0H6m9 0v9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="check-icon">
      <path
        d="m4 9.2 3.1 3.1L14 5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

const checks = [
  { label: "Certificado TLS", value: "Válido", state: "ok" },
  { label: "Política CSP", value: "Configurada", state: "ok" },
  { label: "Cabecera HSTS", value: "Revisar", state: "warn" },
];

const features = [
  {
    number: "01",
    title: "Indica tu sitio",
    description:
      "Escribe el dominio que administras y confirma que tienes autorización para analizarlo.",
  },
  {
    number: "02",
    title: "Analizamos su configuración",
    description:
      "ScanDev revisa señales públicas de seguridad web sin cambiar nada en tu sitio.",
  },
  {
    number: "03",
    title: "Recibe una guía clara",
    description:
      "Consulta tu puntaje, entiende cada hallazgo y sigue recomendaciones priorizadas.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header page-shell">
        <Link aria-label="ScanDev, inicio" className="brand" href="/">
          <BrandMark />
          <span>Scan<span className="brand-accent">Dev</span></span>
        </Link>

        <nav aria-label="Navegación principal" className="main-nav">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#que-revisamos">Qué revisamos</a>
          <a href="#seguridad">Seguridad</a>
        </nav>

        <div className="header-actions">
          <Link className="login-link" href="/login">Iniciar sesión</Link>
          <Link className="button button-small button-accent" href="/register">
            Crear cuenta <ArrowIcon />
          </Link>
        </div>
      </header>

      <section className="hero page-shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            Seguridad web, sin complicaciones
          </div>
          <h1>
            Conoce qué tan segura está <span className="headline-accent">tu web.</span>
          </h1>
          <p className="hero-description">
            Revisa la configuración pública de seguridad de tu sitio, entiende los
            riesgos y descubre qué puedes mejorar, paso a paso.
          </p>
          <div className="hero-actions">
            <Link className="button button-accent" href="/register">
              Analizar mi sitio <ArrowIcon />
            </Link>
            <a className="text-link" href="#como-funciona">
              Conoce cómo funciona <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="note-icon"><CheckIcon /></span>
            Análisis pasivo. No hacemos cambios en tu sitio.
          </div>
        </div>

        <div className="hero-art" aria-label="Vista de demostración de un resultado de seguridad">
          <div className="art-glow" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="scan-card">
            <div className="scan-card-top">
              <div>
                <span className="card-kicker">VISTA DE DEMOSTRACIÓN</span>
                <h2>Resumen de seguridad</h2>
              </div>
              <span className="secure-pill"><span /> Seguro</span>
            </div>

            <div className="score-row">
              <div className="score-ring">
                <div className="score-ring-inner">
                  <strong>92</strong>
                  <span>/ 100</span>
                </div>
              </div>
              <div className="score-copy">
                <strong>Buena configuración</strong>
                <span>Tu sitio tiene una base sólida.</span>
              </div>
            </div>

            <div className="card-divider" />
            <div className="checks-heading">
              <span>Comprobaciones recientes</span>
              <span>03</span>
            </div>
            <ul className="check-list">
              {checks.map((check) => (
                <li key={check.label}>
                  <span className={`check-status ${check.state}`}>
                    {check.state === "ok" ? <CheckIcon /> : <span aria-hidden="true">!</span>}
                  </span>
                  <span className="check-label">{check.label}</span>
                  <span className={`check-value ${check.state}`}>{check.value}</span>
                </li>
              ))}
            </ul>
            <div className="card-foot">
              <span className="foot-pulse" />
              Ejemplo visual · datos ilustrativos
            </div>
          </div>
          <div className="floating-chip chip-left">
            <span className="chip-symbol">↗</span>
            <span><strong>19</strong><small>comprobaciones</small></span>
          </div>
          <div className="floating-chip chip-right">
            <span className="chip-symbol chip-symbol-mint">✓</span>
            <span><strong>Claro y accionable</strong><small>Recomendaciones simples</small></span>
          </div>
        </div>
      </section>

      <section className="trust-strip page-shell" aria-label="Características principales">
        <p>Una forma más clara de cuidar tu presencia digital</p>
        <div className="trust-items">
          <span><CheckIcon /> Sin instalaciones</span>
          <span><CheckIcon /> Resultados fáciles de entender</span>
          <span><CheckIcon /> Tú controlas cada análisis</span>
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div className="page-shell">
          <div className="section-heading">
            <span className="section-label">ASÍ DE SIMPLE</span>
            <h2>De la duda a un plan de acción.</h2>
            <p>
              No necesitas ser especialista en seguridad para empezar a proteger mejor tu sitio.
            </p>
          </div>
          <div className="steps-grid">
            {features.map((feature) => (
              <article className="step-card" key={feature.number}>
                <span className="step-number">{feature.number}</span>
                <div className="step-line" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="checks-section page-shell" id="que-revisamos">
        <div className="checks-intro">
          <span className="section-label">VISIBILIDAD, NO ADIVINANZAS</span>
          <h2>Lo importante, explicado en tu idioma.</h2>
          <p>
            Reunimos señales técnicas de tu configuración web en un resumen práctico:
            qué está bien, qué merece atención y por dónde comenzar.
          </p>
          <Link className="button button-outline" href="/register">
            Empieza gratis <ArrowIcon />
          </Link>
        </div>
        <div className="topic-list">
          <div className="topic-item">
            <span className="topic-index">01</span>
            <div><h3>Cabeceras de seguridad</h3><p>Políticas que ayudan a proteger a quienes visitan tu sitio.</p></div>
            <span className="topic-arrow">↗</span>
          </div>
          <div className="topic-item">
            <span className="topic-index">02</span>
            <div><h3>Certificado y conexión TLS</h3><p>Vigencia, protocolo y redirección segura a HTTPS.</p></div>
            <span className="topic-arrow">↗</span>
          </div>
          <div className="topic-item">
            <span className="topic-index">03</span>
            <div><h3>Riesgo y recomendaciones</h3><p>Un puntaje de referencia y acciones ordenadas por prioridad.</p></div>
            <span className="topic-arrow">↗</span>
          </div>
        </div>
      </section>

      <section className="safety-section" id="seguridad">
        <div className="page-shell safety-content">
          <div className="safety-mark"><BrandMark /></div>
          <div>
            <span className="section-label">DISEÑADO CON RESPONSABILIDAD</span>
            <h2>Tu sitio. Tu autorización. Tu decisión.</h2>
            <p>
              ScanDev realiza comprobaciones pasivas sobre información pública.
              Antes de iniciar un análisis, confirmas que administras el dominio o
              tienes autorización para revisarlo.
            </p>
          </div>
          <Link className="safety-link" href="/register">
            Conoce ScanDev <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="closing-section page-shell">
        <div className="closing-card">
          <div>
            <span className="section-label">UN PRIMER PASO, BIEN INFORMADO</span>
            <h2>Empieza a cuidar tu sitio hoy.</h2>
            <p>Crea tu cuenta y convierte los hallazgos en mejoras concretas.</p>
          </div>
          <Link className="button button-dark" href="/register">
            Crear mi cuenta <ArrowIcon />
          </Link>
          <div className="closing-orb" aria-hidden="true" />
        </div>
      </section>

      <footer className="site-footer page-shell">
        <Link aria-label="ScanDev, inicio" className="brand footer-brand" href="/">
          <BrandMark />
          <span>Scan<span className="brand-accent">Dev</span></span>
        </Link>
        <p>Seguridad web más clara para construir con confianza.</p>
        <span className="footer-copy">© {copyrightYear} ScanDev</span>
      </footer>
    </main>
  );
}
