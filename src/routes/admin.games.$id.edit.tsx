import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameForm } from "@/components/GameForm";
import { Card } from "@/components/ui/card";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin/games/$id/edit")({ component: EditGame });

function EditGame() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["edit-game", id],
    queryFn: async () => (await supabase.from("games").select("*").eq("id", id).maybeSingle()).data,
  });
  if (!data) return <p>{t.loading}</p>;
  return (
    <Card className="p-6">
      <h1 className="mb-4 font-display text-2xl font-bold">ጨዋታ አስተካክል</h1>
      <GameForm existing={data} onDone={() => nav({ to: "/admin/games" })} />
    </Card>
  );
}

