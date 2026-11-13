import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Download, FlaskConical, Menu, Wifi, WifiOff, CloudOff, Loader2, HardDrive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/storage/store";
import { NET_LABEL, useConnectivity } from "@/lib/connectivity";
import { startPwa } from "@/lib/pwa";
import { CheckInButtons } from "./CheckInDialog";
import { Logo } from "./Logo";
import { ConfirmDialog, Note } from "./page";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Módulos">
      <ul className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg border-2 px-3 py-2 font-bold transition-colors",
                  active
                    ? "border-primary bg-sidebar-primary text-sidebar-primary-foreground"
                    : "border-transparent text-sidebar-foreground hover:border-input hover:bg-sidebar-accent",
                )}
              >
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.code && <span className="text-xs font-normal">{item.code}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Connectivity() {
  const net = useConnectivity();
  const Icon = net.status === "conectado" ? Wifi : net.status === "verificando" ? Loader2 : net.status === "sem_rede" ? WifiOff : CloudOff;
  const time = net.checkedAt ? new Date(net.checkedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <button
      type="button"
      onClick={net.recheck}
      className={cn(
        "flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold",
        "bg-elevated text-foreground hover:bg-elevated-hover",
        net.status === "conectado" ? "border-input" : "border-dashed border-attention",
      )}
      aria-live="polite"
      title="Toque para verificar a conexão de novo"
    >
      <Icon className={cn("size-4", net.status === "verificando" && "animate-spin")} aria-hidden />
      <span>{NET_LABEL[net.status]}</span>
      {time && <span className="hidden font-normal sm:inline">· {time}</span>}
    </button>
  );
}

function SaveStatus() {
  const { phase, savedAt, saveError } = useStore();
  if (phase === "loading") return null;
  const text =
    phase === "blocked"
      ? "Salvamento bloqueado"
      : phase === "memory"
        ? "Sem salvamento local"
        : saveError
          ? "Última alteração não salva"
          : savedAt
            ? `Salvo neste aparelho ${new Date(savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Nada salvo ainda";
  const warn = phase !== "ready" || !!saveError;
  return (
    <span className={cn("hidden items-center gap-1.5 text-sm md:flex", warn ? "font-bold" : "")}>
      <HardDrive className="size-4" aria-hidden /> {text}
    </span>
  );
}

function StorageBanners() {
  const { phase, blocked, memoryReason, saveError, resetBlocked, exportText, hasDemo, removeDemo } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const download = () => {
    const blob = new Blob([exportText()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `familia-segura-copia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="mb-6 flex flex-col gap-3 empty:hidden">
      {phase === "blocked" && blocked && (
        <Note tone="attention" title="Os dados salvos não puderam ser lidos">
          <p>
            {blocked.status === "newer"
              ? `Os dados foram salvos por uma versão mais nova do aplicativo (versão ${blocked.version}).`
              : blocked.reason}{" "}
            Para proteger suas informações, nada foi apagado e o salvamento está bloqueado.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={download}>
              <Download aria-hidden /> Baixar cópia dos dados brutos
            </Button>
            {blocked.status === "corrupt" && (
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
                Começar do zero (guardando cópia)
              </Button>
            )}
          </div>
          <ConfirmDialog
            open={confirmReset}
            onOpenChange={setConfirmReset}
            title="Começar um cadastro novo?"
            description="O conteúdo ilegível será guardado como cópia de segurança neste navegador antes de iniciar um cadastro vazio. Recomendamos baixar a cópia antes."
            confirmLabel="Guardar cópia e começar do zero"
            onConfirm={resetBlocked}
          />
        </Note>
      )}
      {phase === "memory" && (
        <Note tone="attention" title="Este navegador não permite salvar">
          {memoryReason} O que você digitar ficará só até fechar esta aba.
        </Note>
      )}
      {saveError && phase === "ready" && (
        <Note tone="attention" title="A última alteração não foi salva">
          {saveError}
        </Note>
      )}
      {hasDemo && (
        <Note tone="info" title="Há dados de exemplo fictícios">
          <p>Registros marcados como “exemplo” são inventados, apenas para testar as telas.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setConfirmDemo(true)}>
            Remover dados de exemplo
          </Button>
          <ConfirmDialog
            open={confirmDemo}
            onOpenChange={setConfirmDemo}
            title="Remover os dados de exemplo?"
            description="Somente os registros fictícios serão removidos. O que você cadastrou continua salvo."
            confirmLabel="Remover exemplos"
            onConfirm={removeDemo}
          />
        </Note>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = useRouterState({ select: (st) => st.location.pathname === "/" });
  useEffect(() => {
    startPwa();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="hazard-tape pointer-events-none fixed inset-x-0 top-0 z-50 h-1" aria-hidden />
      <div className="hazard-tape pointer-events-none fixed inset-x-0 bottom-0 z-50 h-1" aria-hidden />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3 focus:font-bold">
        Pular para o conteúdo
      </a>
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-sidebar p-4 lg:flex">
          <Brand />
          <NavList />
          <div className="mt-auto space-y-2 border-t pt-4">
            <p className="text-sm font-bold text-muted-foreground">Check-in rápido (fica só neste aparelho)</p>
            <CheckInButtons />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2 px-4 pb-2.5 pt-3.5 sm:px-6">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu de módulos">
                <Menu aria-hidden />
              </Button>
              <div className="lg:hidden">
                <Brand small />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <SaveStatus />
                <Connectivity />
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-attention bg-attention-soft px-4 py-1.5 text-sm text-foreground sm:px-6">
              <FlaskConical className="size-4 shrink-0 text-attention" aria-hidden />
              <span>
                <strong>Versão de testes.</strong> Dados locais e backup opcional; proteção ainda em testes. Use dados fictícios.{" "}
                <Link to="/sobre" className="underline decoration-2 underline-offset-2">
                  Saiba mais
                </Link>
              </span>
            </div>
          </header>

          <main id="conteudo" className={cn("mx-auto w-full max-w-5xl flex-1 px-4 pt-6 sm:px-6 lg:pb-12", isHome ? "pb-12" : "pb-32")}>
            <StorageBanners />
            {children}
          </main>
        </div>
      </div>

      {!isHome && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-3 pt-2 backdrop-blur lg:hidden">
          <CheckInButtons />
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto bg-sidebar p-4">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle asChild>
              <div>
                <Brand />
              </div>
            </SheetTitle>
          </SheetHeader>
          <NavList onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Brand({ small }: { small?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Família Segura — ir para o painel">
      <Logo className={small ? "h-10 w-9" : "h-12 w-11"} />
      <span className="flex flex-col leading-tight">
        <span className={cn("font-display font-bold text-foreground", small ? "text-lg" : "text-xl")}>Família Segura</span>
        {!small && <span className="text-sm text-foreground">Dados neste aparelho</span>}
      </span>
    </Link>
  );
}
