import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";

export const Route = createFileRoute("/about")({ component: () => (
  <PageShell><div className="container mx-auto max-w-2xl px-4 py-12 prose">
    <h1 className="font-display text-4xl font-bold">ስለ ቲኬት ዊን</h1>
    <p className="mt-4 text-muted-foreground">ቲኬት ዊን ለኢትዮጵያውያን የተዘጋጀ የመጀመሪያው ግልጽና ታማኝ የመስመር ላይ ዕጣ መድረክ ነው። ዓላማችን ሰዎች በቀላሉ እንዲሳተፉ እና ድንቅ ሽልማቶችን እንዲያሸንፉ ማስቻል ነው። ሁሉም ክፍያዎች በራስ-ሰር ይረጋገጣሉ፣ የአሸናፊዎች ምርጫም በሰርቨር-ሳይድ የዘፈቀደ ምርጫ ይከናወናል።</p>
  </div></PageShell>
)});
