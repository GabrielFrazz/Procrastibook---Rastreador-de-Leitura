import { getProgressHistoryPage } from "@/features/progress/data/progress-history-repository";
import { handleProgressHistoryRequest } from "@/features/progress/server/progress-history-route-handler";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  return handleProgressHistoryRequest(request, {
    getHistory: (userId, query) =>
      getProgressHistoryPage(supabase, userId, query),
    getUserId: async () => {
      const result = await supabase.auth.getUser();
      return result.error ? null : (result.data.user?.id ?? null);
    },
  });
}
