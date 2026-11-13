import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Note, PageHeader, Ready, Section } from "@/components/fs/page";
import { SelectField, TextAreaField, TextField, TriField } from "@/components/fs/fields";
import { RISK_KEYS, RISK_QUESTION, type Home } from "@/lib/domain/types";
import { useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/moradia")({
  head: () => pageHead("Moradia", "Endereço de referência, acessos, ponto de encontro e perguntas sobre o entorno da moradia."),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <PageHeader code="M03" title="Moradia" description="Informações sobre onde vocês moram. Tudo é opcional e fica só neste aparelho." />
      <Ready>
        <HomeForm />
      </Ready>
    </>
  );
}

function HomeForm() {
  const { data, update } = useStore();
  const [h, setH] = useState<Home>(data.home);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setH(data.home);
  }, [data.home, dirty]);
  const set = <K extends keyof Home>(k: K, v: Home[K]) => {
    setH((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (update((d) => ({ ...d, home: h }))) {
      setDirty(false);
      toast.success("Moradia salva neste aparelho.");
    }
  };
  const answered = RISK_KEYS.filter((k) => h.risks[k]).length;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Section title="Endereço e acessos">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Endereço" optional hint="Digitado manualmente. Não usamos localização automática." value={h.address} onChange={(v) => set("address", v)} maxLength={200} />
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

      <Section title="Entorno da moradia" description={`${answered} de ${RISK_KEYS.length} perguntas respondidas.`}>
        <div className="mb-5 space-y-3">
          <Note tone="danger" title="Não se aproxime de perigos para responder">
            Responda com o que você já sabe. Não vá até rios, encostas, fios ou construções para verificar.
          </Note>
          <Note tone="info" title="Isto não é uma avaliação de risco">
            As respostas não geram nota, laudo ou classificação. Para avaliação técnica, procure a Defesa Civil do seu município.
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
          {dirty ? "Há alterações não salvas." : "Tudo salvo."}
        </span>
      </div>
    </form>
  );
}
