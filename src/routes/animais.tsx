import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PersonPhoto } from "@/components/fs/PersonPhoto";
import { AddButton, DL, EmptyState, FormActions, PageHeader, Ready, RecordActions, RecordCard, Section, Tag, TestDataWarning } from "@/components/fs/page";
import { CheckField, FormErrorSummary, NumberField, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { countLinks } from "@/lib/domain/links";
import { hasErrors, validateAnimal, type Errs } from "@/lib/domain/validate";
import { SIZE_LABEL, SPECIES_LABEL, TRI_LABEL, type Animal, type Species, type Tri } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/animais")({
  head: () => pageHead("Animais", "Cadastro dos animais da família: espécie, porte, comportamento, vacinação e responsável."),
  component: AnimalsPage,
});

function newAnimal(): Animal {
  const now = nowIso();
  return {
    id: newId(), createdAt: now, updatedAt: now, name: "", species: "cao", speciesOther: "", breed: "", sex: "", ageText: "",
    weightKg: null, size: "", identification: "", microchip: "", neutered: "", pregnancyLactation: "", conditions: "",
    allergies: "", mobility: "", behavior: "", dietRestriction: "", continuousUse: false, vaccination: "", vet: "",
    responsibleId: null, notes: "",
  };
}

const triOptions = (Object.keys(TRI_LABEL) as Tri[]).map((v) => ({ value: v, label: TRI_LABEL[v] }));

function AnimalsPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Animal | null>(null);

  if (editing)
    return (
      <Ready>
        <AnimalForm key={editing.id} initial={editing} onCancel={() => setEditing(null)} onSave={(a, addAnother) => { if (upsert("animals", { ...a, updatedAt: nowIso() })) setEditing(addAnother ? newAnimal() : null); }} />
      </Ready>
    );

  return (
    <>
      <PageHeader code="M02" title="Animais" description="Cadastro dos animais. Ração e outros suprimentos ficam em Reservas; tratamentos em Saúde e cuidados.">
        <AddButton onClick={() => setEditing(newAnimal())}>Adicionar animal</AddButton>
      </PageHeader>
      <Ready>
        {data.animals.length === 0 ? (
          <EmptyState
            icon={<PawPrint />}
            title="Nenhum animal cadastrado"
            text="Se a família tem animais, cadastre cada um. Isso ajuda no plano de saída e na contagem de espaços."
            action={<AddButton onClick={() => setEditing(newAnimal())}>Adicionar animal</AddButton>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.animals.map((a) => {
              const resp = data.people.find((p) => p.id === a.responsibleId);
              return (
                <RecordCard
                  key={a.id}
                  title={a.name}
                  subtitle={[a.species === "outro" ? a.speciesOther : SPECIES_LABEL[a.species], a.breed, a.ageText].filter(Boolean).join(" · ")}
                  tags={
                    <>
                      {a.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                      {a.size && <Tag tone="info">Porte {SIZE_LABEL[a.size].toLowerCase()}</Tag>}
                      {a.continuousUse && <Tag tone="attention">Uso contínuo</Tag>}
                    </>
                  }
                  actions={<RecordActions name={a.name} onEdit={() => setEditing(a)} onDelete={() => remove("animals", a.id)} linkedCount={countLinks(data, "animals", a.id)} />}
                >
                  {a.photoDataUrl && <img src={a.photoDataUrl} alt={`Foto de ${a.name}`} className="mb-4 size-28 rounded-xl object-cover" />}
                  <DL
                    items={[
                      ["Cor ou cores", a.color ?? ""],
                      ["Pelagem ou cobertura", a.coatType ?? ""],
                      ["Sinais particulares", a.identification],
                      ["Microchip", a.microchip],
                      ["Comportamento", a.behavior],
                      ["Restrição de dieta", a.dietRestriction],
                      ["Vacinação", a.vaccination],
                      ["Veterinário", a.vet],
                      ["Responsável", resp?.name ?? (a.responsibleId ? "Removido" : "")],
                    ]}
                  />
                </RecordCard>
              );
            })}
          </div>
        )}
      </Ready>
    </>
  );
}

