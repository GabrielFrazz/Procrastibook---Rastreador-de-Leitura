"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
  BookCover,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Progress,
  Select,
  Textarea,
} from "@/components/ui";
import {
  manageWorkNoteAction,
  saveWorkReviewAction,
} from "@/features/engagement/actions/work-engagement-actions";
import {
  INITIAL_ENGAGEMENT_ACTION_STATE,
  type EngagementActionState,
  type WorkDetail,
  type WorkDetailData,
  type WorkNote,
} from "@/features/engagement/domain/work-engagement";
import { formatProgressHistoryValue } from "@/features/progress/domain/progress-history";
import { formatSessionDate } from "@/features/reading/domain/reading-sessions";
import { WorkManagementPanel } from "@/features/works/components/work-management-panel";

export type WorkDetailResult =
  | Readonly<{ status: "error" }>
  | Readonly<{ data: WorkDetailData; status: "success" }>;

type WorkDetailViewProps = Readonly<{
  notePreviewState?: EngagementActionState | undefined;
  result: WorkDetailResult;
  reviewPreviewState?: EngagementActionState | undefined;
}>;

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

function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: Readonly<{
  children: string;
  pendingLabel: string;
  variant?: "danger" | "ghost" | "primary" | "secondary";
}>) {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

function ActionMessage({ state }: Readonly<{ state: EngagementActionState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`work-engagement-message work-engagement-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function getTotalProgress(work: WorkDetail) {
  if (work.progressUnit === "PERCENT") {
    return 100;
  }

  return work.progressUnit === "PAGE" ? work.pageCount : work.chapterCount;
}

function WorkOverview({ work }: Readonly<{ work: WorkDetail }>) {
  const total = getTotalProgress(work);
  const progressPercent =
    total && total > 0
      ? Math.min(100, Math.round((work.currentProgress / total) * 1_000) / 10)
      : null;

  return (
    <section
      aria-labelledby="work-detail-title"
      className="work-detail-overview"
    >
      <div className="work-detail-cover-stage">
        <BookCover
          alt={`Capa de ${work.title}`}
          className="work-detail-cover"
          loading="eager"
          size="lg"
          src={work.coverUrl}
          title={work.title}
        />
      </div>

      <div className="work-detail-overview__content">
        <div className="work-detail-overview__badges">
          <Badge>{typeLabels[work.type]}</Badge>
          <Badge tone={work.status === "READING" ? "strong" : "neutral"}>
            {statusLabels[work.status]}
          </Badge>
          {work.genres.map((genre) => (
            <span key={genre}>{genre}</span>
          ))}
        </div>

        <header className="work-detail-title-block">
          <h1 id="work-detail-title">{work.title}</h1>
          {work.subtitle ? (
            <p className="work-detail-subtitle">{work.subtitle}</p>
          ) : null}
          <p className="work-detail-authors">
            {work.authors.length > 0
              ? work.authors.join(", ")
              : "Autoria não informada"}
          </p>
        </header>

        <div className="work-detail-progress">
          {total === null || progressPercent === null ? (
            <p className="work-detail-open-progress">
              <span>Progresso atual</span>
              <strong>
                {formatProgressHistoryValue(
                  work.currentProgress,
                  work.progressUnit,
                )}
              </strong>
            </p>
          ) : (
            <Progress
              ariaLabel={`Progresso de ${work.title}`}
              label="Progresso da leitura"
              max={total}
              value={work.currentProgress}
              valueLabel={`${formatProgressHistoryValue(work.currentProgress, work.progressUnit)} de ${formatProgressHistoryValue(total, work.progressUnit)}`}
            />
          )}
        </div>

        <section
          aria-labelledby="work-metadata-title"
          className="work-detail-metadata-section"
        >
          <h2 id="work-metadata-title">Ficha da edição</h2>
          <dl className="work-detail-metadata">
            <div>
              <dt>Editora</dt>
              <dd>{work.publisher ?? "Não informada"}</dd>
            </div>
            <div>
              <dt>Ano</dt>
              <dd>{work.publishedYear ?? "Não informado"}</dd>
            </div>
            <div>
              <dt>Idioma</dt>
              <dd>
                {work.language?.toLocaleUpperCase("pt-BR") ?? "Não informado"}
              </dd>
            </div>
            <div>
              <dt>Identificadores</dt>
              <dd>{work.identifiers.join(" · ") || "Não informados"}</dd>
            </div>
          </dl>
        </section>

        {work.description ? (
          <section className="work-detail-description">
            <h2>Sobre a obra</h2>
            <p>{work.description}</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function ReviewForm({
  data,
  initialState,
}: Readonly<{
  data: WorkDetailData;
  initialState: EngagementActionState;
}>) {
  const [state, formAction] = useActionState(
    saveWorkReviewAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }
  }, [state]);

  return (
    <section aria-labelledby="work-review-title" className="work-review-card">
      <div className="work-detail-section-heading">
        <p>Sua opinião</p>
        <h2 id="work-review-title">
          {data.review ? "Editar avaliação" : "Avaliar esta obra"}
        </h2>
      </div>

      <form action={formAction} className="work-review-form" ref={formRef}>
        <input name="workId" type="hidden" value={data.work.id} />
        <FormField
          error={state.fieldErrors.rating?.[0]}
          htmlFor="work-review-rating"
          label="Nota"
          required
        >
          <Select
            aria-describedby={
              state.fieldErrors.rating ? "work-review-rating-error" : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.rating) || undefined}
            defaultValue={data.review?.rating ? String(data.review.rating) : ""}
            id="work-review-rating"
            name="rating"
            required
          >
            <option disabled value="">
              Selecione de 1 a 5
            </option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} {rating === 1 ? "estrela" : "estrelas"}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.body?.[0]}
          hint="Opcional, até 5.000 caracteres."
          htmlFor="work-review-body"
          label="Comentário"
        >
          <Textarea
            aria-describedby={
              state.fieldErrors.body
                ? "work-review-body-error"
                : "work-review-body-hint"
            }
            aria-invalid={Boolean(state.fieldErrors.body) || undefined}
            defaultValue={data.review?.body ?? ""}
            id="work-review-body"
            maxLength={5_000}
            name="body"
            placeholder="O que marcou esta leitura?"
          />
        </FormField>

        <div className="work-engagement-actions">
          <ActionMessage state={state} />
          <SubmitButton pendingLabel="Salvando…">Salvar avaliação</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function NoteForm({
  data,
  initialState,
}: Readonly<{
  data: WorkDetailData;
  initialState: EngagementActionState;
}>) {
  const [state, formAction] = useActionState(
    manageWorkNoteAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.message !== "Conteúdo excluído.") {
      formRef.current?.reset();
    }

    if (state.status === "error") {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus();
    }
  }, [state]);

  return (
    <section aria-labelledby="work-note-title" className="work-note-form-card">
      <div className="work-detail-section-heading">
        <p>Memória de leitura</p>
        <h2 id="work-note-title">Adicionar conteúdo</h2>
      </div>

      <form action={formAction} className="work-note-form" ref={formRef}>
        <input name="intent" type="hidden" value="CREATE" />
        <input name="workId" type="hidden" value={data.work.id} />
        <FormField
          error={state.fieldErrors.kind?.[0]}
          htmlFor="work-note-kind"
          label="Tipo"
          required
        >
          <Select
            aria-describedby={
              state.fieldErrors.kind ? "work-note-kind-error" : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.kind) || undefined}
            defaultValue="NOTE"
            id="work-note-kind"
            name="kind"
            required
          >
            <option value="NOTE">Anotação</option>
            <option value="QUOTE">Citação</option>
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.locationLabel?.[0]}
          htmlFor="work-note-location"
          label="Localização"
        >
          <Input
            aria-describedby={
              state.fieldErrors.locationLabel
                ? "work-note-location-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.locationLabel) || undefined}
            id="work-note-location"
            maxLength={120}
            name="locationLabel"
            placeholder="Ex.: página 42 ou capítulo 3"
          />
        </FormField>

        <FormField
          error={state.fieldErrors.sessionId?.[0]}
          htmlFor="work-note-session"
          label="Sessão relacionada"
        >
          <Select
            aria-describedby={
              state.fieldErrors.sessionId
                ? "work-note-session-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors.sessionId) || undefined}
            defaultValue=""
            id="work-note-session"
            name="sessionId"
          >
            <option value="">Sem vínculo com sessão</option>
            {data.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {formatSessionDate(session.occurredOn)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          error={state.fieldErrors.content?.[0]}
          hint="Obrigatório, até 5.000 caracteres."
          htmlFor="work-note-content"
          label="Conteúdo"
          required
        >
          <Textarea
            aria-describedby={
              state.fieldErrors.content
                ? "work-note-content-error"
                : "work-note-content-hint"
            }
            aria-invalid={Boolean(state.fieldErrors.content) || undefined}
            id="work-note-content"
            maxLength={5_000}
            name="content"
            placeholder="Registre uma ideia ou trecho importante."
            required
          />
        </FormField>

        <div className="work-engagement-actions">
          <ActionMessage state={state} />
          <SubmitButton pendingLabel="Salvando…">Salvar conteúdo</SubmitButton>
        </div>
      </form>
    </section>
  );
}

function NoteCard({
  note,
  workId,
}: Readonly<{ note: WorkNote; workId: string }>) {
  const [deleteState, deleteAction] = useActionState(
    manageWorkNoteAction,
    INITIAL_ENGAGEMENT_ACTION_STATE,
  );
  const content =
    note.kind === "QUOTE" ? (
      <blockquote>{note.content}</blockquote>
    ) : (
      <p>{note.content}</p>
    );

  return (
    <Card
      as="article"
      className={`work-note-card work-note-card--${note.kind.toLowerCase()}`}
    >
      <header>
        <div>
          <Badge tone={note.kind === "QUOTE" ? "warning" : "neutral"}>
            {note.kind === "QUOTE" ? "Citação" : "Anotação"}
          </Badge>
          {note.locationLabel ? <span>{note.locationLabel}</span> : null}
        </div>
        <time dateTime={note.createdAt}>
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
            new Date(note.createdAt),
          )}
        </time>
      </header>
      {content}
      {note.sessionOccurredOn ? (
        <span className="work-note-card__session">
          Sessão de {formatSessionDate(note.sessionOccurredOn)}
        </span>
      ) : null}
      <ActionMessage state={deleteState} />
      <form action={deleteAction}>
        <input name="intent" type="hidden" value="DELETE" />
        <input name="noteId" type="hidden" value={note.id} />
        <input name="workId" type="hidden" value={workId} />
        <SubmitButton pendingLabel="Excluindo…" variant="ghost">
          Excluir
        </SubmitButton>
      </form>
    </Card>
  );
}

function NoteCollection({
  kind,
  notes,
  workId,
}: Readonly<{
  kind: "NOTE" | "QUOTE";
  notes: readonly WorkNote[];
  workId: string;
}>) {
  const title = kind === "QUOTE" ? "Citações" : "Anotações";

  return (
    <section aria-labelledby={`work-${kind.toLowerCase()}-list-title`}>
      <div className="work-detail-section-heading work-detail-section-heading--collection">
        <div>
          <p>{kind === "QUOTE" ? "Trechos guardados" : "Ideias pessoais"}</p>
          <h2 id={`work-${kind.toLowerCase()}-list-title`}>{title}</h2>
        </div>
        <span>{notes.length}</span>
      </div>
      {notes.length === 0 ? (
        <EmptyState
          description={`Use o formulário acima para salvar ${kind === "QUOTE" ? "um trecho" : "uma ideia"}.`}
          title={`Nenhuma ${kind === "QUOTE" ? "citação" : "anotação"}`}
        />
      ) : (
        <div className="work-note-list">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} workId={workId} />
          ))}
        </div>
      )}
    </section>
  );
}

export function WorkDetailView({
  notePreviewState = INITIAL_ENGAGEMENT_ACTION_STATE,
  result,
  reviewPreviewState = INITIAL_ENGAGEMENT_ACTION_STATE,
}: WorkDetailViewProps) {
  if (result.status === "error") {
    return (
      <div className="work-detail-page">
        <Link className="work-detail-back" href="/library">
          ← Voltar à biblioteca
        </Link>
        <ErrorState
          description="Não foi possível consultar a obra agora."
          retryHref="/library"
          title="Detalhes indisponíveis"
        />
      </div>
    );
  }

  const notes = result.data.notes.filter((note) => note.kind === "NOTE");
  const quotes = result.data.notes.filter((note) => note.kind === "QUOTE");

  return (
    <div className="work-detail-page">
      <Link className="work-detail-back" href="/library">
        ← Voltar à biblioteca
      </Link>
      <WorkOverview work={result.data.work} />

      <section
        aria-labelledby="work-reading-record-title"
        className="work-reading-record"
      >
        <div className="work-detail-section-heading work-detail-section-heading--intro">
          <p>Seu registro de leitura</p>
          <h2 id="work-reading-record-title">Avaliação e memória</h2>
        </div>

        <div className="work-engagement-grid">
          <ReviewForm data={result.data} initialState={reviewPreviewState} />
          <NoteForm data={result.data} initialState={notePreviewState} />
        </div>
      </section>

      <div className="work-note-collections">
        <NoteCollection
          kind="NOTE"
          notes={notes}
          workId={result.data.work.id}
        />
        <NoteCollection
          kind="QUOTE"
          notes={quotes}
          workId={result.data.work.id}
        />
      </div>

      <WorkManagementPanel work={result.data.work} />
    </div>
  );
}
