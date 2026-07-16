"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  BookCover,
  Button,
  FormField,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { CatalogSearchPanel } from "@/features/catalog/components/catalog-search-panel";
import type { NormalizedWorkCandidate } from "@/features/catalog/domain/catalog-provider";
import { createWorkAction } from "@/features/works/actions/create-work-action";
import {
  INITIAL_WORK_FORM_STATE,
  type WorkFormField,
  type WorkFormState,
} from "@/features/works/domain/work-form";

type AddWorkViewProps = Readonly<{
  initialCatalogCandidates?: readonly NormalizedWorkCandidate[];
  initialState?: WorkFormState;
}>;

const workFormFocusOrder = [
  "title",
  "subtitle",
  "authors",
  "type",
  "status",
  "progressUnit",
  "total",
  "genres",
  "publisher",
  "publishedYear",
  "language",
  "isbn13",
  "startedAt",
  "description",
  "cover",
] satisfies readonly WorkFormField[];

function getFieldError(state: WorkFormState, field: WorkFormField) {
  return state.fieldErrors[field]?.[0];
}

function getFieldA11y(
  state: WorkFormState,
  field: WorkFormField,
  hasHint = false,
) {
  const hasError = Boolean(getFieldError(state, field));

  return {
    "aria-describedby": hasError
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
    "aria-invalid": hasError || undefined,
  };
}

function FormMessage({ state }: Readonly<{ state: WorkFormState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p className="add-work__message" role="alert">
      {state.message}
    </p>
  );
}

function CoverField({
  externalCoverUrl,
  state,
  title,
}: Readonly<{
  externalCoverUrl: string | null;
  state: WorkFormState;
  title: string;
}>) {
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    null,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const error = getFieldError(state, "cover");
  const previewUrl = uploadedPreviewUrl ?? externalCoverUrl;

  useEffect(
    () => () => {
      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
    },
    [uploadedPreviewUrl],
  );

  return (
    <section aria-labelledby="cover-heading" className="add-cover">
      <div className="add-work__section-heading">
        <p>Opcional</p>
        <h2 id="cover-heading">Capa da obra</h2>
        <span>Use uma imagem que ajude a reconhecer a leitura na estante.</span>
      </div>

      <BookCover
        alt=""
        className="add-cover__preview"
        loading="eager"
        size="lg"
        src={previewUrl}
        title={title}
      />

      <input
        {...getFieldA11y(state, "cover")}
        accept="image/jpeg,image/png,image/webp"
        className="add-cover__input sr-only"
        id="cover"
        name="cover"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (uploadedPreviewUrl) {
            URL.revokeObjectURL(uploadedPreviewUrl);
          }

          setFileName(file?.name ?? null);
          setUploadedPreviewUrl(file ? URL.createObjectURL(file) : null);
        }}
        type="file"
      />
      <label className="add-cover__picker" htmlFor="cover">
        <span>
          {fileName ??
            (externalCoverUrl ? "Substituir capa" : "Selecionar imagem")}
        </span>
        <small>JPEG, PNG ou WebP de até 2 MB</small>
      </label>
      {error ? (
        <p className="ui-form-field__error" id="cover-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit">
      {pending ? "Salvando…" : "Adicionar à biblioteca"}
    </Button>
  );
}

