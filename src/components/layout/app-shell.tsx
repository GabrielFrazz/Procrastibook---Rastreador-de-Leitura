"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SVGProps,
} from "react";

import { logoutAction } from "@/features/auth/actions/email-auth-actions";

type IconName =
  | "add"
  | "book"
  | "bookmark"
  | "chart"
  | "check"
  | "clock"
  | "close"
  | "dashboard"
  | "flag"
  | "logout"
  | "menu"
  | "search"
  | "target";

type NavigationItem = {
  label: string;
  icon: IconName;
  href?: string;
};

type AppShellProps = {
  children: ReactNode;
  displayName: string;
  previewPath?: string;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Visão geral", icon: "dashboard", href: "/dashboard" },
  { label: "Biblioteca", icon: "book", href: "/library" },
  { label: "Adicionar obra", icon: "add" },
  { label: "Sessões", icon: "clock" },
  { label: "Metas", icon: "target" },
  { label: "Estatísticas", icon: "chart" },
];

const readingNavigation: NavigationItem[] = [
  { label: "Quero ler", icon: "bookmark" },
  { label: "Lendo", icon: "flag" },
  { label: "Finalizados", icon: "check" },
];

function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    add: <path d="M12 5v14M5 12h14" />,
    book: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm16 0A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    ),
    bookmark: (
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />
    ),
    chart: <path d="M5 20V10m7 10V4m7 16v-7" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    dashboard: (
      <path d="M4 4h6v6H4V4Zm10 0h6v9h-6V4ZM4 14h6v6H4v-6Zm10 3h6v3h-6v-3Z" />
    ),
    flag: <path d="M6 21V4m0 1h10l-2 3 2 3H6" />,
    logout: <path d="M10 5H5v14h5m4-4 4-3-4-3m4 3H9" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: (
      <path d="m20 20-4.2-4.2m2.2-5.3a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    ),
    target: (
      <path d="M12 7a5 5 0 1 0 5 5m4 0a9 9 0 1 1-9-9m0 9 8-8m0 0v5m0-5h-5" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function Navigation({
  currentPath,
  onNavigate,
  preview,
}: {
  currentPath: string;
  onNavigate?: () => void;
  preview: boolean;
}) {
  const renderItem = (item: NavigationItem) => {
    const content = (
      <>
        <Icon className="app-nav__icon" name={item.icon} />
        <span>{item.label}</span>
      </>
    );

    if (item.href) {
      const isCurrent = currentPath === item.href;

      return (
        <Link
          aria-current={isCurrent ? "page" : undefined}
          className="app-nav__item"
          href={item.href}
          key={item.label}
          {...(onNavigate ? { onClick: onNavigate } : {})}
        >
          {content}
        </Link>
      );
    }

    return (
      <span
        aria-disabled="true"
        className="app-nav__item app-nav__item--disabled"
        key={item.label}
      >
        {content}
        <span className="app-nav__status">Em breve</span>
      </span>
    );
  };

  return (
    <nav aria-label="Navegação da aplicação" className="app-nav">
      <div className="app-nav__group">{primaryNavigation.map(renderItem)}</div>

      <div className="app-nav__section">
        <p className="app-nav__heading">Minhas leituras</p>
        <div className="app-nav__group">
          {readingNavigation.map(renderItem)}
        </div>
      </div>

      <form action={logoutAction} className="app-nav__logout">
        <button
          className="app-nav__item app-nav__item--button"
          disabled={preview}
          type="submit"
        >
          <Icon className="app-nav__icon" name="logout" />
          <span>Sair</span>
        </button>
      </form>
    </nav>
  );
}

export function AppShell({
  children,
  displayName,
  previewPath,
}: AppShellProps) {
  const pathname = usePathname();
  const currentPath = previewPath ?? pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const initial =
    displayName.trim().charAt(0).toLocaleUpperCase("pt-BR") || "L";

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <div className="app-shell">
      <a className="app-skip-link" href="#app-main-content">
        Ir para o conteúdo
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <button
            aria-controls="app-mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu de navegação"
            className="app-header__menu-button"
            onClick={() => setIsMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <Icon name="menu" />
          </button>

          <Link
            aria-label="Procrastibook — visão geral"
            className="app-brand"
            href="/dashboard"
          >
            <span className="app-brand__mark">
              <Icon name="book" />
            </span>
            <span className="app-brand__name">Procrastibook</span>
          </Link>

          <div aria-label="Busca global" className="app-search" role="search">
            <Icon className="app-search__icon" name="search" />
            <input
              aria-label="Buscar na biblioteca"
              disabled
              placeholder="Busca disponível em breve"
              type="search"
            />
          </div>

          <div aria-label={`Perfil de ${displayName}`} className="app-profile">
            <span aria-hidden="true" className="app-profile__avatar">
              {initial}
            </span>
            <span className="app-profile__name">{displayName}</span>
          </div>
        </div>
      </header>

      <div className="app-shell__body">
        <aside className="app-sidebar app-sidebar--desktop">
          <Navigation
            currentPath={currentPath}
            preview={Boolean(previewPath)}
          />
        </aside>

        <main className="app-main" id="app-main-content" tabIndex={-1}>
          <div className="app-main__content">{children}</div>
        </main>
      </div>

      {isMenuOpen ? (
        <div className="app-drawer">
          <button
            aria-label="Fechar menu de navegação"
            className="app-drawer__backdrop"
            onClick={closeMenu}
            type="button"
          />
          <aside
            aria-label="Menu de navegação"
            aria-modal="true"
            className="app-drawer__panel"
            id="app-mobile-navigation"
            role="dialog"
          >
            <div className="app-drawer__header">
              <span className="app-brand">
                <span className="app-brand__mark">
                  <Icon name="book" />
                </span>
                <span className="app-brand__name">Procrastibook</span>
              </span>
              <button
                aria-label="Fechar menu"
                className="app-drawer__close"
                onClick={closeMenu}
                ref={closeButtonRef}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
            <Navigation
              currentPath={currentPath}
              onNavigate={() => setIsMenuOpen(false)}
              preview={Boolean(previewPath)}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
