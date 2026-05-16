import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatETB, t } from "@/lib/i18n";
import { Ticket, Trophy, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface Game {
  id: string;
  title: string;
  prize_description: string | null;
  ticket_price: number;
  total_tickets: number;
  tickets_sold: number;
  game_image_url: string | null;
  ends_at: string | null;
  status: string;
}

function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState(() => +new Date(to) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(+new Date(to) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [to]);
  if (left <= 0) return <span>አለፈ</span>;
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="font-mono">{d}ቀ {h}ሰ {m}ደ {s}ሰ</span>;
}

export function GameCard({ game }: { game: Game }) {
  const pct = (game.tickets_sold / game.total_tickets) * 100;
  const lowStock = pct >= 90;

  return (
    <Card className="group overflow-hidden border-2 transition hover:border-gold hover:shadow-gold">
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {game.game_image_url ? (
          <img src={game.game_image_url} alt={game.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-hero text-primary-foreground">
            <Trophy className="h-16 w-16 opacity-50" />
          </div>
        )}
        <div className="absolute right-2 top-2 rounded-full bg-gold px-3 py-1 text-sm font-bold text-gold-foreground shadow-gold">
          {formatETB(game.ticket_price)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 text-lg font-bold">{game.title}</h3>
        <p className="mb-3 line-clamp-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-gold" /> {game.prize_description}
        </p>
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span>{game.tickets_sold}/{game.total_tickets} {t.ticketsSold}</span>
            <span className={lowStock ? "font-bold text-destructive" : "text-muted-foreground"}>
              {Math.round(pct)}%
            </span>
          </div>
          <Progress value={pct} className={lowStock ? "[&>div]:bg-destructive" : ""} />
        </div>
        {game.ends_at && (
          <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> <Countdown to={game.ends_at} />
          </p>
        )}
        <Link to="/games/$id" params={{ id: game.id }}>
          <Button className="w-full" disabled={game.status !== "active" || pct >= 100}>
            <Ticket className="mr-2 h-4 w-4" />{t.buyTicket}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
