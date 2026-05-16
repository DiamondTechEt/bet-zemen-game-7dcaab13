import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/admin/games/$id/draw")({ component: DrawPage });

function DrawPage() {
  const { id } = Route.useParams();
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<number | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["draw", id],
    queryFn: async () => {
      const { data: g } = await supabase.from("games").select("*").eq("id", id).single();
      const { data: tks } = await supabase.from("tickets").select("ticket_number, profiles(full_name, phone)").eq("game_id", id).eq("status", "verified");
      const { data: w } = await supabase.from("winner_draws").select("*, profiles!winner_draws_winner_user_id_fkey(full_name, phone)").eq("game_id", id).maybeSingle();
      return { g, tks: tks ?? [], w };
    },
  });

  const run = async () => {
    if (!data?.tks.length) return toast.error("ምንም የተረጋገጡ ቲኬቶች የሉም");
    setSpinning(true);
    const nums = data.tks.map((t: any) => t.ticket_number);
    let i = 0;
    const iv = setInterval(() => { setDisplay(nums[i++ % nums.length]); }, 80);
    setTimeout(async () => {
      clearInterval(iv);
      const { error } = await supabase.rpc("draw_winner" as any, { _game_id: id });
      if (error) toast.error(error.message);
      else { toast.success("አሸናፊ ተመረጠ!"); refetch(); }
      setSpinning(false);
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-3xl font-bold">{t.drawWinner}</h1>
      <p className="text-muted-foreground">{data?.g?.title}</p>
      <p className="mt-2 text-sm">የተረጋገጡ ቲኬቶች: {data?.tks.length ?? 0}</p>

      {data?.w ? (
        <Card className="mt-6 p-8 shadow-gold">
          <Trophy className="mx-auto h-12 w-12 text-gold" />
          <p className="mt-4">አሸናፊ:</p>
          <p className="text-2xl font-bold">{(data.w as any).profiles?.full_name}</p>
          <p className="font-mono text-4xl text-gold">#{data.w.winning_ticket_number}</p>
        </Card>
      ) : (
        <>
          <div className="my-8 flex h-40 items-center justify-center rounded-lg border-4 border-gold bg-gradient-hero text-primary-foreground shadow-gold">
            <span className="font-mono text-6xl font-bold">{display ?? "?"}</span>
          </div>
          <Button size="lg" onClick={run} disabled={spinning} className="bg-gold text-gold-foreground shadow-gold">
            {spinning ? "በመሽከርከር ላይ..." : "ዕጣ ጀምር"}
          </Button>
        </>
      )}
    </div>
  );
}
