/**
 * Single, guarded service-worker registration wrapper (offline app shell).
 * Never registers in dev, inside an iframe, in Lovable preview/editor hosts, or with ?sw=off.
 * The service worker caches only the app's own code and page shells — never user data, which
 * stays in this browser's local storage. Nothing is sent to external services.
 */
export const PAGE_CACHE = "fs-pages";
export const APP_ROUTES = [
  "/",
  "/familia",
  "/animais",
  "/moradia",
  "/rede",
  "/reservas",
  "/equipamentos",
  "/saida",
  "/saude",
  "/entretenimento",
  "/avisos",
  "/sobre",
];

export type PwaStatus =
  | "verificando"
  | "nao_suportado"
  | "desativado_previa"
  | "desativado_dev"
  | "desativado_manual"
  | "registrando"
  | "pronto"
  | "atualizado"
  | "erro";

export interface PwaState {
  status: PwaStatus;
  pagesCached: number;
  lastWarm: string | null;
  detail: string;
}

let state: PwaState = { status: "verificando", pagesCached: 0, lastWarm: null, detail: "" };
const listeners = new Set<(s: PwaState) => void>();
let started = false;

function set(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function subscribePwa(fn: (s: PwaState) => void) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

export function refusalReason(loc: { hostname: string; search: string }, opts: { prod: boolean; inIframe: boolean }): PwaStatus | null {
  const host = loc.hostname.toLowerCase();
  if (new URLSearchParams(loc.search).get("sw") === "off") return "desativado_manual";
  if (!opts.prod) return "desativado_dev";
  if (opts.inIframe) return "desativado_previa";
  const label = host.split(".")[0] ?? "";
  const lovableHost = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"].some((d) => host.endsWith(d));
  if (lovableHost && PREVIEW_LABEL.test(label)) return "desativado_previa";
  if (lovableHost && /^project--[a-z0-9-]+-dev$/.test(label)) return "desativado_previa";
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return "desativado_previa";
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return "desativado_previa";
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return "desativado_previa";
  return null;
}

async function unregisterAppWorkers() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith("/sw.js")))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

/** Stores page shells for every module so they can reopen without network after this visit. */
export async function warmPages(): Promise<number> {
  if (!("caches" in window) || !navigator.onLine) return state.pagesCached;
  try {
    const cache = await caches.open(PAGE_CACHE);
    let ok = 0;
    for (const path of APP_ROUTES) {
      try {
        const res = await fetch(path, { credentials: "same-origin", cache: "no-store" });
        if (res.ok && (res.headers.get("content-type") ?? "").includes("text/html")) {
          await cache.put(new Request(new URL(path, location.origin).href), res);
          ok++;
        }
      } catch {
        /* keep going */
      }
    }
    set({ pagesCached: ok, lastWarm: new Date().toISOString() });
    return ok;
  } catch {
    return state.pagesCached;
  }
}

export function startPwa() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!("serviceWorker" in navigator)) {
    set({ status: "nao_suportado", detail: "Este navegador não oferece suporte a funcionamento sem rede." });
    return;
  }
  let inIframe = true;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const refused = refusalReason(window.location, { prod: import.meta.env.PROD, inIframe });
  if (refused) {
    void unregisterAppWorkers();
    set({ status: refused });
    return;
  }
  set({ status: "registrando" });
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) set({ status: "atualizado", detail: "Nova versão instalada. Recarregue a página para usar." });
    void warmPages();
  });
  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then(async (reg) => {
      await navigator.serviceWorker.ready;
      set({ status: state.status === "atualizado" ? "atualizado" : "pronto" });
      void warmPages();
      // Check for updates when the tab regains focus.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine) void reg.update().catch(() => {});
      });
    })
    .catch((e: unknown) => set({ status: "erro", detail: e instanceof Error ? e.message : "Falha ao registrar." }));
}

export const PWA_STATUS_LABEL: Record<PwaStatus, string> = {
  verificando: "Verificando…",
  nao_suportado: "Não suportado neste navegador",
  desativado_previa: "Desativado nesta prévia de revisão",
  desativado_dev: "Desativado no modo de desenvolvimento",
  desativado_manual: "Desativado manualmente (?sw=off)",
  registrando: "Preparando cópia do aplicativo…",
  pronto: "Cópia do aplicativo guardada neste navegador",
  atualizado: "Atualização instalada — recarregue",
  erro: "Falha ao preparar a cópia",
};
