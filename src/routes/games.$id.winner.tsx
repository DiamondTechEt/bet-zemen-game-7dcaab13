import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, PartyPopper } from "lucide-react";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/games/$id/winner")({ component: WinnerPage });

function WinnerPage() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["winner", id],
    queryFn: async () => {
      const { data: g } = await supabase.from("games").select("*").eq("id", id).single();
      const { data: w } = await supabase.from("winner_draws").select("*, profiles(full_name)").eq("game_id", id).maybeSingle();
      return { game: g, draw: w };
    },
  });
  if (!data) return <PageShell><div className="container py-12 px-4">{t.loading}</div></PageShell>;
  const winnerName = data.draw?.profiles?.full_name?.split(" ");
  const display = winnerName ? `${winnerName[0]} ${winnerName[1]?.[0] ?? ""}.` : "—";
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-16 text-center">
        <PartyPopper className="mx-auto h-16 w-16 animate-bounce text-gold" />
        <h1 className="mt-4 font-display text-4xl font-bold">{t.congratulations}</h1>
        <p className="mt-2 text-muted-foreground">{data.game?.title}</p>
        {data.draw ? (
          <Card className="mx-auto mt-8 max-w-md p-8 shadow-gold">
            <Trophy className="mx-auto h-12 w-12 text-gold" />
            <p className="mt-4 text-sm text-muted-foreground">{t.winner}</p>
            <p className="font-display text-3xl font-bold">{display}</p>
            <div className="mx-auto mt-4 max-w-xs rounded-lg bg-gradient-gold p-4 text-gold-foreground">
              <p className="text-xs opacity-80">{t.ticketNumber}</p>
              <p className="font-mono text-4xl font-bold">#{data.draw.winning_ticket_number}</p>
            </div>
            <p className="mt-4 text-sm">{t.prize}: <span className="font-bold">{data.game?.prize_description}</span></p>
          </Card>
        ) : (
          <p className="mt-8 text-muted-foreground">ዕጣ ገና አልወጣም</p>
        )}
        <Link to="/"><Button className="mt-8">ወደ ዋና ገጽ</Button></Link>
      </div>
    </PageShell>
  );
}
