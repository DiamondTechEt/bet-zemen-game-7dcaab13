import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { t, formatETB } from "@/lib/i18n";
import { Ticket as TicketIcon } from "lucide-react";

export const Route = createFileRoute("/my-tickets")({ component: MyTickets });

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    verified: { label: t.verified, cls: "bg-success text-white" },
    payment_uploaded: { label: t.paymentUploaded, cls: "bg-warning text-white" },
    pending_payment: { label: t.pending, cls: "bg-muted text-muted-foreground" },
    rejected: { label: t.rejected, cls: "bg-destructive text-destructive-foreground" },
  };
  const m = map[s] ?? map.pending_payment;
  return <Badge className={m.cls}>{m.label}</Badge>;
}

function MyTickets() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  const { data: tickets } = useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*, games(id, title, prize_description, game_image_url, ticket_price)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">{t.myTickets}</h1>
        {!tickets ? (
          <p className="text-muted-foreground">{t.loading}</p>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-16 text-center">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">ገና ቲኬት አልገዙም</p>
            <Link to="/" className="mt-2 inline-block text-primary hover:underline">ጨዋታዎችን ይዳስሱ →</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map((tk: any) => (
              <Card key={tk.id} className="overflow-hidden border-2">
                <div className="flex">
                  <div className="h-32 w-32 flex-shrink-0 overflow-hidden bg-secondary">
                    {tk.games?.game_image_url && <img src={tk.games.game_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link to="/games/$id" params={{ id: tk.games?.id }} className="font-bold hover:text-primary">{tk.games?.title}</Link>
                      <StatusBadge s={tk.status} />
                    </div>
                    {tk.ticket_number && (
                      <div className="mb-2 rounded-lg bg-gradient-gold p-2 text-center text-gold-foreground">
                        <p className="text-xs opacity-80">{t.yourTicketNumber}</p>
                        <p className="font-mono text-2xl font-bold">#{tk.ticket_number}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">ref: {tk.payment_reference}</p>
                    <p className="text-xs text-muted-foreground">{tk.payment_bank} · {new Date(tk.created_at).toLocaleDateString("am-ET")}</p>
                    {tk.rejection_reason && <p className="mt-1 text-xs text-destructive">ምክንያት: {tk.rejection_reason}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
