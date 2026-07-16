import Link from "next/link";

import { getButtonClassName } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-page__header">
        <Link
          aria-label="Procrastibook"
          className="landing-page__brand"
          href="/"
        >
          Procrastibook
        </Link>
        <Link className={getButtonClassName("ghost", "md")} href="/login">
          Entrar
        </Link>
      </header>

      <main className="landing-page__main">
        <section className="landing-page__hero" aria-labelledby="landing-title">
          <p className="landing-page__eyebrow">Seu rastreador de leitura</p>
          <h1 id="landing-title">
            Cada página conta uma parte da sua jornada.
          </h1>
          <p className="landing-page__description">
            Organize sua biblioteca, acompanhe o progresso das suas leituras e
            transforme metas em hábitos — tudo em um só lugar.
          </p>

          <div className="landing-page__actions">
            <Link
              className={getButtonClassName("primary", "lg")}
              href="/signup"
            >
              Criar minha conta
            </Link>
            <Link
              className={getButtonClassName("secondary", "lg")}
              href="/login"
            >
              Já tenho uma conta
            </Link>
          </div>

          <ul
            className="landing-page__features"
            aria-label="Recursos principais"
          >
            <li>Biblioteca organizada</li>
            <li>Progresso e sessões</li>
            <li>Metas de leitura</li>
          </ul>
        </section>
      </main>

      <footer className="landing-page__footer">
        <p>Feito para quem sempre tem uma próxima leitura.</p>
      </footer>
    </div>
  );
}