function AnimalForm({ initial, onSave, onCancel }: { initial: Animal; onSave: (a: Animal, addAnother?: boolean) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [a, setA] = useState(initial);
  const [photoBusy, setPhotoBusy] = useState(false);
  const saveAndContinue = useRef(false);
  const [errors, setErrors] = useState<Errs<Animal>>({});
  const set = <K extends keyof Animal>(k: K, v: Animal[K]) => setA((p) => ({ ...p, [k]: v }));
  const isNew = !data.animals.some((x) => x.id === initial.id);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const addAnother = saveAndContinue.current;
    saveAndContinue.current = false;
    if (photoBusy) return;
    const errs = validateAnimal(a);
    setErrors(errs);
    if (!hasErrors(errs)) {
      const record = { ...a, name: a.name.trim() };
      if (addAnother) onSave(record, true);
      else onSave(record);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M02" title={isNew ? "Novo animal" : `Editar: ${initial.name}`} description="Só o nome é obrigatório." />
      <FormErrorSummary errors={errors} />
      <Section title="Identificação do pet" description="Foto e características ajudam a reconhecer o animal. Todos esses detalhes são opcionais.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><PersonPhoto label="Foto do pet" value={a.photoDataUrl ?? ""} onChange={v => set("photoDataUrl", v)} onBusyChange={setPhotoBusy} /></div>
          <TextField label="Nome" value={a.name} onChange={(v) => set("name", v)} error={errors.name} maxLength={60} />
          <SelectField label="Espécie" value={a.species} onChange={(v) => set("species", v as Species)} options={(Object.keys(SPECIES_LABEL) as Species[]).map((s) => ({ value: s, label: SPECIES_LABEL[s] }))} />
          {a.species === "outro" && <TextField label="Qual espécie?" value={a.speciesOther} onChange={(v) => set("speciesOther", v)} error={errors.speciesOther} />}
          <TextField label="Raça" optional value={a.breed} onChange={(v) => set("breed", v)} />
          <SelectField label="Sexo" optional value={a.sex} onChange={(v) => set("sex", v)} placeholder="Não informar" options={[{ value: "femea", label: "Fêmea" }, { value: "macho", label: "Macho" }, { value: "nao_sei", label: "Não sei" }]} />
          <TextField label="Idade" optional hint="Ex.: 3 anos, filhote" value={a.ageText} onChange={(v) => set("ageText", v)} />
          <NumberField label="Peso" optional suffix="kg" value={a.weightKg} onChange={(v) => set("weightKg", v)} error={errors.weightKg} />
          <SelectField label="Porte" optional value={a.size} onChange={(v) => set("size", v)} placeholder="Não informar" options={[{ value: "pequeno", label: "Pequeno" }, { value: "medio", label: "Médio" }, { value: "grande", label: "Grande" }]} />
          <TextField label="Cor ou cores" optional hint="Ex.: preto e branco, caramelo, cinza rajado. Descreva também as manchas." value={a.color ?? ""} onChange={(v) => set("color", v)} maxLength={200} />
          <TextField label="Tipo de pelagem ou cobertura" optional hint="Ex.: pelo curto e liso, longo, encaracolado, sem pelos, penas ou escamas." value={a.coatType ?? ""} onChange={(v) => set("coatType", v)} maxLength={200} />
          <TextAreaField label="Sinais particulares e identificação" optional hint="Ex.: mancha branca na pata, orelha dobrada, cicatriz, coleira ou plaquinha." value={a.identification} onChange={(v) => set("identification", v)} />
          <TextField label="Microchip" optional value={a.microchip} onChange={(v) => set("microchip", v)} error={errors.microchip} maxLength={20} />
        </div>
      </Section>
      <Section title="Saúde, comportamento e cuidados">
        <div className="mb-5">
          <TestDataWarning />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Castrado(a)" optional value={a.neutered} onChange={(v) => set("neutered", v)} placeholder="Sem resposta" options={triOptions} />
          <SelectField label="Gestação ou lactação" optional value={a.pregnancyLactation} onChange={(v) => set("pregnancyLactation", v)} placeholder="Sem resposta" options={triOptions} />
          <TextAreaField label="Condições" optional value={a.conditions} onChange={(v) => set("conditions", v)} />
          <TextAreaField label="Alergias" optional value={a.allergies} onChange={(v) => set("allergies", v)} />
          <TextAreaField label="Mobilidade" optional value={a.mobility} onChange={(v) => set("mobility", v)} />
          <TextAreaField label="Comportamento" optional hint="Ex.: medo de barulho, não se dá com outros cães" value={a.behavior} onChange={(v) => set("behavior", v)} />
          <TextAreaField label="Restrição de dieta" optional value={a.dietRestriction} onChange={(v) => set("dietRestriction", v)} />
          <TextAreaField label="Vacinação" optional hint="Ex.: onde está a carteira, última data" value={a.vaccination} onChange={(v) => set("vaccination", v)} />
          <TextField label="Veterinário" optional hint="Nome e telefone" value={a.vet} onChange={(v) => set("vet", v)} />
          <SelectField label="Responsável humano" optional value={a.responsibleId ?? ""} onChange={(v) => set("responsibleId", v || null)} placeholder="Nenhum" options={data.people.map((p) => ({ value: p.id, label: p.name }))} />
          <div className="sm:col-span-2">
            <CheckField label="Faz uso contínuo de algum tratamento" hint="Apenas sinalização. Sem nomes de remédios ou doses aqui." checked={a.continuousUse} onChange={(v) => set("continuousUse", v)} />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" optional value={a.notes} onChange={(v) => set("notes", v)} />
          </div>
        </div>
      </Section>
      <div className="flex flex-wrap gap-2 border-t pt-4"><Button type="submit" onClick={() => { saveAndContinue.current = false; }} disabled={photoBusy}>{photoBusy ? "Preparando foto…" : "Salvar"}</Button><Button type="submit" variant="outline" onClick={() => { saveAndContinue.current = true; }} disabled={photoBusy}>Salvar e adicionar outro pet</Button><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button></div>
    </form>
  );
}
