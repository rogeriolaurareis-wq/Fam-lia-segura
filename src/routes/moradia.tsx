import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Note, PageHeader, Ready, Section, Tag } from "@/components/fs/page";
import { SelectField, TextAreaField, TextField, TriField } from "@/components/fs/fields";
import { RISK_KEYS, RISK_QUESTION, RISK_SHORT, type Home } from "@/lib/domain/types";
import { useStore } from "@/lib/storage/store";
import { HomeLocation } from "@/components/fs/HomeLocation";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/moradia")({
  head: () => pageHead("Moradia", "Endereço de referência, acessos, ponto de encontro e perguntas sobre o entorno da moradia."),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <PageHeader code="M03" title="Moradia" description="Informações sobre onde vocês moram. Preencha manualmente ou use a localização do aparelho. Tudo é opcional." />
      <Ready>
        <HomeForm />
      </Ready>
    </>
  );
}

export function HomeForm() {
  const { data, update, phase, saveError } = useStore();
  const [h, setH] = useState<Home>(data.home);
  const addressAtLocation = useRef(h.address);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  useEffect(() => {
    if (!dirty) setH(data.home);
  }, [data.home, dirty]);
  const set = <K extends keyof Home>(k: K, v: Home[K]) => {
    setH((p) => ({ ...p, [k]: v }));
    setDirty(true);
    setSaveMessage("");
  };
  const save = () => {
    if (update(d => ({ ...d, home: h }))) {
      setDirty(false);
      setSaveMessage(phase === "memory" ? "Dados apenas temporários: este navegador não permite salvar. Não feche a aba." : "Moradia salva neste aparelho.");
      return true;
    }
    setSaveMessage("Não foi possível salvar a moradia. As alterações continuam nesta tela. Confira o aviso de armazenamento e tente novamente.");
    return false;
  };
  useEffect(() => {
    if (!dirty || phase !== "ready") return;
    const timer = setTimeout(save, 450);
    return () => clearTimeout(timer);
  }, [dirty, h, phase, update]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save();
  };
  const answered = RISK_KEYS.filter((k) => h.risks[k]).length;

  return (
    <form onSubmit={submit} onBlurCapture={() => { if (dirty && phase === "ready") save(); }} noValidate className="space-y-6">
      <Section title="Endereço e acessos">
        <div className="grid gap-5 sm:grid-cols-2">
          <HomeLocation onLocation={(location, address) => {
            setH(prev => {
              if (!address) addressAtLocation.current = prev.address;
              return { ...prev, location, ...(address && prev.address === addressAtLocation.current ? { address } : {}) };
            });
            setDirty(true);
          }} />
          {h.location && <div className="sm:col-span-2 text-sm"><p>Coordenadas: {h.location.latitude.toFixed(5)}, {h.location.longitude.toFixed(5)} · precisão aproximada de {Math.round(h.location.accuracy)} m</p><Button type="button" variant="ghost" size="sm" onClick={() => { setH(prev => { const { location, ...rest } = prev; return rest; }); setDirty(true); }}>Remover coordenadas</Button></div>}
          <TextField label="Endereço" optional hint="Confira o endereço sugerido e complete número e complemento. Você também pode digitar manualmente." value={h.address} onChange={(v) => set("address", v)} maxLength={500} />
          <TextField label="Ponto de referência" optional value={h.reference} onChange={(v) => set("reference", v)} />
          <SelectField
            label="Tipo de moradia"
            optional
            value={h.type}
            onChange={(v) => set("type", v)}
            placeholder="Não informar"
            options={[
              { value: "casa", label: "Casa" },
              { value: "apartamento", label: "Apartamento" },
              { value: "sobrado", label: "Sobrado" },
              { value: "outro", label: "Outro" },
            ]}
          />
          <TextField label="Andar" optional value={h.floor} onChange={(v) => set("floor", v)} maxLength={20} />
          <div className="sm:col-span-2">
            <TextAreaField label="Acessos e saídas" optional hint="Ex.: escada, rampa, portão lateral, elevador" value={h.access} onChange={(v) => set("access", v)} />
          </div>
        </div>
      </Section>

      <Section title="Ponto de encontro" description="Onde a família se reencontra se precisar sair ou se separar.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Ponto de encontro principal" optional value={h.meetingPoint} onChange={(v) => set("meetingPoint", v)} />
          <TextField label="Ponto de encontro alternativo" optional value={h.meetingPointAlt} onChange={(v) => set("meetingPointAlt", v)} />
        </div>
      </Section>

      <HomeRiskChart home={h} />

      <Section title="Entorno da moradia" description={`${answered} de ${RISK_KEYS.length} perguntas respondidas.`}>
        <div className="mb-5 space-y-3">
          <Note tone="danger" title="Não se aproxime de perigos para responder">
            Responda com o que você já sabe. Não vá até rios, encostas, fios ou construções para verificar.
          </Note>
          <Note tone="info" title="Sobre o gráfico de riscos">
            O gráfico resume os riscos informados e as perguntas pendentes. Ele não gera laudo nem afirma que o imóvel é seguro. Para avaliação técnica, procure a Defesa Civil do seu município.
          </Note>
        </div>
        <div className="space-y-6">
          {RISK_KEYS.map((k) => (
            <TriField key={k} label={RISK_QUESTION[k]} value={h.risks[k]} allowEmpty onChange={(v) => set("risks", { ...h.risks, [k]: v })} />
          ))}
        </div>
      </Section>

      <Section title="Observações">
        <TextAreaField label="Observações" optional value={h.notes} onChange={(v) => set("notes", v)} />
      </Section>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-lift lg:bottom-4">
        <Button type="submit">Salvar moradia</Button>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {dirty ? (saveError ? "Alterações não salvas: tente salvar novamente." : "Salvando alterações…") : (saveMessage || "Nenhuma alteração pendente.")}
        </span>
      </div>
    </form>
  );
}

