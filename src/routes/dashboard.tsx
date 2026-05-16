import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { GameCard } from "@/components/GameCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { t, formatETB } from "@/lib/i18n";
import { Ticket, CheckCircle, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

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

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  const { data: tickets } = useQuery({
    queryKey: ["my-tickets-summary", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*, games(title, prize_description, game_image_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: games } = useQuery({
    queryKey: ["active-games-dash"],
    queryFn: async () => {
      const { data } = await supabase.from("games").select("*").eq("status", "active").limit(6);
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("status").eq("user_id", user!.id);
      const total = data?.length ?? 0;
      const verified = data?.filter((t) => t.status === "verified").length ?? 0;
      const pending = data?.filter((t) => t.status !== "verified" && t.status !== "rejected").length ?? 0;
      return { total, verified, pending };
    },
  });

  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t.welcome}, {profile?.full_name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">ቲኬቶችዎን እና አዳዲስ ጨዋታዎችን እዚህ ይመልከቱ።</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="p-5 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">ጠቅላላ ቲኬቶች</p><p className="text-3xl font-bold">{stats?.total ?? 0}</p></div>
              <Ticket className="h-10 w-10 text-primary" />
            </div>
          </Card>
          <Card className="p-5 border-2 border-success/20">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">የተረጋገጡ</p><p className="text-3xl font-bold text-success">{stats?.verified ?? 0}</p></div>
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
          </Card>
          <Card className="p-5 border-2 border-warning/20">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">በመጠባበቅ ላይ</p><p className="text-3xl font-bold text-warning">{stats?.pending ?? 0}</p></div>
              <Clock className="h-10 w-10 text-warning" />
            </div>
          </Card>
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">የቅርብ ጊዜ ቲኬቶችዎ</h2>
            <Link to="/my-tickets" className="text-sm text-primary hover:underline">ሁሉንም ይመልከቱ →</Link>
          </div>
          {!tickets ? <Skeleton className="h-32" /> : tickets.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed py-12 text-center">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">ገና ቲኬት አልገዙም</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tickets.map((tk: any) => (
                <Card key={tk.id} className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {tk.games?.game_image_url && <img src={tk.games.game_image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{tk.games?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tk.ticket_number ? `ቲኬት #${tk.ticket_number}` : `ref: ${tk.payment_reference}`}
                    </p>
                  </div>
                  <StatusBadge s={tk.status} />
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">ጨዋታዎችን ይዳስሱ</h2>
          {!games ? <Skeleton className="h-64" /> : games.length === 0 ? (
            <p className="text-muted-foreground">ምንም ንቁ ጨዋታዎች የሉም</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map((g) => <GameCard key={g.id} game={g as any} />)}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
