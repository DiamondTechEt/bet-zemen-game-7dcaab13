import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Ticket, Trophy, Pencil } from "lucide-react";
import { formatETB, t } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/games")({ component: AdminGames });

function AdminGames() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-games"],
    queryFn: async () => (await supabase.from("games").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("games").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("ተዘምኗል"); refetch(); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t.manageGames}</h1>
        <Link to="/admin/games/new"><Button><Plus className="mr-1 h-4 w-4" />{t.createGame}</Button></Link>
      </div>
      <div className="grid gap-4">
        {data?.map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {g.game_image_url && <img src={g.game_image_url} className="h-14 w-14 rounded object-cover" alt="" />}
                <div>
                  <p className="font-bold">{g.title}</p>
                  <p className="text-sm text-muted-foreground">{formatETB(g.ticket_price)} · {g.tickets_sold}/{g.total_tickets}</p>
                </div>
              </div>
              <Badge>{g.status}</Badge>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/games/$id/edit" params={{ id: g.id }}><Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button></Link>
                <Link to="/admin/games/$id/tickets" params={{ id: g.id }}><Button size="sm" variant="outline"><Ticket className="mr-1 h-3 w-3" />ቲኬቶች</Button></Link>
                <Link to="/admin/games/$id/draw" params={{ id: g.id }}><Button size="sm" variant="outline"><Trophy className="mr-1 h-3 w-3" />ዕጣ</Button></Link>
                {g.status === "draft" && <Button size="sm" onClick={() => setStatus(g.id, "active")}>አስጀምር</Button>}
                {g.status === "active" && <Button size="sm" variant="secondary" onClick={() => setStatus(g.id, "closed")}>ዝጋ</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
