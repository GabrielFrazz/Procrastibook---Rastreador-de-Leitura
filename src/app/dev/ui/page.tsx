import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  LoadingState,
  PageHeader,
  PasswordInput,
  Progress,
  Select,
  Textarea,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Fundação visual | Procrastibook",
};

const COLOR_TOKENS = [
  ["Fundo", "var(--color-background)"],
  ["Superfície", "var(--color-surface)"],
  ["Texto", "var(--color-text)"],
  ["Secundário", "var(--color-text-muted)"],
  ["Borda", "var(--color-border)"],
  ["Primário", "var(--color-primary)"],
  ["Sucesso", "var(--color-success)"],
  ["Aviso", "var(--color-warning)"],
  ["Erro", "var(--color-error)"],
] as const;

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function UiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="ui-showcase">
      <nav
        aria-label="Navegação da fundação visual"
        className="ui-showcase__nav"
      >
        <Link className="ui-showcase__brand" href="/">
          Procrastibook
        </Link>
        <span className="ui-showcase__label">Ambiente de desenvolvimento</span>
      </nav>

      <PageHeader
        actions={
          <>
            <Button variant="secondary">Ação secundária</Button>
            <Button>Ação principal</Button>
          </>
        }
        description="Tokens e componentes compartilhados, validados com conteúdo próximo das telas reais do produto."
        eyebrow="Sistema visual"
        title="Fundação editorial e funcional"
      />

      <div className="ui-showcase__content">
        <section
          className="ui-showcase__section"
          aria-labelledby="colors-title"
        >
          <div className="ui-showcase__section-heading">
            <h2 id="colors-title">Cores semânticas</h2>
            <p>
              Neutros predominantes e cores de estado com contraste consistente.
            </p>
          </div>
          <div className="ui-showcase__tokens">
            {COLOR_TOKENS.map(([label, color]) => (
              <div className="ui-showcase__token" key={label}>
                <div
                  className="ui-showcase__swatch"
                  style={{ "--swatch-color": color } as CSSProperties}
                />
                <p>{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="ui-showcase__section"
          aria-labelledby="actions-title"
        >
          <div className="ui-showcase__section-heading">
            <h2 id="actions-title">Ações</h2>
            <p>Variações necessárias para os fluxos do MVP.</p>
          </div>
          <div className="ui-showcase__row">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="ghost">Discreto</Button>
            <Button variant="danger">Excluir</Button>
            <Button disabled>Desabilitado</Button>
            <Button isLoading>Salvando</Button>
            <IconButton label="Buscar obras">
              <SearchIcon />
            </IconButton>
          </div>
        </section>

        <section className="ui-showcase__section" aria-labelledby="forms-title">
          <div className="ui-showcase__section-heading">
            <h2 id="forms-title">Formulários</h2>
            <p>
              Labels persistentes, ajuda por campo e erros próximos da origem.
            </p>
          </div>
          <Card>
            <form className="ui-showcase__form">
              <FormField htmlFor="ui-title" label="Título" required>
                <Input
                  id="ui-title"
                  placeholder="Digite o título da obra"
                  required
                />
              </FormField>
              <FormField htmlFor="ui-type" label="Tipo">
                <Select defaultValue="BOOK" id="ui-type">
                  <option value="BOOK">Livro</option>
                  <option value="MANGA">Mangá</option>
                  <option value="ARTICLE">Artigo</option>
                  <option value="EBOOK">E-book</option>
                </Select>
              </FormField>
              <FormField
                hint="Use pelo menos 8 caracteres."
                htmlFor="ui-password"
                label="Senha"
              >
                <PasswordInput
                  aria-describedby="ui-password-hint"
                  autoComplete="new-password"
                  id="ui-password"
                  placeholder="Digite uma senha segura"
                />
              </FormField>
              <FormField
                error="Informe um total maior que zero."
                htmlFor="ui-total"
                label="Total de páginas"
              >
                <Input
                  aria-describedby="ui-total-error"
                  aria-invalid="true"
                  id="ui-total"
                  inputMode="numeric"
                  value="0"
                  readOnly
                />
              </FormField>
              <FormField
                hint="Você poderá alterar esse status depois."
                htmlFor="ui-status"
                label="Status inicial"
              >
                <Select
                  aria-describedby="ui-status-hint"
                  defaultValue="WANT_TO_READ"
                  id="ui-status"
                >
                  <option value="WANT_TO_READ">Quero ler</option>
                  <option value="READING">Lendo</option>
                  <option value="FINISHED">Finalizado</option>
                </Select>
              </FormField>
              <div className="ui-showcase__form-wide">
                <FormField htmlFor="ui-description" label="Sinopse / descrição">
                  <Textarea
                    id="ui-description"
                    placeholder="Adicione uma descrição segura em texto simples."
                  />
                </FormField>
              </div>
            </form>
          </Card>
        </section>

        <section
          className="ui-showcase__section"
          aria-labelledby="content-title"
        >
          <div className="ui-showcase__section-heading">
            <h2 id="content-title">Conteúdo</h2>
            <p>Cards, status e progresso aplicados a uma obra de exemplo.</p>
          </div>
          <div className="ui-showcase__grid">
            <Card as="article" className="ui-showcase__book">
              <div className="ui-showcase__book-cover">Capa indisponível</div>
              <div>
                <h3>O Nome do Vento</h3>
                <p>Patrick Rothfuss</p>
              </div>
              <Progress
                label="Progresso"
                value={37}
                valueLabel="245/662 páginas"
              />
              <div className="ui-showcase__badges">
                <Badge tone="strong">Lendo</Badge>
                <Badge tone="success">Meta em dia</Badge>
              </div>
            </Card>
            <Card as="article" className="ui-showcase__book">
              <div className="ui-showcase__book-cover">Capa do artigo</div>
              <div>
                <h3>Designing for reliable reading habits</h3>
                <p>Artigo · 18 páginas</p>
              </div>
              <Progress label="Progresso" value={0} />
              <div className="ui-showcase__badges">
                <Badge>Quero ler</Badge>
                <Badge tone="warning">Sem prazo</Badge>
              </div>
            </Card>
          </div>
        </section>

        <section
          className="ui-showcase__section"
          aria-labelledby="states-title"
        >
          <div className="ui-showcase__section-heading">
            <h2 id="states-title">Estados assíncronos</h2>
            <p>
              Feedback explícito sem alterar a estrutura principal da página.
            </p>
          </div>
          <div className="ui-showcase__grid">
            <Card padded={false}>
              <LoadingState description="Carregando sua biblioteca…" />
            </Card>
            <Card padded={false}>
              <EmptyState
                description="Adicione a primeira obra para começar seu acompanhamento."
                title="Sua biblioteca está vazia"
              />
            </Card>
            <Card padded={false}>
              <ErrorState
                description="Confira sua conexão e tente carregar os dados novamente."
                retryHref="/dev/ui"
                title="Não foi possível carregar"
              />
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
