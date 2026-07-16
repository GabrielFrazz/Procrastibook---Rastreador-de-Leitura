"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import type { WorkDetail } from "@/features/engagement/domain/work-engagement";
import {
  deleteWorkAction,
  updateWorkAction,
} from "@/features/works/actions/manage-work-actions";
import {
  INITIAL_WORK_MANAGEMENT_STATE,
  type WorkManagementState,
} from "@/features/works/domain/work-management";

const progressUnitLabels = {
  CHAPTER: "capítulos",
  PAGE: "páginas",
  PERCENT: "percentual",
} as const;

function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: Readonly<{
  children: string;
  pendingLabel: string;
  variant?: "danger" | "primary";
}>) {
  const { pending } = useFormStatus();

  return (
    <Button isLoading={pending} type="submit" variant={variant}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

function ActionMessage({ state }: Readonly<{ state: WorkManagementState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`work-management-message work-management-message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

function getTotal(work: WorkDetail) {
  if (work.progressUnit === "PAGE") {
    return work.pageCount;
  }

  if (work.progressUnit === "CHAPTER") {
    return work.chapterCount;
  }

  return null;
}

export function WorkManagementPanel({ work }: Readonly<{ work: WorkDetail }>) {
  const router = useRouter();
  const [updateState, updateAction] = useActionState(
    updateWorkAction,
    INITIAL_WORK_MANAGEMENT_STATE,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteWorkAction,
    INITIAL_WORK_MANAGEMENT_STATE,
  );

  useEffect(() => {
    if (updateState.status === "success") {
      router.refresh();
    }
  }, [router, updateState.status]);

  return (
    <section
      aria-labelledby="work-management-title"
      className="work-management-card"
    >
      <div className="work-detail-section-heading">
        <p>Organização</p>
        <h2 id="work-management-title">Gerenciar obra</h2>
      </div>

      <details className="work-management-details">
        <summary>Editar dados e status</summary>
        <form action={updateAction} className="work-management-form">
          <input name="workId" type="hidden" value={work.id} />
          <input name="progressUnit" type="hidden" value={work.progressUnit} />

          <div className="work-management-grid">
            <FormField
              error={updateState.fieldErrors.title?.[0]}
              htmlFor="work-edit-title"
              label="Título"
              required
            >
              <Input
                defaultValue={work.title}
                id="work-edit-title"
                maxLength={200}
                name="title"
                required
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.subtitle?.[0]}
              htmlFor="work-edit-subtitle"
              label="Subtítulo"
            >
              <Input
                defaultValue={work.subtitle ?? ""}
                id="work-edit-subtitle"
                maxLength={200}
                name="subtitle"
                placeholder="Ex.: uma história de inverno"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.authors?.[0]}
              hint="Separe autores com ponto e vírgula."
              htmlFor="work-edit-authors"
              label="Autores"
              required
            >
              <Input
                defaultValue={work.authors.join("; ")}
                id="work-edit-authors"
                name="authors"
                required
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.genres?.[0]}
              hint="Separe gêneros com vírgula."
              htmlFor="work-edit-genres"
              label="Gêneros"
            >
              <Input
                defaultValue={work.genres.join(", ")}
                id="work-edit-genres"
                name="genres"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.type?.[0]}
              htmlFor="work-edit-type"
              label="Tipo"
              required
            >
              <Select
                defaultValue={work.type}
                id="work-edit-type"
                name="type"
                required
              >
                <option value="BOOK">Livro</option>
                <option value="MANGA">Mangá</option>
                <option value="ARTICLE">Artigo</option>
                <option value="EBOOK">E-book</option>
              </Select>
            </FormField>

            <FormField
              error={updateState.fieldErrors.status?.[0]}
              htmlFor="work-edit-status"
              label="Status"
              required
            >
              <Select
                defaultValue={work.status}
                id="work-edit-status"
                name="status"
                required
              >
                <option value="WANT_TO_READ">Quero ler</option>
                <option value="READING">Lendo</option>
                <option value="FINISHED">Finalizada</option>
                <option value="ABANDONED">Abandonada</option>
              </Select>
            </FormField>

            {work.progressUnit === "PERCENT" ? (
              <p className="work-management-unit">
                O progresso desta obra é medido por percentual e permanece assim
                para preservar o histórico.
              </p>
            ) : (
              <FormField
                error={updateState.fieldErrors.total?.[0]}
                hint={`O total não pode ser menor que o progresso atual (${work.currentProgress}).`}
                htmlFor="work-edit-total"
                label={`Total de ${progressUnitLabels[work.progressUnit]}`}
              >
                <Input
                  defaultValue={getTotal(work) ?? ""}
                  id="work-edit-total"
                  min={1}
                  name="total"
                  step={1}
                  type="number"
                />
              </FormField>
            )}

            <FormField
              error={updateState.fieldErrors.publishedYear?.[0]}
              htmlFor="work-edit-year"
              label="Ano"
            >
              <Input
                defaultValue={work.publishedYear ?? ""}
                id="work-edit-year"
                max={2100}
                min={1000}
                name="publishedYear"
                type="number"
              />
            </FormField>

            <FormField htmlFor="work-edit-publisher" label="Editora">
              <Input
                defaultValue={work.publisher ?? ""}
                id="work-edit-publisher"
                maxLength={160}
                name="publisher"
                placeholder="Ex.: Companhia das Letras"
              />
            </FormField>

            <FormField htmlFor="work-edit-language" label="Idioma">
              <Input
                defaultValue={work.language ?? ""}
                id="work-edit-language"
                maxLength={35}
                name="language"
                placeholder="Ex.: pt-BR"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.isbn10?.[0]}
              htmlFor="work-edit-isbn10"
              label="ISBN-10"
            >
              <Input
                defaultValue={work.isbn10 ?? ""}
                id="work-edit-isbn10"
                name="isbn10"
                placeholder="Ex.: 8535902775"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.isbn13?.[0]}
              htmlFor="work-edit-isbn13"
              label="ISBN-13"
            >
              <Input
                defaultValue={work.isbn13 ?? ""}
                id="work-edit-isbn13"
                name="isbn13"
                placeholder="Ex.: 9788535902778"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.doi?.[0]}
              htmlFor="work-edit-doi"
              label="DOI"
            >
              <Input
                defaultValue={work.doi ?? ""}
                id="work-edit-doi"
                maxLength={250}
                name="doi"
                placeholder="Ex.: 10.1000/xyz123"
              />
            </FormField>

            <FormField
              error={updateState.fieldErrors.description?.[0]}
              htmlFor="work-edit-description"
              label="Descrição"
            >
              <Textarea
                defaultValue={work.description ?? ""}
                id="work-edit-description"
                maxLength={5_000}
                name="description"
                placeholder="Inclua uma sinopse breve da obra."
              />
            </FormField>
          </div>

          <div className="work-management-actions">
            <ActionMessage state={updateState} />
            <SubmitButton pendingLabel="Salvando…">
              Salvar alterações
            </SubmitButton>
          </div>
        </form>
      </details>

      <details className="work-management-details work-management-details--danger">
        <summary>Excluir obra</summary>
        <form action={deleteAction} className="work-delete-form">
          <input name="workId" type="hidden" value={work.id} />
          <p>
            A exclusão remove também o progresso, as sessões, a avaliação, as
            notas e as associações desta obra.
          </p>
          <label className="work-delete-confirmation">
            <input
              name="confirmation"
              required
              type="checkbox"
              value="DELETE"
            />
            <span>Entendo que esta ação não pode ser desfeita.</span>
          </label>
          <div className="work-management-actions">
            <ActionMessage state={deleteState} />
            <SubmitButton pendingLabel="Excluindo…" variant="danger">
              Excluir permanentemente
            </SubmitButton>
          </div>
        </form>
      </details>
    </section>
  );
}
