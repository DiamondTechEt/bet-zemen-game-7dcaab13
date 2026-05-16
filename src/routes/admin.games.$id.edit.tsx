import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameForm } from "./admin.games.new";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin/games/$id/edit")({ component: EditGame });

function EditGame() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["edit-game", id],
    queryFn: async () => (await supabase.from("games").select("*").eq("id", id).single()).data,
  });
  if (!data) return <p>{t.loading}</p>;
  return <GameForm existing={data} />;
}
