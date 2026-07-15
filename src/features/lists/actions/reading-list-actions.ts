"use server";

import { revalidatePath } from "next/cache";

import {
  type ReadingListActionState,
  validateCreateReadingList,
  validateManageReadingList,
} from "@/features/lists/domain/reading-lists";
import {
  createReadingList,
  manageReadingList,
  type ReadingListCommandResult,
} from "@/features/lists/services/reading-list-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function errorState(
  message: string,
  fieldErrors: ReadingListActionState["fieldErrors"] = {},
): ReadingListActionState {
  return { fieldErrors, message, status: "error" };
}

function commandError(result: ReadingListCommandResult) {
  if (result.ok) {
    return null;
  }

  if (result.code === "AUTH_REQUIRED") {
    return "Sua sessão expirou. Entre novamente antes de continuar.";
  }

  if (result.code === "DUPLICATE") {
    return "Essa informação já está cadastrada na lista.";
  }

  if (result.code === "NOT_FOUND") {
    return "A lista não existe mais ou não pertence à sua conta.";
  }

  return "Não foi possível atualizar a lista. Tente novamente.";
}

export async function createReadingListAction(
  _previousState: ReadingListActionState,
  formData: FormData,
): Promise<ReadingListActionState> {
  const validation = validateCreateReadingList(formData);

  if (!validation.ok) {
    return errorState(
      "Revise os campos antes de criar a lista.",
      validation.fieldErrors,
    );
  }

  let result: ReadingListCommandResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await createReadingList(supabase, validation.data);
  } catch {
    return errorState("A criação da lista está temporariamente indisponível.");
  }

  if (!result.ok && result.code === "DUPLICATE") {
    return errorState("Já existe uma lista com esse nome.", {
      name: ["Escolha outro nome."],
    });
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidatePath("/lists");
  return {
    fieldErrors: {},
    message: "Lista criada com sucesso.",
    status: "success",
  };
}

export async function manageReadingListAction(
  _previousState: ReadingListActionState,
  formData: FormData,
): Promise<ReadingListActionState> {
  const validation = validateManageReadingList(formData);

  if (!validation.ok) {
    return errorState(
      "Não foi possível interpretar essa alteração.",
      validation.fieldErrors,
    );
  }

  let result: ReadingListCommandResult;

  try {
    const supabase = await createServerSupabaseClient();
    result = await manageReadingList(supabase, validation.data);
  } catch {
    return errorState(
      "A atualização da lista está temporariamente indisponível.",
    );
  }

  const message = commandError(result);

  if (message) {
    return errorState(message);
  }

  revalidatePath("/lists");

  const successMessage =
    validation.data.intent === "ADD_ITEM"
      ? "Obra adicionada à lista."
      : validation.data.intent === "REMOVE_ITEM"
        ? "Obra removida da lista."
        : "Lista excluída. As obras continuam na biblioteca.";

  return { fieldErrors: {}, message: successMessage, status: "success" };
}
