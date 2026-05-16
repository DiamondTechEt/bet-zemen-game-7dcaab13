import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { Trophy, Sparkles, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "ቲኬት ዊን — የኢትዮጵያ የመስመር ላይ ዕጣ" },
      { name: "description", content: "በቀላሉ ቲኬት ይግዙ፣ ዕጣ ይሳተፉ እና ድንቅ ሽልማቶችን ያሸንፉ።" },
    ],
  }),
});

function Home() {
  const { data: games, isLoading } = useQuery({
    queryKey: ["active-games"],
    queryFn: async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .in("status", ["active", "closed", "completed"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const active = games?.filter((g) => g.status === "active") ?? [];
  const completed = games?.filter((g) => g.status === "completed") ?? [];

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 60%, white 0%, transparent 40%)" }} />
        <div className="container relative mx-auto px-4 py-20 text-center md:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/20 px-4 py-1 text-sm font-medium text-gold">
            <Sparkles className="h-4 w-4" /> {t.tagline}
          </div>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            <span className="text-gold">ቲኬት</span> ይግዙ።<br />
            ዕጣዎን ይሞክሩ።<br />
            <span className="text-gold">ሽልማት</span> ያሸንፉ።
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg opacity-90">
            በታማኝና ግልጽ በሆነ የመስመር ላይ ዕጣ መድረክ ላይ ይሳተፉ። ክፍያዎች በራስ-ሰር ይረጋገጣሉ።
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-gold text-gold-foreground hover:opacity-90 shadow-gold">
                አካውንት ይክፈቱ
              </Button>
            </Link>
            <a href="#games">
              <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-gold-foreground">
                ጨዋታዎችን ይመልከቱ
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-card py-10">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "ደህንነቱ የተጠበቀ", desc: "ሁሉም ክፍያዎች በራስ-ሰር ይረጋገጣሉ" },
            { icon: Zap, title: "ፈጣን", desc: "በደቂቃዎች ውስጥ ቲኬት ያግኙ" },
            { icon: Trophy, title: "ግልጽ ዕጣ", desc: "በሰርቨር-ሳይድ የዘፈቀደ ምርጫ" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-gold/20 p-3 text-gold">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active games */}
      <section id="games" className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">{t.activeGames}</h2>
            <p className="text-muted-foreground">አሁን ላይ የሚገኙ ዕጣዎች</p>
          </div>
        </div>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">በአሁኑ ጊዜ ምንም ንቁ ጨዋታ የለም። ቆይተው ይመለሱ።</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {active.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>

      {/* Past winners */}
      {completed.length > 0 && (
        <section className="bg-secondary/40 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 font-display text-3xl font-bold">ያለፉ አሸናፊዎች</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completed.slice(0, 6).map((g) => (
                <Link key={g.id} to="/games/$id/winner" params={{ id: g.id }}>
                  <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-gold">
                    <Trophy className="h-8 w-8 text-gold" />
                    <div>
                      <p className="font-bold">{g.title}</p>
                      <p className="text-xs text-muted-foreground">አሸናፊውን ይመልከቱ →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