function WorkForm({
  initialState,
  selectedCandidate,
}: Readonly<{
  initialState: WorkFormState;
  selectedCandidate: NormalizedWorkCandidate | null;
}>) {
  const [state, formAction] = useActionState(createWorkAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [workType, setWorkType] = useState<string>(
    selectedCandidate?.suggestedType ?? "BOOK",
  );
  const [progressUnit, setProgressUnit] = useState("PAGE");
  const totalLabel =
    progressUnit === "CHAPTER" ? "Total de capítulos" : "Total de páginas";

  useEffect(() => {
    if (state.status !== "error") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const firstInvalidField =
        workFormFocusOrder
          .map((field) =>
            formRef.current?.querySelector<HTMLElement>(
              `#${field}[aria-invalid="true"]`,
            ),
          )
          .find((field): field is HTMLElement => Boolean(field)) ??
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');

      firstInvalidField?.focus({ preventScroll: true });
      firstInvalidField?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [state]);

  return (
    <form action={formAction} className="add-work-form" ref={formRef}>
      {selectedCandidate ? (
        <>
          <input
            name="externalProvider"
            type="hidden"
            value={selectedCandidate.provider}
          />
          <input
            name="externalId"
            type="hidden"
            value={selectedCandidate.externalId}
          />
          {selectedCandidate.isbn10 ? (
            <input
              name="isbn10"
              type="hidden"
              value={selectedCandidate.isbn10}
            />
          ) : null}
          {selectedCandidate.coverUrl ? (
            <input
              name="coverExternalUrl"
              type="hidden"
              value={selectedCandidate.coverUrl}
            />
          ) : null}
        </>
      ) : null}
      {selectedCandidate ? (
        <p className="add-work__import-notice" role="status">
          Dados de <strong>{selectedCandidate.title}</strong> importados. Revise
          os campos antes de salvar.
        </p>
      ) : null}

      <div className="add-work-form__layout">
        <CoverField
          externalCoverUrl={selectedCandidate?.coverUrl ?? null}
          state={state}
          title={selectedCandidate?.title ?? "Nova obra"}
        />

        <section
          aria-labelledby="work-fields-title"
          className="add-work-fields"
        >
          <div className="add-work-fields__heading">
            <div>
              <p>Cadastro manual</p>
              <h2 id="work-fields-title">Informações da obra</h2>
            </div>
            <span>
              <strong aria-hidden="true">*</strong> campos obrigatórios
            </span>
          </div>

          <fieldset className="add-work-fields__section">
            <legend>
              <span aria-hidden="true">01</span>
              Dados principais
            </legend>
            <p className="add-work-fields__description">
              Identifique a obra e sua autoria como aparecem na publicação.
            </p>
            <div className="add-work-fields__grid">
              <FormField
                error={getFieldError(state, "title")}
                htmlFor="title"
                label="Título"
                required
              >
                <Input
                  {...getFieldA11y(state, "title")}
                  defaultValue={selectedCandidate?.title}
                  id="title"
                  maxLength={200}
                  name="title"
                  placeholder="Digite o título da obra"
                  required
                />
              </FormField>

              <FormField
                error={getFieldError(state, "subtitle")}
                htmlFor="subtitle"
                label="Subtítulo"
              >
                <Input
                  {...getFieldA11y(state, "subtitle")}
                  defaultValue={selectedCandidate?.subtitle ?? undefined}
                  id="subtitle"
                  maxLength={200}
                  name="subtitle"
                  placeholder="Ex.: Memórias de uma leitura"
                />
              </FormField>

              <div className="add-work-fields__wide">
                <FormField
                  error={getFieldError(state, "authors")}
                  hint="Separe vários autores com ponto e vírgula."
                  htmlFor="authors"
                  label="Autores"
                  required
                >
                  <Input
                    {...getFieldA11y(state, "authors", true)}
                    defaultValue={selectedCandidate?.authors.join("; ")}
                    id="authors"
                    maxLength={968}
                    name="authors"
                    placeholder="Ex.: Conceição Evaristo; Outra Autora"
                    required
                  />
                </FormField>
              </div>
            </div>
          </fieldset>

          <fieldset className="add-work-fields__section">
            <legend>
              <span aria-hidden="true">02</span>
              Organização e progresso
            </legend>
            <p className="add-work-fields__description">
              Defina como a obra entra na sua estante; tudo pode ser atualizado
              depois.
            </p>
            <div className="add-work-fields__grid">
              <FormField
                error={getFieldError(state, "type")}
                htmlFor="type"
                label="Tipo"
                required
              >
                <Select
                  {...getFieldA11y(state, "type")}
                  id="type"
                  name="type"
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setWorkType(nextType);

                    if (nextType !== "MANGA" && progressUnit === "CHAPTER") {
                      setProgressUnit("PAGE");
                    }
                  }}
                  value={workType}
                >
                  <option value="BOOK">Livro</option>
                  <option value="MANGA">Mangá</option>
                  <option value="ARTICLE">Artigo</option>
                  <option value="EBOOK">E-book</option>
                </Select>
              </FormField>

              <FormField
                error={getFieldError(state, "status")}
                htmlFor="status"
                label="Status inicial"
                required
              >
                <Select
                  {...getFieldA11y(state, "status")}
                  defaultValue="WANT_TO_READ"
                  id="status"
                  name="status"
                >
                  <option value="WANT_TO_READ">Quero ler</option>
                  <option value="READING">Lendo</option>
                  <option value="FINISHED">Finalizada</option>
                  <option value="ABANDONED">Abandonada</option>
                </Select>
              </FormField>

              <FormField
                error={getFieldError(state, "progressUnit")}
                htmlFor="progressUnit"
                label="Unidade de progresso"
                required
              >
                <Select
                  {...getFieldA11y(state, "progressUnit")}
                  id="progressUnit"
                  name="progressUnit"
                  onChange={(event) => setProgressUnit(event.target.value)}
                  value={progressUnit}
                >
                  <option value="PAGE">Páginas</option>
                  {workType === "MANGA" ? (
                    <option value="CHAPTER">Capítulos</option>
                  ) : null}
                  <option value="PERCENT">Percentual</option>
                </Select>
              </FormField>

              <FormField
                error={getFieldError(state, "total")}
                hint={
                  progressUnit === "PERCENT"
                    ? "O total é sempre 100%."
                    : "Pode ser informado depois."
                }
                htmlFor="total"
                label={totalLabel}
              >
                <Input
                  {...getFieldA11y(state, "total", true)}
                  defaultValue={selectedCandidate?.pageCount ?? undefined}
                  disabled={progressUnit === "PERCENT"}
                  id="total"
                  inputMode="numeric"
                  max={10_000_000}
                  min={1}
                  name="total"
                  placeholder={progressUnit === "PERCENT" ? "100" : "Ex.: 320"}
                  type="number"
                />
              </FormField>

              <div className="add-work-fields__wide">
                <FormField
                  error={getFieldError(state, "genres")}
                  hint="Separe vários gêneros com vírgula."
                  htmlFor="genres"
                  label="Gêneros"
                >
                  <Input
                    {...getFieldA11y(state, "genres", true)}
                    defaultValue={selectedCandidate?.genres.join(", ")}
                    id="genres"
                    maxLength={620}
                    name="genres"
                    placeholder="Ex.: Ficção científica, Clássicos"
                  />
                </FormField>
              </div>
            </div>
          </fieldset>

          <fieldset className="add-work-fields__section">
            <legend>
              <span aria-hidden="true">03</span>
              Detalhes adicionais
            </legend>
            <p className="add-work-fields__description">
              Acrescente dados editoriais que facilitem buscas e organização.
            </p>
            <div className="add-work-fields__grid">
              <FormField
                error={getFieldError(state, "publisher")}
                htmlFor="publisher"
                label="Editora"
              >
                <Input
                  {...getFieldA11y(state, "publisher")}
                  defaultValue={selectedCandidate?.publisher ?? undefined}
                  id="publisher"
                  maxLength={160}
                  name="publisher"
                  placeholder="Ex.: Companhia das Letras"
                />
              </FormField>

              <FormField
                error={getFieldError(state, "publishedYear")}
                htmlFor="publishedYear"
                label="Ano de publicação"
              >
                <Input
                  {...getFieldA11y(state, "publishedYear")}
                  defaultValue={selectedCandidate?.publishedYear ?? undefined}
                  id="publishedYear"
                  inputMode="numeric"
                  max={2100}
                  min={1000}
                  name="publishedYear"
                  placeholder="Ex.: 2024"
                  type="number"
                />
              </FormField>

              <FormField
                error={getFieldError(state, "language")}
                htmlFor="language"
                label="Idioma"
              >
                <Input
                  {...getFieldA11y(state, "language")}
                  defaultValue={selectedCandidate?.language ?? undefined}
                  id="language"
                  maxLength={35}
                  name="language"
                  placeholder="Ex.: pt-BR"
                />
              </FormField>

              <FormField
                error={getFieldError(state, "isbn13")}
                htmlFor="isbn13"
                label="ISBN-13"
              >
                <Input
                  {...getFieldA11y(state, "isbn13")}
                  defaultValue={selectedCandidate?.isbn13 ?? undefined}
                  id="isbn13"
                  inputMode="numeric"
                  maxLength={17}
                  name="isbn13"
                  placeholder="978-00-000-0000-0"
                />
              </FormField>

              <FormField
                error={getFieldError(state, "startedAt")}
                htmlFor="startedAt"
                label="Data de início"
              >
                <Input
                  {...getFieldA11y(state, "startedAt")}
                  id="startedAt"
                  name="startedAt"
                  type="date"
                />
              </FormField>

              <div className="add-work-fields__wide">
                <FormField
                  error={getFieldError(state, "description")}
                  htmlFor="description"
                  label="Descrição"
                >
                  <Textarea
                    {...getFieldA11y(state, "description")}
                    defaultValue={selectedCandidate?.description ?? undefined}
                    id="description"
                    maxLength={5000}
                    name="description"
                    placeholder="Sinopse, resumo ou observações sobre a obra"
                  />
                </FormField>
              </div>
            </div>
          </fieldset>
        </section>
      </div>

      <div className="add-work-form__actions">
        <FormMessage state={state} />
        <div className="add-work-form__buttons">
          <Link className="ui-button ui-button--secondary" href="/library">
            Cancelar
          </Link>
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

export function AddWorkView({
  initialCatalogCandidates = [],
  initialState = INITIAL_WORK_FORM_STATE,
}: AddWorkViewProps) {
  const [selectedCandidate, setSelectedCandidate] =
    useState<NormalizedWorkCandidate | null>(null);

  return (
    <div className="add-work">
      <PageHeader
        actions={
          <Link className="ui-button ui-button--secondary" href="/library">
            Voltar à biblioteca
          </Link>
        }
        description="Busque uma obra para importar os dados ou preencha o formulário manualmente."
        eyebrow="Nova leitura"
        title="Adicionar obra"
      />

      <CatalogSearchPanel
        initialCandidates={initialCatalogCandidates}
        onSelect={(candidate) => {
          setSelectedCandidate(candidate);
          window.setTimeout(
            () => document.querySelector<HTMLInputElement>("#title")?.focus(),
            0,
          );
        }}
      />

      <WorkForm
        key={
          selectedCandidate
            ? `${selectedCandidate.provider}:${selectedCandidate.externalId}`
            : "manual"
        }
        initialState={initialState}
        selectedCandidate={selectedCandidate}
      />
    </div>
  );
}
