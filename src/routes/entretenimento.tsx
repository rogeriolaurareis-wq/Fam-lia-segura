import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Note, PageHeader, PendingList, Ready, Section, Tag } from "@/components/fs/page";
import { CheckField, SelectField } from "@/components/fs/fields";
import { CONTEXT_LABEL, enrichmentFor, filterActivities, hasSmallParts, materialsFor, type Activity } from "@/lib/domain/activities";
import { bandForPerson } from "@/lib/domain/age";
import { AGE_BANDS, AGE_BAND_LABEL, SPECIES_LABEL, type ActivityContext, type AgeBand, type EntertainmentPrefs } from "@/lib/domain/types";
import { useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/entretenimento")({
  head: () => pageHead("Entretenimento essencial", "Atividades físicas, fora da tela, para cada faixa de idade, e enriquecimento para animais."),
  component: EntertainmentPage,
});

function EntertainmentPage() {
  return (
    <>
      <PageHeader code="M09" title="Entretenimento essencial" description="Atividades sem tela para passar o tempo e acalmar, em casa, no abrigo ou em uma pausa durante a saída." />
      <Ready>
        <EntertainmentBody />
      </Ready>
    </>
  );
}

function EntertainmentBody() {
  const { data, update } = useStore();
  const prefs = data.entertainment;
  const setPrefs = (patch: Partial<EntertainmentPrefs>) => update((d) => ({ ...d, entertainment: { ...d.entertainment, ...patch } }));

  const registeredBands = [...new Set(data.people.map((p) => bandForPerson(p)).filter((b): b is AgeBand => !!b))];
  const unknownAge = data.people.filter((p) => !bandForPerson(p)).length;
  const bands = prefs.mode === "cadastro" ? registeredBands : prefs.manualBands;
  const list = filterActivities(bands, prefs.context);
  const infant = bands.includes("0-3");
  const familiar = list.filter((a) => a.kind === "familiar");
  const individual = list.filter((a) => a.kind === "individual");
  const { all: materials, missing } = materialsFor(prefs.selected, prefs.owned);
  const enrichment = enrichmentFor(data.animals);

  const toggle = (arr: string[], id: string, on: boolean) => (on ? [...new Set([...arr, id])] : arr.filter((x) => x !== id));

  return (
    <div className="space-y-6">
      <Section title="Para quem e onde">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Faixas de idade"
            value={prefs.mode}
            onChange={(v) => setPrefs({ mode: v })}
            options={[
              { value: "cadastro", label: "Usar pessoas cadastradas" },
              { value: "manual", label: "Escolher manualmente" },
            ]}
          />
          <SelectField label="Contexto" value={prefs.context} onChange={(v) => setPrefs({ context: v as ActivityContext })} options={(Object.keys(CONTEXT_LABEL) as ActivityContext[]).map((c) => ({ value: c, label: CONTEXT_LABEL[c] }))} />
        </div>
        {prefs.mode === "cadastro" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {registeredBands.length ? `Faixas encontradas no cadastro: ${registeredBands.join(", ")}.` : "Nenhuma faixa no cadastro: mostrando todas as atividades."}
            {unknownAge > 0 && ` ${unknownAge} pessoa(s) sem idade informada.`}
          </p>
        ) : (
          <fieldset className="mt-4">
            <legend className="font-bold">Faixas</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_BANDS.map((b) => {
                const on = prefs.manualBands.includes(b);
                return (
                  <Button key={b} type="button" size="sm" variant={on ? "info" : "outline"} aria-pressed={on} onClick={() => setPrefs({ manualBands: on ? prefs.manualBands.filter((x) => x !== b) : [...prefs.manualBands, b] })}>
                    {AGE_BAND_LABEL[b]}
                  </Button>
                );
              })}
            </div>
          </fieldset>
        )}
        {infant && (
          <div className="mt-4">
            <Note tone="attention" title="Há bebês ou crianças até 3 anos">
              Atividades marcadas com “peças pequenas” devem ficar fora do alcance deles. Supervisão de um adulto sempre.
            </Note>
          </div>
        )}
      </Section>

      <ActivityGroup title="Atividades em família ou em grupo" items={familiar} selected={prefs.selected} infant={infant} onToggle={(id, on) => setPrefs({ selected: toggle(prefs.selected, id, on) })} />
      <ActivityGroup title="Atividades individuais" items={individual} selected={prefs.selected} infant={infant} onToggle={(id, on) => setPrefs({ selected: toggle(prefs.selected, id, on) })} />

      <Section title="Materiais das atividades escolhidas" description="Cada material aparece uma vez, mesmo que sirva para várias atividades.">
        {materials.length === 0 ? (
          <p className="text-muted-foreground">Escolha atividades acima para montar a lista.</p>
        ) : (
          <>
            <div className="grid gap-1 sm:grid-cols-2">
              {materials.map((m) => (
                <CheckField key={m.id} label={`Já possuo: ${m.name}`} hint={m.smallParts ? "Contém peças pequenas" : undefined} checked={prefs.owned.includes(m.id)} onChange={(on) => setPrefs({ owned: toggle(prefs.owned, m.id, on) })} />
              ))}
            </div>
            <h3 className="mt-5 font-bold">O que falta ({missing.length})</h3>
            {missing.length === 0 ? <p className="text-muted-foreground">Nada falta para as atividades escolhidas.</p> : <ul className="mt-1 list-disc pl-5">{missing.map((m) => <li key={m.id}>{m.name}</li>)}</ul>}
          </>
        )}
      </Section>

      <Section title="Enriquecimento para animais" description="Separado por espécie e porte dos animais cadastrados.">
        {data.animals.length === 0 ? (
          <p className="text-muted-foreground">Cadastre animais no M02 para ver sugestões.</p>
        ) : enrichment.length === 0 ? (
          <p className="text-muted-foreground">Sem sugestões para as espécies/portes cadastrados.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {enrichment.map((e) => (
              <article key={e.id} className="rounded-xl border p-4">
                <h3 className="font-semibold">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{e.species.map((s) => SPECIES_LABEL[s]).join(", ")}</p>
                <p className="mt-2">{e.instructions}</p>
                <p className="mt-2 text-sm">
                  <strong>Limites:</strong> {e.limits}
                </p>
              </article>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-muted-foreground">Respeite o comportamento de cada animal. Pare a atividade se houver medo, agitação ou agressividade.</p>
      </Section>

      <Note tone="info" title="Onde ficam lanternas e rádios">
        Lanternas, pilhas, rádios e carregadores pertencem ao módulo Equipamentos (M06), não ao entretenimento. As atividades aqui não usam telas nem baterias.
      </Note>
      <PendingList items={["Catálogo revisado por especialistas em desenvolvimento infantil e acessibilidade: pendente."]} />
    </div>
  );
}

function ActivityGroup({ title, items, selected, infant, onToggle }: { title: string; items: Activity[]; selected: string[]; infant: boolean; onToggle: (id: string, on: boolean) => void }) {
  return (
    <Section title={title} description={`${items.length} atividade(s) para o filtro atual.`}>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma atividade para esse filtro.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((a) => {
            const on = selected.includes(a.id);
            return (
              <article key={a.id} className={`flex flex-col gap-2 rounded-xl border-2 p-4 ${on ? "border-primary bg-primary-soft" : "bg-card"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {infant && hasSmallParts(a) && <Tag tone="attention">Peças pequenas</Tag>}
                </div>
                <p className="text-sm text-muted-foreground">Faixas: {a.bands.join(", ")}</p>
                <p>{a.instructions}</p>
                <p className="text-sm">
                  <strong>Segurança:</strong> {a.safety}
                </p>
                <p className="text-sm">
                  <strong>Acessibilidade:</strong> {a.accessibility}
                </p>
                <CheckField label="Incluir na lista de materiais" checked={on} onChange={(v) => onToggle(a.id, v)} />
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}
