"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from "react";

import { Avatar, BrandLockup, Tooltip } from "@/components/ui";
import { logoutAction } from "@/features/auth/actions/email-auth-actions";

import {
  getActiveNavigationHref,
  SIDEBAR_STORAGE_KEY,
} from "./app-shell-navigation";

type IconName =
  | "add"
  | "book"
  | "bookmark"
  | "chart"
  | "check"
  | "clock"
  | "close"
  | "collapse"
  | "dashboard"
  | "expand"
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
  avatarUrl?: string | null;
  children: ReactNode;
  displayName: string;
  previewPath?: string;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Visão geral", icon: "dashboard", href: "/dashboard" },
  { label: "Biblioteca", icon: "book", href: "/library" },
  { label: "Adicionar obra", icon: "add", href: "/library/new" },
  { label: "Listas", icon: "bookmark", href: "/lists" },
  { label: "Sessões", icon: "clock", href: "/sessions" },
  { label: "Metas", icon: "target", href: "/goals" },
  { label: "Estatísticas", icon: "chart", href: "/statistics" },
];

const readingNavigation: NavigationItem[] = [
  {
    label: "Quero ler",
    icon: "bookmark",
    href: "/library?status=WANT_TO_READ",
  },
  { label: "Lendo", icon: "flag", href: "/library?status=READING" },
  { label: "Finalizados", icon: "check", href: "/library?status=FINISHED" },
];

const navigationHrefs = [...primaryNavigation, ...readingNavigation].flatMap(
  (item) => (item.href ? [item.href] : []),
);

const drawerFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
    collapse: <path d="M4 4h16v16H4V4Zm6 0v16m5-12-3 4 3 4" />,
    dashboard: (
      <path d="M4 4h6v6H4V4Zm10 0h6v9h-6V4ZM4 14h6v6H4v-6Zm10 3h6v3h-6v-3Z" />
    ),
    expand: <path d="M4 4h16v16H4V4Zm6 0v16m3-12 3 4-3 4" />,
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
  collapsed,
  currentPath,
  onNavigate,
  preview,
}: {
  collapsed: boolean;
  currentPath: string;
  onNavigate?: (href: string) => void;
  preview: boolean;
}) {
  const activeHref = useMemo(
    () => getActiveNavigationHref(currentPath, navigationHrefs),
    [currentPath],
  );

  const withCollapsedTooltip = (
    element: ReactElement<{ "aria-describedby"?: string }>,
    label: string,
  ) =>
    collapsed ? (
      <Tooltip content={label} placement="right">
        {element}
      </Tooltip>
    ) : (
      element
    );

  const renderItem = (item: NavigationItem) => {
    const content = (
      <>
        <Icon className="app-nav__icon" name={item.icon} />
        <span className="app-nav__label">{item.label}</span>
      </>
    );

    if (item.href) {
      const isCurrent = activeHref === item.href;
      const link = (
        <Link
          aria-current={isCurrent ? "page" : undefined}
          aria-label={collapsed ? item.label : undefined}
          className="app-nav__item"
          href={item.href}
          onClick={() => onNavigate?.(item.href ?? "")}
        >
          {content}
        </Link>
      );

      return (
        <div className="app-nav__item-shell" key={item.label}>
          {withCollapsedTooltip(link, item.label)}
        </div>
      );
    }

    const disabledItem = (
      <span
        aria-disabled="true"
        aria-label={collapsed ? item.label : undefined}
        className="app-nav__item app-nav__item--disabled"
      >
        {content}
        <span className="app-nav__status">Em breve</span>
      </span>
    );

    return (
      <div className="app-nav__item-shell" key={item.label}>
        {withCollapsedTooltip(disabledItem, item.label)}
      </div>
    );
  };

  const logoutButton = (
    <button
      aria-label={collapsed ? "Sair" : undefined}
      className="app-nav__item app-nav__item--button"
      disabled={preview}
      type="submit"
    >
      <Icon className="app-nav__icon" name="logout" />
      <span className="app-nav__label">Sair</span>
    </button>
  );

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
        {withCollapsedTooltip(logoutButton, "Sair")}
      </form>
    </nav>
  );
}

