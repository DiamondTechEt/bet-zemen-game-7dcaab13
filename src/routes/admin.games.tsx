import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Ticket, Trophy, Pencil, Trash2 } from "lucide-react";
import { formatETB, t } from "@/lib/i18n";
import { toast } from "sonner";
import { GameForm } from "@/components/GameForm";

export const Route = createFileRoute("/admin/games")({ component: AdminGames });

function AdminGames() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: async () => (await supabase.from("games").select("*").order("created_at", { ascending: false })).data ?? [],
    staleTime: 15_000,
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("games").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("ተዘምኗል"); refetch(); }
  };

  const remove = async (id: string) => {
    if (!confirm("ይህን ጨዋታ መሰረዝ ይፈልጋሉ?")) return;
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("ተሰርዟል"); refetch(); }
  };

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (g: any) => { setEditing(g); setOpen(true); };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{t.manageGames}</h1>
        <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />{t.createGame}</Button>
      </div>
      <div className="grid gap-4">
        {isLoading && <p className="text-muted-foreground">በመጫን ላይ...</p>}
        {data?.map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {g.game_image_url && <img src={g.game_image_url} className="h-14 w-14 rounded object-cover" alt="" loading="lazy" />}
                <div>
                  <p className="font-bold">{g.title}</p>
                  <p className="text-sm text-muted-foreground">{formatETB(g.ticket_price)} · {g.tickets_sold}/{g.total_tickets}</p>
                </div>
              </div>
              <Badge>{g.status}</Badge>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(g)}><Pencil className="h-3 w-3" /></Button>
                <Link to="/admin/games/$id/tickets" params={{ id: g.id }}><Button size="sm" variant="outline"><Ticket className="mr-1 h-3 w-3" />ቲኬቶች</Button></Link>
                <Link to="/admin/games/$id/draw" params={{ id: g.id }}><Button size="sm" variant="outline"><Trophy className="mr-1 h-3 w-3" />ዕጣ</Button></Link>
                {g.status === "draft" && <Button size="sm" onClick={() => setStatus(g.id, "active")}>አስጀምር</Button>}
                {g.status === "active" && <Button size="sm" variant="secondary" onClick={() => setStatus(g.id, "closed")}>ዝጋ</Button>}
                <Button size="sm" variant="destructive" onClick={() => remove(g.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "ጨዋታ አስተካክል" : t.createGame}</DialogTitle>
          </DialogHeader>
          <GameForm
            key={editing?.id ?? "new"}
            existing={editing}
            onDone={() => { setOpen(false); refetch(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
