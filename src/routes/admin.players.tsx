import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/players")({ component: Players });

function Players() {
  const [q, setQ] = useState("");
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => (await supabase.from("profiles").select("*, tickets(id)").order("created_at", { ascending: false })).data ?? [],
    staleTime: 30_000,
  });

  const toggleAdmin = async (id: string, current: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(!current ? "አስተዳዳሪ ሆኗል" : "አስተዳዳሪነት ተወግዷል"); refetch(); }
  };

  const list = (data ?? []).filter((p: any) => !q || p.full_name?.includes(q) || p.phone?.includes(q));

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">ተጫዋቾች</h1>
      <Input placeholder="በስም ወይም ስልክ ይፈልጉ" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40">
            <tr>
              <th className="p-3 text-left">ስም</th>
              <th className="p-3 text-left">ስልክ</th>
              <th className="p-3 text-left">ቲኬቶች</th>
              <th className="p-3 text-left">ሚና</th>
              <th className="p-3 text-left">ቀን</th>
              <th className="p-3 text-left">እርምጃ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">በመጫን ላይ...</td></tr>}
            {list.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.full_name}</td>
                <td className="p-3">{p.phone}</td>
                <td className="p-3">{p.tickets?.length ?? 0}</td>
                <td className="p-3">{p.is_admin ? <Badge className="bg-gold text-gold-foreground">አስተዳዳሪ</Badge> : <Badge variant="secondary">ተጫዋች</Badge>}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString("am-ET")}</td>
                <td className="p-3">
                  <Button size="sm" variant={p.is_admin ? "outline" : "default"} onClick={() => toggleAdmin(p.id, p.is_admin)}>
                    {p.is_admin ? <><ShieldOff className="mr-1 h-3 w-3" />አስተዳዳሪነት አስወግድ</> : <><ShieldCheck className="mr-1 h-3 w-3" />አስተዳዳሪ አድርግ</>}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