export function AppShell({
  avatarUrl = null,
  children,
  displayName,
  previewPath,
}: AppShellProps) {
  const pathname = usePathname();
  const [locationSearch, setLocationSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const shellBodyRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const currentPath = previewPath ?? `${pathname}${locationSearch}`;

  useEffect(() => {
    const syncLocationSearch = () => setLocationSearch(window.location.search);

    syncLocationSearch();
    window.addEventListener("popstate", syncLocationSearch);
    return () => window.removeEventListener("popstate", syncLocationSearch);
  }, [pathname]);

  useEffect(() => {
    const syncCollapsedPreference = window.requestAnimationFrame(() => {
      try {
        setIsSidebarCollapsed(
          window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
        );
      } catch {
        setIsSidebarCollapsed(false);
      }
    });

    return () => window.cancelAnimationFrame(syncCollapsedPreference);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const panel = drawerPanelRef.current;
    const header = headerRef.current;
    const shellBody = shellBodyRef.current;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : menuButton;

    header?.setAttribute("inert", "");
    shellBody?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";

    const focusCloseButton = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(drawerFocusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          document.activeElement === panel)
      ) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusCloseButton);
      document.removeEventListener("keydown", handleKeyDown);
      header?.removeAttribute("inert");
      shellBody?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;

      window.requestAnimationFrame(() => {
        (previousFocusRef.current ?? menuButton)?.focus();
      });
    };
  }, [isMenuOpen]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;

      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      } catch {
        // A navegação continua funcional quando o armazenamento está indisponível.
      }

      return nextValue;
    });
  };

  const handleNavigate = (href: string) => {
    setLocationSearch(new URL(href, window.location.origin).search);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const handleDrawerNavigate = (href: string) => {
    handleNavigate(href);
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`app-shell${isSidebarCollapsed ? " app-shell--sidebar-collapsed" : ""}`}
    >
      <a className="app-skip-link" href="#app-main-content">
        Ir para o conteúdo
      </a>

      <header className="app-header" ref={headerRef}>
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
            <BrandLockup size="sm" />
          </Link>

          <form
            action="/library"
            aria-label="Busca global"
            className="app-search"
            role="search"
          >
            <Icon className="app-search__icon" name="search" />
            <input
              aria-label="Buscar na biblioteca"
              name="q"
              placeholder="Buscar título, autor, ISBN ou DOI"
              type="search"
            />
          </form>

          <Link
            aria-label={`Abrir perfil de ${displayName}`}
            className="app-profile"
            href="/profile"
          >
            <Avatar name={displayName} size="sm" src={avatarUrl} />
            <span className="app-profile__name">{displayName}</span>
          </Link>
        </div>
      </header>

      <div className="app-shell__body" ref={shellBodyRef}>
        <aside className="app-sidebar app-sidebar--desktop">
          <div className="app-sidebar__controls">
            <Tooltip
              content={
                isSidebarCollapsed
                  ? "Expandir menu lateral"
                  : "Recolher menu lateral"
              }
              placement="right"
            >
              <button
                aria-label={
                  isSidebarCollapsed
                    ? "Expandir menu lateral"
                    : "Recolher menu lateral"
                }
                aria-pressed={isSidebarCollapsed}
                className="app-sidebar__toggle"
                onClick={toggleSidebar}
                type="button"
              >
                <Icon name={isSidebarCollapsed ? "expand" : "collapse"} />
              </button>
            </Tooltip>
          </div>

          <Navigation
            collapsed={isSidebarCollapsed}
            currentPath={currentPath}
            onNavigate={handleNavigate}
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
            tabIndex={-1}
            type="button"
          />
          <aside
            aria-label="Menu de navegação"
            aria-modal="true"
            className="app-drawer__panel"
            id="app-mobile-navigation"
            ref={drawerPanelRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="app-drawer__header">
              <span className="app-brand">
                <BrandLockup size="sm" />
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
              collapsed={false}
              currentPath={currentPath}
              onNavigate={handleDrawerNavigate}
              preview={Boolean(previewPath)}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
