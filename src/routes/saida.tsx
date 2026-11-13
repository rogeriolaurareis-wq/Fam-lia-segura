import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Car, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddButton, DL, EmptyState, FormActions, Note, PageHeader, PendingList, Ready, RecordActions, RecordCard, Section, Tag, fmtDate } from "@/components/fs/page";
import { CheckField, FormErrorSummary, NumberField, SelectField, TextAreaField, TextField, TriField } from "@/components/fs/fields";
import { computeCapacity } from "@/lib/domain/exit";
import { hasErrors, normalizePhone, validateDestination, validateVehicle, type Errs } from "@/lib/domain/validate";
import { RISK_KEYS, RISK_SHORT, TRI_LABEL, type Destination, type ExitPlan, type Vehicle } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/saida")({
  head: () => pageHead("Plano de saída", "Situação, perigos declarados, veículos, lugares disponíveis e destinos confirmados."),
  component: ExitPage,
});

const SITUATION: { value: Exclude<ExitPlan["situation"], "">; label: string }[] = [
  { value: "preparacao", label: "Só preparação (sem emergência agora)" },
  { value: "ordem_oficial", label: "Há ordem oficial de saída" },
  { value: "pedido_ajuda", label: "Pedimos ajuda / aguardando resgate" },
  { value: "decisao_familiar", label: "Decisão da família de sair" },
];

function newVehicle(): Vehicle {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, name: "", working: "nao_sei", seatsHumans: 0, animalSpaces: 0, fuelInfo: "", accessible: "nao_sei", notes: "" };
}
function newDestination(): Destination {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, name: "", address: "", phone: "", contactId: null, acceptsPeople: "nao_sei", acceptsAnimals: "nao_sei", confirmedOn: "", isHospital: false, notes: "" };
}

type Editing = { kind: "vehicle"; item: Vehicle } | { kind: "destination"; item: Destination } | null;

function ExitPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Editing>(null);

  if (editing?.kind === "vehicle")
    return (
      <Ready>
        <VehicleForm initial={editing.item} onCancel={() => setEditing(null)} onSave={(v) => upsert("vehicles", { ...v, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );
  if (editing?.kind === "destination")
    return (
      <Ready>
        <DestinationForm initial={editing.item} onCancel={() => setEditing(null)} onSave={(v) => upsert("destinations", { ...v, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );

  const cap = computeCapacity(data.vehicles, data.people.length, data.animals.length);

  return (
    <>
      <PageHeader code="M07" title="Plano de saída" description="Organize como sair de casa, se for preciso, e para onde ir." />
      <Ready>
        <div className="space-y-6">
          <Note tone="danger" title="Nunca atravesse">
            Não atravesse áreas alagadas, correnteza, fios caídos ou vias interditadas — nem a pé, nem de carro. Siga as orientações da Defesa Civil e dos bombeiros.
          </Note>

          <SituationForm />

          <Section title="Lugares disponíveis" description="Conta só veículos marcados como funcionando (“Sim”).">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="font-bold">Pessoas</p>
                <p>
                  {cap.seats} lugar(es) para {cap.people} pessoa(s) cadastrada(s)
                </p>
                {cap.missingSeats > 0 && <p className="mt-1 font-bold text-foreground">Faltam {cap.missingSeats} lugar(es).</p>}
              </div>
              <div className="rounded-xl border p-4">
                <p className="font-bold">Animais</p>
                <p>
                  {cap.animalSpaces} espaço(s) para {cap.animals} animal(is) cadastrado(s)
                </p>
                {cap.missingAnimalSpaces > 0 && <p className="mt-1 font-bold text-foreground">Faltam {cap.missingAnimalSpaces} espaço(s).</p>}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {cap.workingVehicles === 0
                ? "Nenhum veículo marcado como funcionando. Planeje também a saída a pé ou com ajuda."
                : cap.numbersCover
                  ? "Os números informados cobrem a família. Isso não garante que a saída seja possível (vias, combustível, condições do momento)."
                  : "Os lugares declarados não cobrem toda a família."}
            </p>
          </Section>

          <Section title="Veículos" actions={<AddButton onClick={() => setEditing({ kind: "vehicle", item: newVehicle() })}>Adicionar veículo</AddButton>}>
            {data.vehicles.length === 0 ? (
              <EmptyState icon={<Car />} title="Nenhum veículo" text="Cadastre veículos da família ou de quem pode ajudar. Se não houver, deixe vazio." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.vehicles.map((v) => (
                  <RecordCard
                    key={v.id}
                    title={v.name}
                    subtitle={`${v.seatsHumans} lugar(es) · ${v.animalSpaces} espaço(s) p/ animais`}
                    tags={
                      <>
                        {v.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                        <Tag tone={v.working === "sim" ? "primary" : "attention"}>Funcionando: {TRI_LABEL[v.working]}</Tag>
                      </>
                    }
                    actions={<RecordActions name={v.name} onEdit={() => setEditing({ kind: "vehicle", item: v })} onDelete={() => remove("vehicles", v.id)} />}
                  >
                    <DL items={[["Combustível (informado)", v.fuelInfo], ["Acessível", TRI_LABEL[v.accessible]], ["Observações", v.notes]]} />
                  </RecordCard>
                ))}
              </div>
            )}
          </Section>

          <Section title="Destinos" actions={<AddButton onClick={() => setEditing({ kind: "destination", item: newDestination() })}>Adicionar destino</AddButton>}>
            {data.destinations.length === 0 ? (
              <EmptyState icon={<MapPin />} title="Nenhum destino" text="Casa de parentes, amigos ou abrigo oficial. Confirme antes se aceitam pessoas e animais." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.destinations.map((d) => {
                  const contact = data.contacts.find((c) => c.id === d.contactId);
                  return (
                    <RecordCard
                      key={d.id}
                      title={d.name}
                      subtitle={d.address}
                      tags={
                        <>
                          {d.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                          <Tag tone={d.acceptsPeople === "sim" ? "primary" : "attention"}>Pessoas: {TRI_LABEL[d.acceptsPeople]}</Tag>
                          <Tag tone={d.acceptsAnimals === "sim" ? "primary" : "attention"}>Animais: {TRI_LABEL[d.acceptsAnimals]}</Tag>
                        </>
                      }
                      actions={
                        <div className="flex flex-wrap gap-2">
                          {(d.phone || contact) && (
                            <Button asChild variant="info" size="sm">
                              <a href={`tel:${normalizePhone(d.phone || contact!.phone)}`}>Ligar</a>
                            </Button>
                          )}
                          <RecordActions name={d.name} onEdit={() => setEditing({ kind: "destination", item: d })} onDelete={() => remove("destinations", d.id)} />
                        </div>
                      }
                    >
                      {d.isHospital && <p className="mb-2 font-bold text-foreground">Hospital não é automaticamente abrigo. Confirme se pode receber a família.</p>}
                      <DL items={[["Contato", contact ? `${contact.name} (${contact.phone})` : d.phone], ["Acolhimento confirmado em", fmtDate(d.confirmedOn)], ["Observações", d.notes]]} />
                    </RecordCard>
                  );
                })}
              </div>
            )}
          </Section>

          <PendingList items={["Mapas, rotas e trânsito: não integrados. Nada aqui calcula caminho ou verifica vias.", "Consulta a abrigos oficiais: não integrada."]} />
        </div>
      </Ready>
    </>
  );
}

function SituationForm() {
  const { data, update } = useStore();
  const [p, setP] = useState<ExitPlan>(data.exitPlan);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setP(data.exitPlan);
  }, [data.exitPlan, dirty]);
  const set = <K extends keyof ExitPlan>(k: K, v: ExitPlan[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const homeYes = RISK_KEYS.filter((k) => data.home.risks[k] === "sim");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (update((d) => ({ ...d, exitPlan: p }))) {
      setDirty(false);
      toast.success("Plano salvo neste aparelho.");
    }
  };
  return (
    <form onSubmit={submit} noValidate>
      <Section title="Situação e perigos declarados">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Situação" value={p.situation} onChange={(v) => set("situation", v)} placeholder="Não definida" options={SITUATION} />
          <TextField label="Ordem oficial / pedido de ajuda" optional hint="Ex.: quem emitiu, horário, protocolo" value={p.officialNote} onChange={(v) => set("officialNote", v)} />
        </div>
        <fieldset className="mt-5">
          <legend className="font-bold">Perigos declarados por vocês</legend>
          {homeYes.length > 0 && <p className="text-sm text-muted-foreground">Na Moradia vocês marcaram “Sim” para: {homeYes.map((k) => RISK_SHORT[k]).join(", ")}.</p>}
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            {RISK_KEYS.map((k) => (
              <CheckField key={k} label={RISK_SHORT[k]} checked={p.hazards.includes(k)} onChange={(v) => set("hazards", v ? [...p.hazards, k] : p.hazards.filter((h) => h !== k))} />
            ))}
          </div>
          <div className="mt-3">
            <TextField label="Outros perigos" optional value={p.hazardsOther} onChange={(v) => set("hazardsOther", v)} />
          </div>
        </fieldset>
        <div className="mt-5">
          <TextAreaField label="Observações do plano" optional hint="Ex.: quem leva os animais, o que pegar primeiro" value={p.notes} onChange={(v) => set("notes", v)} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit">Salvar situação</Button>
          {dirty && <span className="text-sm text-muted-foreground">Alterações não salvas.</span>}
        </div>
      </Section>
    </form>
  );
}

function VehicleForm({ initial, onSave, onCancel }: { initial: Vehicle; onSave: (v: Vehicle) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Errs<Vehicle>>({});
  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) => setV((p) => ({ ...p, [k]: val }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateVehicle(v);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...v, name: v.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M07" title={initial.name ? `Editar: ${initial.name}` : "Novo veículo"} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Identificação" hint="Ex.: carro prata, moto do tio" value={v.name} onChange={(x) => set("name", x)} error={errors.name} />
          <TextField label="Combustível / carga (como informado)" optional value={v.fuelInfo} onChange={(x) => set("fuelInfo", x)} />
          <NumberField label="Lugares para pessoas" value={v.seatsHumans} onChange={(x) => set("seatsHumans", x ?? 0)} error={errors.seatsHumans} />
          <NumberField label="Espaços para animais" value={v.animalSpaces} onChange={(x) => set("animalSpaces", x ?? 0)} error={errors.animalSpaces} />
          <TriField label="Está funcionando?" value={v.working} onChange={(x) => set("working", x)} />
          <TriField label="É acessível para quem tem mobilidade reduzida?" value={v.accessible} onChange={(x) => set("accessible", x)} />
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" optional value={v.notes} onChange={(x) => set("notes", x)} />
          </div>
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function DestinationForm({ initial, onSave, onCancel }: { initial: Destination; onSave: (v: Destination) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [d, setD] = useState(initial);
  const [errors, setErrors] = useState<Errs<Destination>>({});
  const set = <K extends keyof Destination>(k: K, val: Destination[K]) => setD((p) => ({ ...p, [k]: val }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateDestination(d);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...d, name: d.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M07" title={initial.name ? `Editar: ${initial.name}` : "Novo destino"} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Nome do destino" value={d.name} onChange={(x) => set("name", x)} error={errors.name} />
          <TextField label="Endereço" optional value={d.address} onChange={(x) => set("address", x)} />
          <SelectField label="Contato da Rede" optional value={d.contactId ?? ""} onChange={(x) => set("contactId", x || null)} placeholder="Nenhum" options={data.contacts.map((c) => ({ value: c.id, label: c.name }))} />
          <TextField label="Telefone do local" optional type="tel" value={d.phone} onChange={(x) => set("phone", x)} />
          <TriField label="Confirmou que acolhe as pessoas?" value={d.acceptsPeople} onChange={(x) => set("acceptsPeople", x)} />
          <TriField label="Confirmou que acolhe os animais?" value={d.acceptsAnimals} onChange={(x) => set("acceptsAnimals", x)} />
          <TextField label="Data da confirmação" optional type="date" value={d.confirmedOn} onChange={(x) => set("confirmedOn", x)} error={errors.confirmedOn} />
          <CheckField label="É um hospital ou unidade de saúde" hint="Hospital não é automaticamente abrigo." checked={d.isHospital} onChange={(x) => set("isHospital", x)} />
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" optional value={d.notes} onChange={(x) => set("notes", x)} />
          </div>
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
