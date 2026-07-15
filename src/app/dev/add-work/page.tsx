import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AddWorkView } from "@/features/works/components/add-work-view";
import {
  createWorkErrorState,
  INITIAL_WORK_FORM_STATE,
} from "@/features/works/domain/work-form";

type AddWorkPreviewPageProps = Readonly<{
  searchParams: Promise<{ state?: string | string[] }>;
}>;

export default async function AddWorkPreviewPage({
  searchParams,
}: AddWorkPreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state : undefined;
  const initialState =
    state === "error"
      ? createWorkErrorState(
          "Revise os campos destacados antes de continuar.",
          {
            authors: ["Informe entre um e oito autores."],
            cover: ["Use uma imagem JPEG, PNG ou WebP."],
            title: ["Informe um título com até 200 caracteres."],
          },
        )
      : INITIAL_WORK_FORM_STATE;

  return (
    <AppShell displayName="Gabriel" previewPath="/library/new">
      <AddWorkView initialState={initialState} />
    </AppShell>
  );
}
