import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import { FootballAdminProvider } from "@/components/football-admin";
import { SiteHeader, SiteFooter, MobileBottomBar } from "@/components/football";
import { FootballProvider, footballOptions } from "@/components/football-state";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: ({ context }) => context.queryClient.ensureQueryData(footballOptions),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Amigos Fair Play 2026" },
      { name: "description", content: "Futebol entre amigos. Estatísticas e times da nossa pelada." },
      { property: "og:title", content: "Amigos Fair Play 2026" },
      { property: "og:description", content: "Futebol entre amigos. Estatísticas e times da nossa pelada." },
      { name: "theme-color", content: "#0a0a0c" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Fair Play" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const initialTimingReported = useRef(false);

  useEffect(() => {
    // Measure real navigation, not preloads, clicks on the current tab or data refreshes.
    const screenFor = (path: string) => {
      switch (path.replace(/\/$/, "") || "/") {
        case "/": return "statistics";
        case "/times": return "teams";
        case "/socios": return "members";
        default: return "other";
      }
    };
    type Sample = { screen: string; from: string; kind: "initial_load" | "tab_navigation"; start: number };
    let pending: Sample | undefined;
    let frame = 0;
    const cancel = () => {
      cancelAnimationFrame(frame);
      pending = undefined;
    };
    const afterPaint = (sample: Sample) => {
      cancelAnimationFrame(frame);
      // Two frames let the resolved route reach the screen before taking the sample.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (document.visibilityState !== "visible" || pending !== sample) return;
          pending = undefined;
          if (sample.kind === "initial_load") {
            if (initialTimingReported.current) return;
            initialTimingReported.current = true;
          }
          try {
            window.__lovableEvents?.track?.("project.screen_timing", {
              screen: sample.screen,
              from_screen: sample.from,
              kind: sample.kind,
              duration_ms: Math.round((performance.now() - sample.start) * 100) / 100,
              device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
              display_mode: window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true) ? "standalone" : "browser",
            });
          } catch {
            // Optional telemetry must never interrupt football navigation.
          }
        });
      });
    };
    const initialScreen = screenFor(router.state.location.pathname);
    if (!initialTimingReported.current && initialScreen !== "other" && document.visibilityState === "visible") {
      // performance.now() starts at document navigation, including the initial server/data wait.
      pending = { screen: initialScreen, from: "none", kind: "initial_load", start: 0 };
      afterPaint(pending);
    }
    const unsubscribeStart = router.subscribe("onBeforeNavigate", ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged) return;
      cancel();
      const screen = screenFor(toLocation.pathname);
      if (screen === "other" || document.visibilityState !== "visible") return;
      pending = { screen, from: fromLocation ? screenFor(fromLocation.pathname) : "other", kind: "tab_navigation", start: performance.now() };
    });
    const unsubscribeEnd = router.subscribe("onResolved", ({ toLocation }) => {
      if (pending?.kind === "tab_navigation" && pending.screen === screenFor(toLocation.pathname)) afterPaint(pending);
    });
    const onVisibility = () => {
      if (document.visibilityState !== "visible") cancel();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancel();
      unsubscribeStart();
      unsubscribeEnd();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <FootballProvider>
        <FootballAdminProvider>
          <SiteHeader />
          <Outlet />
          <Toaster />
          <SiteFooter />
          <MobileBottomBar />
        </FootballAdminProvider>
      </FootballProvider>
    </QueryClientProvider>
  );
}
