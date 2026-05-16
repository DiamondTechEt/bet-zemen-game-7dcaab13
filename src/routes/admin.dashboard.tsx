import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Gamepad2, DollarSign, CheckSquare, Clock } from "lucide-react";
import { formatETB } from "@/lib/i18n";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDash });

function AdminDash() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [g, t, pend, rev] = await Promise.all([
        supabase.from("games").select("id, status"),
        supabase.from("tickets").select("id, status, verified_amount, created_at, games(title), profiles(full_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "payment_uploaded"),
        supabase.from("tickets").select("verified_amount").eq("status", "verified"),
      ]);
      const revenue = (rev.data ?? []).reduce((s, x) => s + Number(x.verified_amount ?? 0), 0);
      return {
        total: g.data?.length ?? 0,
        active: g.data?.filter((x) => x.status === "active").length ?? 0,
        pending: pend.count ?? 0,
        revenue,
        recent: t.data ?? [],
      };
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">አስተዳዳሪ ዋና ገጽ</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">ጠቅላላ ጨዋታዎች</p><p className="text-3xl font-bold">{data?.total ?? 0}</p></div><Gamepad2 className="h-8 w-8 text-primary" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">ንቁ ጨዋታዎች</p><p className="text-3xl font-bold">{data?.active ?? 0}</p></div><CheckSquare className="h-8 w-8 text-success" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">ለማረጋገጥ</p><p className="text-3xl font-bold">{data?.pending ?? 0}</p></div><Clock className="h-8 w-8 text-warning" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">ጠቅላላ ገቢ</p><p className="text-xl font-bold">{formatETB(data?.revenue ?? 0)}</p></div><DollarSign className="h-8 w-8 text-gold" /></div></Card>
      </div>
      <h2 className="mt-8 mb-3 font-display text-xl font-bold">የቅርብ ጊዜ ቲኬቶች</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40"><tr><th className="p-3 text-left">ጨዋታ</th><th className="p-3 text-left">ተጫዋች</th><th className="p-3 text-left">ሁኔታ</th><th className="p-3 text-left">ቀን</th></tr></thead>
          <tbody>
            {data?.recent.map((t: any) => (
              <tr key={t.id} className="border-b">
                <td className="p-3">{t.games?.title}</td>
                <td className="p-3">{t.profiles?.full_name}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3">{new Date(t.created_at).toLocaleDateString("am-ET")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
