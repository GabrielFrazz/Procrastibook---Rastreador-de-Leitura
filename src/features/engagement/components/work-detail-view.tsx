"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
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

function getCoverStyle(coverUrl: string | null): CSSProperties | undefined {
  return coverUrl
    ? { backgroundImage: `url(${JSON.stringify(coverUrl)})` }
    : undefined;
}

function WorkOverview({ work }: Readonly<{ work: WorkDetail }>) {
  const total = getTotalProgress(work);
  const progressPercent =
    total && total > 0
      ? Math.min(100, Math.round((work.currentProgress / total) * 1_000) / 10)
      : null;

  return (
    <Card as="section" className="work-detail-overview" padded={false}>
      <div
        aria-hidden="true"
        className={`work-detail-cover${work.coverUrl ? " work-detail-cover--image" : ""}`}
        style={getCoverStyle(work.coverUrl)}
      >
        {work.coverUrl ? null : <span>{typeLabels[work.type]}</span>}
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

        <div>
          <h1>{work.title}</h1>
          {work.subtitle ? (
            <p className="work-detail-subtitle">{work.subtitle}</p>
          ) : null}
          <p className="work-detail-authors">
            {work.authors.length > 0
              ? work.authors.join(", ")
              : "Autoria não informada"}
          </p>
        </div>

        {total === null || progressPercent === null ? (
          <p className="work-detail-open-progress">
            Progresso:{" "}
            {formatProgressHistoryValue(
              work.currentProgress,
              work.progressUnit,
            )}
          </p>
        ) : (
          <Progress
            ariaLabel={`Progresso de ${work.title}`}
            label="Progresso"
            max={total}
            value={work.currentProgress}
            valueLabel={`${formatProgressHistoryValue(work.currentProgress, work.progressUnit)} de ${formatProgressHistoryValue(total, work.progressUnit)}`}
          />
        )}

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

        {work.description ? (
          <div className="work-detail-description">
            <h2>Sobre a obra</h2>
            <p>{work.description}</p>
          </div>
        ) : null}
      </div>
    </Card>
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

  return (
    <Card
      aria-labelledby="work-review-title"
      as="section"
      className="work-review-card"
    >
      <div className="work-detail-section-heading">
        <p>Sua opinião</p>
        <h2 id="work-review-title">
          {data.review ? "Editar avaliação" : "Avaliar esta obra"}
        </h2>
      </div>

      <form action={formAction} className="work-review-form">
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
    </Card>
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
  }, [state.status, state.message]);

  return (
    <Card
      aria-labelledby="work-note-title"
      as="section"
      className="work-note-form-card"
    >
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
          <Select defaultValue="NOTE" id="work-note-kind" name="kind" required>
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
          <Select defaultValue="" id="work-note-session" name="sessionId">
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
    </Card>
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

      <WorkManagementPanel work={result.data.work} />

      <div className="work-engagement-grid">
        <ReviewForm data={result.data} initialState={reviewPreviewState} />
        <NoteForm data={result.data} initialState={notePreviewState} />
      </div>

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
    </div>
  );
}
