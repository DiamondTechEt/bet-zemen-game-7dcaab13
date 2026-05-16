import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatETB, t } from "@/lib/i18n";

export const Route = createFileRoute("/admin/games/$id/tickets")({ component: AdminTickets });

function AdminTickets() {
  const { id } = Route.useParams();
  const [filter, setFilter] = useState("all");
  const { data, refetch } = useQuery({
    queryKey: ["admin-tickets", id],
    queryFn: async () => {
      const { data: g } = await supabase.from("games").select("*").eq("id", id).single();
      const { data: tks } = await supabase.from("tickets").select("*, profiles(full_name, phone)").eq("game_id", id).order("created_at", { ascending: false });
      return { g, tks: tks ?? [] };
    },
  });

  const update = async (tid: string, status: string, reason?: string) => {
    if (status === "verified") {
      const { data: tk } = await supabase.from("tickets").select("verified_amount").eq("id", tid).single();
      const { error } = await supabase.rpc("assign_ticket_number" as any, { _ticket_id: tid, _verified_amount: tk?.verified_amount ?? data?.g?.ticket_price ?? 0 });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("tickets").update({ status: status as any, rejection_reason: reason ?? null }).eq("id", tid);
      if (error) return toast.error(error.message);
    }
    toast.success("ተዘምኗል"); refetch();
  };

  const filtered = (data?.tks ?? []).filter((tk: any) => {
    if (filter === "all") return true;
    if (filter === "pending") return tk.status === "payment_uploaded";
    return tk.status === filter;
  });

  return (
    <div>
      {data?.g && (
        <Card className="mb-4 p-4">
          <h1 className="font-display text-xl font-bold">{data.g.title}</h1>
          <p className="text-sm text-muted-foreground">ገቢ: {formatETB((data.tks ?? []).filter((t: any) => t.status === "verified").reduce((s: number, t: any) => s + Number(t.verified_amount ?? 0), 0))}</p>
        </Card>
      )}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList><TabsTrigger value="all">ሁሉም</TabsTrigger><TabsTrigger value="pending">በመጠባበቅ</TabsTrigger><TabsTrigger value="verified">ተረጋግጧል</TabsTrigger><TabsTrigger value="rejected">ተቀባይነት የለውም</TabsTrigger></TabsList>
      </Tabs>
      <Card className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">ተጫዋች</th><th className="p-2 text-left">ስልክ</th><th className="p-2 text-left">ባንክ</th><th className="p-2 text-left">Ref</th><th className="p-2 text-left">ሁኔታ</th><th className="p-2 text-left">እርምጃ</th></tr></thead>
          <tbody>
            {filtered.map((tk: any) => (
              <tr key={tk.id} className="border-b">
                <td className="p-2 font-mono">{tk.ticket_number ?? "—"}</td>
                <td className="p-2">{tk.profiles?.full_name}</td>
                <td className="p-2">{tk.profiles?.phone}</td>
                <td className="p-2">{tk.payment_bank}</td>
                <td className="p-2 font-mono text-xs">{tk.payment_reference}</td>
                <td className="p-2"><Badge>{tk.status}</Badge></td>
                <td className="flex gap-1 p-2">
                  {tk.status !== "verified" && <Button size="sm" onClick={() => update(tk.id, "verified")}>አረጋግጥ</Button>}
                  {tk.status !== "rejected" && <Button size="sm" variant="destructive" onClick={() => update(tk.id, "rejected", prompt("ምክንያት") ?? undefined)}>አትቀበል</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
