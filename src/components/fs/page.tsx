import { useState, type ReactNode } from "react";
import { AlertTriangle, Clock, Info, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/storage/store";

export function PageHeader({ code, title, description, children }: { code?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {code && <p className="text-sm font-bold uppercase tracking-wider text-foreground">{code}</p>}
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Section({ title, description, children, className, actions }: { title?: string | undefined; description?: string | undefined; children: ReactNode; className?: string | undefined; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-soft sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed bg-card/60 px-6 py-10 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-elevated text-primary [&_svg]:size-7" aria-hidden>
        {icon}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

type NoteTone = "info" | "attention" | "danger" | "pending";
const NOTE: Record<NoteTone, { cls: string; icon: ReactNode; prefix: string }> = {
  info: { cls: "border-info bg-info-soft", icon: <Info className="size-5 text-info" />, prefix: "Informação" },
  attention: { cls: "border-attention bg-attention-soft", icon: <AlertTriangle className="size-5 text-attention" />, prefix: "Atenção" },
  danger: { cls: "border-sos-light bg-sos-soft", icon: <ShieldAlert className="size-5 text-sos-light" />, prefix: "Perigo" },
  pending: { cls: "border-dashed border-input bg-muted", icon: <Clock className="size-5 text-muted-foreground" />, prefix: "Pendente" },
};

export function Note({ tone = "info", title, children }: { tone?: NoteTone; title?: string; children: ReactNode }) {
  const n = NOTE[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border-2 p-4 text-sm", n.cls)} role={tone === "danger" ? "alert" : undefined}>
      <span className="mt-0.5 shrink-0" aria-hidden>{n.icon}</span>
      <div>
        <p className="font-bold">
          <span className="sr-only">{n.prefix}: </span>
          {title ?? n.prefix}
        </p>
        <div className="mt-0.5 text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function PendingList({ items }: { items: string[] }) {
  return (
    <Note tone="pending" title="Ainda não disponível neste módulo">
      <ul className="list-disc pl-5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </Note>
  );
}

type BadgeTone = "neutral" | "info" | "primary" | "attention" | "danger" | "pending";
const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-foreground border-border",
  info: "bg-info-soft text-foreground border-info",
  primary: "bg-primary-soft text-foreground border-primary",
  attention: "bg-attention-soft text-foreground border-attention",
  danger: "bg-sos-soft text-foreground border-sos-light",
  pending: "bg-muted text-foreground border-dashed border-input",
};
export function Tag({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-bold", BADGE[tone])}>{children}</span>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = "default",
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: "default" | "sos" | "safe";
  children?: ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-base text-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancelar</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={tone === "sos" ? "sos" : tone === "safe" ? "safe" : "default"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Edit + delete actions with a confirmation that explains linked records are only unlinked. */
export function RecordActions({ name, onEdit, onDelete, linkedCount = 0 }: { name: string; onEdit: () => void; onDelete: () => void; linkedCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onEdit} aria-label={`Editar ${name}`}>
        <Pencil aria-hidden /> Editar
      </Button>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label={`Excluir ${name}`}>
        <Trash2 aria-hidden /> Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir “${name}”?`}
        description={
          <>
            <p>O registro será removido deste aparelho. Esta ação não pode ser desfeita.</p>
            {linkedCount > 0 && (
              <p className="mt-2">
                {linkedCount} outro(s) registro(s) fazem referência a este. Eles serão mantidos, apenas sem o vínculo.
              </p>
            )}
          </>
        }
        confirmLabel="Excluir definitivamente"
        onConfirm={onDelete}
      />
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button onClick={onClick}>
      <Plus aria-hidden /> {children}
    </Button>
  );
}

export function RecordCard({ title, subtitle, tags, children, actions }: { title: string; subtitle?: string; tags?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {tags && <div className="flex flex-wrap gap-1.5">{tags}</div>}
      </div>
      {children && <div className="text-sm">{children}</div>}
      {actions}
    </article>
  );
}

export function DL({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false);
  if (!shown.length) return null;
  return (
    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
      {shown.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-bold text-muted-foreground">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Wraps a page body: shows a loading placeholder until local data was read. */
export function Ready({ children }: { children: ReactNode }) {
  const { phase } = useStore();
  if (phase === "loading")
    return (
      <p className="py-10 text-center text-muted-foreground" role="status">
        Lendo dados salvos neste aparelho…
      </p>
    );
  return <>{children}</>;
}

export function FormActions({ onCancel, saveLabel = "Salvar" }: { onCancel: () => void; saveLabel?: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      <Button type="submit">{saveLabel}</Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}

export function TestDataWarning() {
  return (
    <Note tone="attention" title="Versão de testes — use apenas dados fictícios">
      Nesta prévia os dados ficam guardados sem criptografia neste navegador. Não registre informações reais de saúde, documentos ou dados sensíveis.
    </Note>
  );
}

export function fmtDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return iso.length === 10 ? d.toLocaleDateString("pt-BR") : d.toLocaleString("pt-BR");
}
