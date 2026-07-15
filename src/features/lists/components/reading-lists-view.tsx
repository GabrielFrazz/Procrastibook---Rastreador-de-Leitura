"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import {
  createReadingListAction,
  manageReadingListAction,
} from "@/features/lists/actions/reading-list-actions";
import {
  INITIAL_READING_LIST_ACTION_STATE,
  type ReadingListActionState,
  type ReadingListsData,
  type ReadingListSummary,
  type ReadingListWork,
} from "@/features/lists/domain/reading-lists";

export type ReadingListsResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ data: ReadingListsData; status: "success" }>;

const typeLabels = {
  ARTICLE: "Artigo",
  BOOK: "Livro",
  EBOOK: "E-book",
  MANGA: "Mangá",
} as const;

const statusLabels = {
  ABANDONED: "Abandonada",
  FINISHED: "Finalizada",
  READING: "Lendo",
  WANT_TO_READ: "Quero ler",
} as const;

function ActionMessage({ state }: Readonly<{ state: ReadingListActionState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`reading-list-message reading-list-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({
  children,
  pendingLabel,
  size = "md",
  variant = "primary",
}: Readonly<{
  children: string;
  pendingLabel: string;
  size?: "md" | "sm";
  variant?: "danger" | "ghost" | "primary" | "secondary";
}>) {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} size={size} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

function CreateListForm() {
  const [state, formAction] = useActionState(
    createReadingListAction,
    INITIAL_READING_LIST_ACTION_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status, state.message]);

  return (
    <Card
      aria-labelledby="create-list-title"
      as="section"
      className="reading-list-create"
    >
      <div className="reading-list-section-heading">
        <p>Organize do seu jeito</p>
        <h2 id="create-list-title">Criar uma lista</h2>
      </div>

      <form
        action={formAction}
        className="reading-list-create__form"
        ref={formRef}
      >
        <FormField
          error={state.fieldErrors.name?.[0]}
          htmlFor="reading-list-name"
          label="Nome"
          required
        >
          <Input
            aria-describedby={
              state.fieldErrors.name ? "reading-list-name-error" : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.name) || undefined}
            id="reading-list-name"
            maxLength={80}
            name="name"
            placeholder="Ex.: Leituras para as férias"
            required
          />
        </FormField>

        <FormField
          error={state.fieldErrors.description?.[0]}
          htmlFor="reading-list-description"
          label="Descrição"
        >
          <Textarea
            aria-describedby={
              state.fieldErrors.description
                ? "reading-list-description-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.description) || undefined}
            id="reading-list-description"
            maxLength={500}
            name="description"
            placeholder="Explique quando ou por que deseja ler estas obras."
          />
        </FormField>

        <div className="reading-list-create__actions">
          <ActionMessage state={state} />
          <SubmitButton pendingLabel="Criando…">Criar lista</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function WorkDescription({ work }: Readonly<{ work: ReadingListWork }>) {
  return (
    <div className="reading-list-work__content">
      <strong>{work.title}</strong>
      <span>
        {work.authors.length > 0
          ? work.authors.join(", ")
          : "Autoria não informada"}
      </span>
      <span className="reading-list-work__badges">
        <Badge>{typeLabels[work.type]}</Badge>
        <Badge tone={work.status === "READING" ? "strong" : "neutral"}>
          {statusLabels[work.status]}
        </Badge>
      </span>
    </div>
  );
}

function ReadingListCard({
  list,
  works,
}: Readonly<{
  list: ReadingListSummary;
  works: readonly ReadingListWork[];
}>) {
  const [state, formAction] = useActionState(
    manageReadingListAction,
    INITIAL_READING_LIST_ACTION_STATE,
  );
  const selectedWorkIds = new Set(list.items.map((item) => item.id));
  const availableWorks = works.filter((work) => !selectedWorkIds.has(work.id));
  const selectId = `reading-list-work-${list.id}`;

  return (
    <Card as="article" className="reading-list-card">
      <div className="reading-list-card__header">
        <div>
          <h2>{list.name}</h2>
          <p>{list.description ?? "Sem descrição."}</p>
        </div>
        <Badge tone={list.items.length > 0 ? "strong" : "neutral"}>
          {list.items.length} {list.items.length === 1 ? "obra" : "obras"}
        </Badge>
      </div>

      <ActionMessage state={state} />

      <form action={formAction} className="reading-list-card__add">
        <input name="intent" type="hidden" value="ADD_ITEM" />
        <input name="listId" type="hidden" value={list.id} />
        <FormField htmlFor={selectId} label="Adicionar obra">
          <Select
            defaultValue=""
            disabled={availableWorks.length === 0}
            id={selectId}
            name="workId"
            required
          >
            <option disabled value="">
              {availableWorks.length === 0
                ? "Todas as obras já estão nesta lista"
                : "Selecione uma obra"}
            </option>
            {availableWorks.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title}
              </option>
            ))}
          </Select>
        </FormField>
        <SubmitButton pendingLabel="Adicionando…" size="sm" variant="secondary">
          Adicionar
        </SubmitButton>
      </form>

      {list.items.length === 0 ? (
        <div className="reading-list-card__empty">
          <p>Esta lista ainda não possui obras.</p>
        </div>
      ) : (
        <ul className="reading-list-card__items">
          {list.items.map((work) => (
            <li key={work.id}>
              <WorkDescription work={work} />
              <form action={formAction}>
                <input name="intent" type="hidden" value="REMOVE_ITEM" />
                <input name="listId" type="hidden" value={list.id} />
                <input name="workId" type="hidden" value={work.id} />
                <SubmitButton
                  pendingLabel="Removendo…"
                  size="sm"
                  variant="ghost"
                >
                  Remover
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <details className="reading-list-card__danger">
        <summary>Excluir lista</summary>
        <p>A lista será excluída, mas suas obras continuarão na biblioteca.</p>
        <form action={formAction}>
          <input name="intent" type="hidden" value="DELETE_LIST" />
          <input name="listId" type="hidden" value={list.id} />
          <SubmitButton pendingLabel="Excluindo…" size="sm" variant="danger">
            Confirmar exclusão
          </SubmitButton>
        </form>
      </details>
    </Card>
  );
}

export function ReadingListsView({
  result,
}: Readonly<{ result: ReadingListsResult }>) {
  return (
    <div className="reading-lists">
      <PageHeader
        actions={
          <Link className="ui-button ui-button--secondary" href="/library">
            Ver biblioteca
          </Link>
        }
        description="Agrupe obras sem alterar o status ou removê-las da sua biblioteca."
        eyebrow="Organização pessoal"
        title="Listas"
      />

      {result.status === "error" ? (
        <Card as="section">
          <ErrorState
            description="Verifique sua conexão e tente carregar suas listas novamente."
            retryHref="/lists"
            title="As listas não puderam ser carregadas"
          />
        </Card>
      ) : (
        <>
          <CreateListForm />

          {result.data.lists.length === 0 ? (
            <Card as="section">
              <EmptyState
                description="Crie uma lista para reunir obras por tema, ocasião ou prioridade."
                title="Você ainda não criou listas"
              />
            </Card>
          ) : (
            <section aria-labelledby="reading-lists-title">
              <div className="reading-list-section-heading reading-list-section-heading--results">
                <div>
                  <p>Sua organização</p>
                  <h2 id="reading-lists-title">Listas criadas</h2>
                </div>
                <span>
                  {result.data.lists.length}{" "}
                  {result.data.lists.length === 1 ? "lista" : "listas"}
                </span>
              </div>
              <div className="reading-list-grid">
                {result.data.lists.map((list) => (
                  <ReadingListCard
                    key={list.id}
                    list={list}
                    works={result.data.works}
                  />
                ))}
              </div>
            </section>
          )}

          {result.data.works.length === 0 ? (
            <p className="reading-lists__library-empty">
              Sua biblioteca ainda está vazia.{" "}
              <Link href="/library/new">Adicione uma obra</Link> para incluí-la
              em uma lista.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
