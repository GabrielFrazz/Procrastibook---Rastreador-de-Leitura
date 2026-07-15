import Link from "next/link";
import type { ReactNode } from "react";

import { ReadingJourneyArtwork } from "@/features/auth/components/reading-journey-artwork";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="public-auth-shell">
      <header className="auth-header">
        <div className="auth-header__inner">
          <Link className="auth-header__brand" href="/">
            <strong>Procrastibook</strong>
            <span>Rastreador de Leitura</span>
          </Link>
        </div>
      </header>

      <main className="auth-layout">
        <aside className="auth-story" aria-label="Sobre o Procrastibook">
          <ReadingJourneyArtwork />
          <div className="auth-story__copy">
            <h2>Organize sua jornada literária</h2>
            <p>
              Acompanhe seu progresso, registre suas leituras e alcance suas
              metas de forma simples e elegante.
            </p>
          </div>
        </aside>

        <div className="auth-content">
          {children}
          <p className="auth-support">
            <span>Privacidade</span>
            <span aria-hidden="true">•</span>
            <span>Termos</span>
            <span aria-hidden="true">•</span>
            <span>Ajuda</span>
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
