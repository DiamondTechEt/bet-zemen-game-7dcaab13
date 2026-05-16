import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";

export const Route = createFileRoute("/terms")({ component: () => (
  <PageShell><div className="container mx-auto max-w-2xl px-4 py-12">
    <h1 className="mb-4 font-display text-4xl font-bold">ውሎች እና ሁኔታዎች</h1>
    <div className="space-y-3 text-muted-foreground">
      <p>1. የ18 ዓመትና ከዚያ በላይ የሆኑ ብቻ መሳተፍ ይችላሉ።</p>
      <p>2. እያንዳንዱ ቲኬት የተወሰነ ዋጋ ያለው ሲሆን፣ ክፍያ ከተረጋገጠ በኋላ ብቻ ቲኬት ቁጥር ይመደባል።</p>
      <p>3. የተመለሰ ክፍያ የለም።</p>
      <p>4. የአሸናፊዎች ምርጫ በዘፈቀደ የሚደረግ እና የመጨረሻ ነው።</p>
      <p>5. የተሳሳተ መረጃ መስጠት ቲኬቱ እንዲሰረዝ ሊያደርግ ይችላል።</p>
    </div>
  </div></PageShell>
)});
