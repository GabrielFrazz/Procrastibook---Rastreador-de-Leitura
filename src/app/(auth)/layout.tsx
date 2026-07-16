import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/ui";
import { ReadingJourneyArtwork } from "@/features/auth/components/reading-journey-artwork";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="public-auth-shell">
      <a className="auth-skip-link" href="#auth-main">
        Pular para o formulário
      </a>

      <header className="auth-header">
        <div className="auth-header__inner">
          <Link
            aria-label="Procrastibook — página inicial"
            className="auth-header__brand"
            href="/"
          >
            <BrandLockup showTagline size="md" />
          </Link>
          <p className="auth-header__note">
            Seu tempo de leitura, bem cuidado.
          </p>
        </div>
      </header>

      <main className="auth-layout" id="auth-main" tabIndex={-1}>
        <aside className="auth-story" aria-label="Sobre o Procrastibook">
          <div className="auth-story__copy">
            <p className="auth-story__eyebrow">Uma pausa para suas leituras</p>
            <h2>Sua estante merece um lugar tranquilo.</h2>
            <p>
              Guarde o que deseja ler, acompanhe cada página e retome suas
              histórias no seu próprio ritmo.
            </p>
          </div>
          <ReadingJourneyArtwork />
          <p className="auth-story__caption">
            Um registro pessoal, feito para acompanhar — nunca apressar.
          </p>
        </aside>

        <div className="auth-content">
          {children}
          <p className="auth-support">
            Seus dados de leitura permanecem organizados na sua conta.
          </p>
        </div>
      </main>

      <footer className="auth-footer">
        <div className="auth-footer__inner">
          <p>© 2026 Procrastibook. Todos os direitos reservados.</p>
          <p>Feito para leitores apaixonados</p>
        </div>
      </footer>
    </div>
  );
}
