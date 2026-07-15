import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="auth-layout">
      <aside className="auth-brand" aria-label="Sobre o Procrastibook">
        <Link className="auth-brand__logo" href="/">
          <span aria-hidden="true">P</span>
          Procrastibook
        </Link>
        <div className="auth-brand__copy">
          <p className="auth-brand__eyebrow">Sua leitura, no seu ritmo</p>
          <h2>Menos culpa. Mais páginas lidas.</h2>
          <p>
            Organize sua biblioteca e transforme pequenos momentos em uma rotina
            de leitura consistente.
          </p>
        </div>
        <p className="auth-brand__footnote">Rastreador pessoal de leituras</p>
      </aside>
      <div className="auth-content">{children}</div>
    </main>
  );
}
