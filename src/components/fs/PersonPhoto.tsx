import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldShell } from "./fields";

/** Resize locally; never uploads the original or retains camera metadata. */
export async function preparePersonPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Escolha uma foto JPG, PNG ou WebP.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Escolha uma foto de até 12 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a foto neste navegador.");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL("image/jpeg", 0.75);
    if (result.length > 400_000) throw new Error("Foto muito grande. Escolha uma imagem menor.");
    return result;
  } finally { bitmap.close(); }
}
export function PersonPhoto({ value, onChange, onBusyChange, label = "Foto da pessoa" }: { label?: string; value: string; onChange: (v: string) => void; onBusyChange?: (busy: boolean) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  return <div className="space-y-3">
    <FieldShell label={label} optional hint="JPG, PNG ou WebP. A foto é reduzida neste aparelho e acompanha o backup quando você o guardar.">
      {({ id }) => <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="field-control" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        const current = ++request.current; setBusy(true); onBusyChange?.(true); setError("");
        try { const photo = await preparePersonPhoto(file); if (current === request.current) onChange(photo); }
        catch (err) { setError(err instanceof Error ? err.message : "Não foi possível abrir a foto."); }
        finally { setBusy(false); onBusyChange?.(false); }
      }} />}
    </FieldShell>
    {busy && <p role="status">Preparando foto…</p>}
    {error && <FieldError>{error}</FieldError>}
    {value && <><img src={value} alt="Foto selecionada" className="size-40 rounded-xl object-cover" /><Button type="button" variant="outline" disabled={busy} onClick={() => onChange("")}>Remover foto</Button></>}
  </div>;
}
