import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { UserPlus, Search, Send, Upload, Ticket, Trophy } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "1. አካውንት ይክፈቱ", desc: "ስልክ ቁጥር እና ስም ብቻ ያስፈልጋል።" },
  { icon: Search, title: "2. ጨዋታ ይምረጡ", desc: "ከንቁ ጨዋታዎች ውስጥ የሚፈልጉትን ይምረጡ።" },
  { icon: Send, title: "3. ገንዘብ ይላኩ", desc: "የተገለጸውን መጠን በተጠቀሰው አካውንት ይላኩ።" },
  { icon: Upload, title: "4. ደረሰኝ ይጫኑ", desc: "የግብይት መለያ ቁጥር እና ደረሰኝ ያስገቡ።" },
  { icon: Ticket, title: "5. የቲኬት ቁጥር ያግኙ", desc: "በራስ-ሰር ከተረጋገጠ በኋላ የቲኬት ቁጥርዎን ይቀበላሉ።" },
  { icon: Trophy, title: "6. ዕጣን ይጠብቁ!", desc: "በዕጣ ቀን አሸናፊ ይታወቃል።" },
];

export const Route = createFileRoute("/how-it-works")({ component: () => (
  <PageShell><div className="container mx-auto px-4 py-12">
    <h1 className="mb-8 text-center font-display text-4xl font-bold">እንዴት ይሰራል</h1>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((s) => (
        <Card key={s.title} className="p-6"><s.icon className="mb-3 h-10 w-10 text-gold" /><h3 className="font-bold">{s.title}</h3><p className="text-sm text-muted-foreground">{s.desc}</p></Card>
      ))}
    </div>
  </div></PageShell>
)});
