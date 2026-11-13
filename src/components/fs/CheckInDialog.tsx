import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "./page";
import { TextField } from "./fields";
import { CHECKIN_STATUS_LABEL, createCheckIn } from "@/lib/domain/checkin";
import { newId, useStore } from "@/lib/storage/store";

export const EMERGENCY_NUMBERS = [
  { n: "193", l: "Bombeiros" },
  { n: "192", l: "SAMU" },
  { n: "190", l: "Polícia Militar" },
  { n: "199", l: "Defesa Civil" },
];

export function EmergencyNumbers() {
  return (
    <div>
      <p className="font-bold">Em emergência, ligue para um serviço público:</p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {EMERGENCY_NUMBERS.map((e) => (
          <li key={e.n}>
            <a
              href={`tel:${e.n}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-sos-light bg-sos-soft px-3 py-2 font-bold text-foreground underline-offset-4 hover:underline"
            >
              {e.n} · {e.l}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">
        Tocar no número só abre o discador do aparelho. Isso não confirma que a ligação foi feita ou atendida.
      </p>
    </div>
  );
}

export function CheckInDialog({ kind, open, onOpenChange }: { kind: "ok" | "sos"; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { update } = useStore();
  const [note, setNote] = useState("");
  const isSos = kind === "sos";
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setNote("");
      }}
      tone={isSos ? "sos" : "safe"}
      title={isSos ? "Registrar SOCORRO neste aparelho?" : "Registrar “ESTÁ TUDO BEM” neste aparelho?"}
      description={
        <div className="space-y-2">
          <p>
            <strong>Nada será enviado.</strong> Esta versão não tem serviço de envio: o registro fica apenas neste aparelho, com data e hora.
            Nenhum contato e nenhuma autoridade será avisado.
          </p>
          {isSos && <p>Para pedir ajuda de verdade, ligue diretamente para os serviços abaixo ou para seus contatos.</p>}
        </div>
      }
      confirmLabel={isSos ? "Registrar SOCORRO (só neste aparelho)" : "Registrar (só neste aparelho)"}
      onConfirm={() => {
        const ok = update((d) => ({ ...d, checkins: [createCheckIn(kind, note, new Date(), newId()), ...d.checkins] }));
        if (ok) toast(CHECKIN_STATUS_LABEL, { description: isSos ? "SOCORRO registrado localmente." : "“Está tudo bem” registrado localmente." });
        setNote("");
      }}
    >
      <div className="space-y-4">
        <TextField label="Observação" optional value={note} onChange={setNote} maxLength={300} hint="Ex.: onde vocês estão. Fica só neste aparelho." />
        {isSos && <EmergencyNumbers />}
      </div>
    </ConfirmDialog>
  );
}

/** The two check-in buttons. Labels + distinct symbols (✓ circle / alert triangle) so state never relies on colour. */
export function CheckInButtons({ hero }: { hero?: boolean }) {
  const [kind, setKind] = useState<"ok" | "sos" | null>(null);
  const big = "h-auto min-h-28 flex-col gap-1 rounded-2xl px-3 py-4 [&_svg]:size-10";
  return (
    <>
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
        <Button variant="safe" size={hero ? "lg" : "default"} className={cn(hero && big)} onClick={() => setKind("ok")} aria-haspopup="dialog">
          <CircleCheck aria-hidden />
          <span className={cn(hero && "text-xl leading-tight")}>Está tudo bem</span>
          {hero && <span className="text-sm font-normal">Registrar neste aparelho</span>}
        </Button>
        <Button variant="sos" size={hero ? "lg" : "default"} className={cn(hero && big)} onClick={() => setKind("sos")} aria-haspopup="dialog">
          <TriangleAlert aria-hidden />
          <span className={cn(hero && "text-xl leading-tight")}>Socorro</span>
          {hero && <span className="text-sm font-normal">Registrar e ver números</span>}
        </Button>
      </div>
      <CheckInDialog kind={kind ?? "ok"} open={kind !== null} onOpenChange={(o) => !o && setKind(null)} />
    </>
  );
}
