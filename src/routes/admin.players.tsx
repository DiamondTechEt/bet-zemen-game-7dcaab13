import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/players")({ component: Players });

function Players() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["players"],
    queryFn: async () => (await supabase.from("profiles").select("*, tickets(id)")).data ?? [],
  });
  const list = (data ?? []).filter((p: any) => !q || p.full_name?.includes(q) || p.phone?.includes(q));
  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-bold">ተጫዋቾች</h1>
      <Input placeholder="በስም ወይም ስልክ ይፈልጉ" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40"><tr><th className="p-3 text-left">ስም</th><th className="p-3 text-left">ስልክ</th><th className="p-3 text-left">ቲኬቶች</th><th className="p-3 text-left">ቀን</th></tr></thead>
          <tbody>
            {list.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-3">{p.full_name}</td><td className="p-3">{p.phone}</td>
                <td className="p-3">{p.tickets?.length ?? 0}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString("am-ET")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
