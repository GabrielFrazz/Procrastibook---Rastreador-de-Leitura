"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
  type CSSProperties,
  type SVGProps,
} from "react";
import { useFormStatus } from "react-dom";

import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { createWorkAction } from "@/features/works/actions/create-work-action";
import {
  INITIAL_WORK_FORM_STATE,
  type WorkFormField,
  type WorkFormState,
} from "@/features/works/domain/work-form";

type AddWorkViewProps = Readonly<{
  initialState?: WorkFormState;
}>;

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h4v16H7a2.5 2.5 0 0 0-2.5 2.5v-16Zm15 0A2.5 2.5 0 0 0 17 3h-4v16h4a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

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

function CoverField({ state }: Readonly<{ state: WorkFormState }>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const error = getFieldError(state, "cover");

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const previewStyle: CSSProperties | undefined = previewUrl
    ? { backgroundImage: `url(${JSON.stringify(previewUrl)})` }
    : undefined;

  return (
    <Card as="section" className="add-cover">
      <div className="add-work__section-heading">
        <p>Opcional</p>
        <h2>Capa da obra</h2>
      </div>

      <div
        aria-hidden="true"
        className={[
          "add-cover__preview",
          previewUrl ? "add-cover__preview--image" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        style={previewStyle}
      >
        {previewUrl ? null : <BookIcon />}
      </div>

      <input
        {...getFieldA11y(state, "cover")}
        accept="image/jpeg,image/png,image/webp"
        className="add-cover__input sr-only"
        id="cover"
        name="cover"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          setFileName(file?.name ?? null);
          setPreviewUrl(file ? URL.createObjectURL(file) : null);
        }}
        type="file"
      />
      <label className="add-cover__picker" htmlFor="cover">
        <span>{fileName ?? "Selecionar imagem"}</span>
        <small>JPEG, PNG ou WebP de até 2 MB</small>
      </label>
      {error ? (
        <p className="ui-form-field__error" id="cover-error" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
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

function WorkForm({ initialState }: Required<AddWorkViewProps>) {
  const [state, formAction] = useActionState(createWorkAction, initialState);
  const [workType, setWorkType] = useState("BOOK");
  const [progressUnit, setProgressUnit] = useState("PAGE");
  const totalLabel =
    progressUnit === "CHAPTER" ? "Total de capítulos" : "Total de páginas";

  return (
    <form action={formAction} className="add-work-form">
      <FormMessage state={state} />

      <div className="add-work-form__layout">
        <CoverField state={state} />

        <Card as="section" className="add-work-fields">
          <fieldset className="add-work-fields__section">
            <legend>Dados principais</legend>
            <div className="add-work-fields__grid">
              <FormField
                error={getFieldError(state, "title")}
                htmlFor="title"
                label="Título"
                required
              >
                <Input
                  {...getFieldA11y(state, "title")}
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
                  id="subtitle"
                  maxLength={200}
                  name="subtitle"
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
            <legend>Organização e progresso</legend>
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
                  disabled={progressUnit === "PERCENT"}
                  id="total"
                  inputMode="numeric"
                  max={10_000_000}
                  min={1}
                  name="total"
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
            <legend>Detalhes adicionais</legend>
            <div className="add-work-fields__grid">
              <FormField
                error={getFieldError(state, "publisher")}
                htmlFor="publisher"
                label="Editora"
              >
                <Input
                  {...getFieldA11y(state, "publisher")}
                  id="publisher"
                  maxLength={160}
                  name="publisher"
                />
              </FormField>

              <FormField
                error={getFieldError(state, "publishedYear")}
                htmlFor="publishedYear"
                label="Ano de publicação"
              >
                <Input
                  {...getFieldA11y(state, "publishedYear")}
                  id="publishedYear"
                  inputMode="numeric"
                  max={2100}
                  min={1000}
                  name="publishedYear"
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
                    id="description"
                    maxLength={5000}
                    name="description"
                    placeholder="Sinopse, resumo ou observações sobre a obra"
                  />
                </FormField>
              </div>
            </div>
          </fieldset>
        </Card>
      </div>

      <div className="add-work-form__actions">
        <Link className="ui-button ui-button--secondary" href="/library">
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

export function AddWorkView({
  initialState = INITIAL_WORK_FORM_STATE,
}: AddWorkViewProps) {
  return (
    <div className="add-work">
      <PageHeader
        actions={
          <Link className="ui-button ui-button--secondary" href="/library">
            Voltar à biblioteca
          </Link>
        }
        description="Cadastre os dados essenciais agora e complete os detalhes quando quiser."
        eyebrow="Nova leitura"
        title="Adicionar obra"
      />

      <Card as="section" className="add-work-catalog">
        <span className="add-work-catalog__icon">
          <SearchIcon />
        </span>
        <div>
          <div className="add-work-catalog__heading">
            <h2>Importação automática</h2>
            <Badge>Próxima etapa</Badge>
          </div>
          <p>
            A busca por Google Books e Open Library será conectada na entrega de
            catálogo externo. O cadastro manual já salva todos os dados com
            segurança.
          </p>
        </div>
      </Card>

      <WorkForm initialState={initialState} />
    </div>
  );
}