function HomeRiskChart({ home }: { home: Home }) {
  const groups = [
    { label: "Riscos informados", count: RISK_KEYS.filter(k => home.risks[k] === "sim").length, color: "bg-destructive" },
    { label: "Não observados", count: RISK_KEYS.filter(k => home.risks[k] === "nao").length, color: "bg-primary" },
    { label: "Não sei / sem resposta", count: RISK_KEYS.filter(k => !home.risks[k] || home.risks[k] === "nao_sei").length, color: "bg-amber-500" },
  ];
  return <Section title="Gráfico de riscos do imóvel" description="Resumo das suas respostas. Não é laudo nem classificação técnica de segurança.">
    <div role="img" aria-label={groups.map(g => `${g.label}: ${g.count} de ${RISK_KEYS.length}`).join(". ")} className="mb-4 flex h-8 overflow-hidden rounded-lg bg-muted">
      {groups.map(g => g.count > 0 && <div key={g.label} className={`${g.color} flex items-center justify-center font-bold text-white`} style={{ width: `${g.count / RISK_KEYS.length * 100}%` }}>{g.count}</div>)}
    </div>
    <ul className="mb-5 flex flex-wrap gap-4 text-sm">{groups.map(g => <li key={g.label} className="flex items-center gap-2"><span aria-hidden className={`size-3 rounded ${g.color}`} />{g.label}: <strong>{g.count}</strong></li>)}</ul>
    <ul className="divide-y">{RISK_KEYS.map(k => <li key={k} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{RISK_SHORT[k]}</span><Tag tone={home.risks[k] === "sim" ? "danger" : home.risks[k] === "nao" ? "neutral" : "pending"}>{home.risks[k] === "sim" ? "Risco informado" : home.risks[k] === "nao" ? "Não observado" : home.risks[k] === "nao_sei" ? "Não sei" : "Sem resposta"}</Tag></li>)}</ul>
  </Section>;
}
