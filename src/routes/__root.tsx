import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">ገጹ አልተገኘም</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          የፈለጉት ገጽ የለም ወይም ተንቀሳቅሷል።
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            ወደ ዋና ገጽ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">ይቅርታ፣ ችግር ተፈጥሯል</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          እንደገና ይሞክሩ
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ቲኬት ዊን — የኢትዮጵያ የመስመር ላይ ዕጣ" },
      { name: "description", content: "በኢትዮጵያ ውስጥ ቲኬት ይግዙ፣ ይሳተፉ እና ሽልማት ያሸንፉ።" },
      { property: "og:title", content: "ቲኬት ዊን — የኢትዮጵያ የመስመር ላይ ዕጣ" },
      { property: "og:description", content: "በኢትዮጵያ ውስጥ ቲኬት ይግዙ፣ ይሳተፉ እና ሽልማት ያሸንፉ።" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ቲኬት ዊን — የኢትዮጵያ የመስመር ላይ ዕጣ" },
      { name: "twitter:description", content: "በኢትዮጵያ ውስጥ ቲኬት ይግዙ፣ ይሳተፉ እና ሽልማት ያሸንፉ።" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f9ba6210-71c5-4491-aea3-49a265bf636d/id-preview-02bbbd93--bc4487f2-515d-40b0-999d-76c5097527a4.lovable.app-1778952133985.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f9ba6210-71c5-4491-aea3-49a265bf636d/id-preview-02bbbd93--bc4487f2-515d-40b0-999d-76c5097527a4.lovable.app-1778952133985.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Noto+Serif+Ethiopic:wght@600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
