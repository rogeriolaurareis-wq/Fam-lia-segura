import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { StoreProvider } from "@/lib/storage/store";
import { makeDemoData } from "@/lib/demo";
import { FamilyPage, PersonForm } from "@/routes/familia";
import { serialize, STORAGE_KEY, parseEnvelope } from "@/lib/storage/persist";
import { emptyData, type Person } from "@/lib/domain/types";
import { PersonPhoto, preparePersonPhoto } from "@/components/fs/PersonPhoto";
beforeEach(() => localStorage.clear()); afterEach(cleanup);
const fixture = () => makeDemoData(() => crypto.randomUUID()).people![0]!;
it("cadastra uma segunda pessoa, avança com sangue incerto e salva identificação sem vínculos", async () => {
  localStorage.setItem(STORAGE_KEY, serialize({ ...emptyData(), people: [fixture()] }));
  const save = vi.fn();
  const person: Person = { ...fixture(), name: "Segunda pessoa", birthDate: "", ageBand: "4-6" };
  render(<StoreProvider><PersonForm initial={person} onSave={save} onCancel={() => {}} /></StoreProvider>);
  expect(screen.queryByLabelText(/Data de nascimento/)).toBeNull();
  expect(screen.queryByLabelText(/^Vínculo/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Grupo sanguíneo/), { target: { value: "O" } });
  fireEvent.change(screen.getByLabelText(/Fator Rh/), { target: { value: "positivo" } });
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  expect(screen.getByLabelText(/Alergias/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Sinais de identificação/), { target: { value: "Tatuagem no braço esquerdo" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0]![0]).toMatchObject({ abo: "nao_sei", rh: "nao_sei", ageBand: "4-6", birthDate: "", identificationMarks: "Tatuagem no braço esquerdo" });
});
it("conserva sangue confirmado sem exigir texto documental e converte nascimento anterior em faixa", () => {
  const save = vi.fn();
  render(<StoreProvider><PersonForm initial={fixture()} onSave={save} onCancel={() => {}} /></StoreProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Grupo sanguíneo/), { target: { value: "A" } });
  fireEvent.click(screen.getByLabelText(/Confirmo que este grupo/));
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(save.mock.calls[0]![0]).toMatchObject({ birthDate: "", ageBand: "18-59", abo: "A", bloodDocConfirmed: true });
});
it("preserva foto e sinais ao exportar e importar; aceita registros antigos sem foto", () => {
  const person = { ...fixture(), photoDataUrl: "data:image/jpeg;base64,YWJj", identificationMarks: "Pinta no rosto" };
  const result = parseEnvelope(serialize({ ...emptyData(), people: [person, fixture()] }));
  expect(result.status).toBe("ok");
  if (result.status === "ok") expect(result.data.people[0]).toMatchObject(person);
});
it("permite remover a foto e rejeita arquivo não suportado sem perder a foto anterior", async () => {
  const change = vi.fn();
  render(<PersonPhoto value="data:image/jpeg;base64,YWJj" onChange={change} />);
  fireEvent.change(screen.getByLabelText(/Foto da pessoa/), { target: { files: [new File(["bad"], "x.svg", { type: "image/svg+xml" })] } });
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("JPG"));
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Remover foto" }));
  expect(change).toHaveBeenCalledWith("");
  await expect(preparePersonPhoto(new File(["bad"], "x.txt", { type: "text/plain" }))).rejects.toThrow();
});

it("terceira pessoa avança mesmo com medida opcional incompleta e recebe erro específico ao salvar", () => {
  localStorage.setItem(STORAGE_KEY, serialize({ ...emptyData(), people: [fixture(), fixture()] }));
  const save = vi.fn();
  render(<StoreProvider><PersonForm initial={{ ...fixture(), name: "Terceira pessoa" }} onSave={save} onCancel={() => {}} /></StoreProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Peso/), { target: { value: "70," } });
  fireEvent.change(screen.getByLabelText(/Grupo sanguíneo/), { target: { value: "O" } });
  fireEvent.change(screen.getByLabelText(/Fator Rh/), { target: { value: "positivo" } });
  fireEvent.click(screen.getByLabelText(/Confirmo que este grupo/));
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  expect(screen.getByLabelText(/Alergias/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: "Terceira pessoa", abo: "O", rh: "positivo", weightKg: 70 }));
});
it("valor inválido de peso não bloqueia próxima etapa e é apontado ao salvar", () => {
  const save = vi.fn();
  render(<StoreProvider><PersonForm initial={fixture()} onSave={save} onCancel={() => {}} /></StoreProvider>);
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Peso/), { target: { value: "abc" } });
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  expect(screen.getByLabelText(/Alergias/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getAllByText(/Peso deve ser/).length).toBeGreaterThan(0);
});

it("posiciona adicionar abaixo dos cadastros e salva uma terceira pessoa pelo fluxo completo", async () => {
  localStorage.setItem(STORAGE_KEY, serialize({ ...emptyData(), people: [{ ...fixture(), name: "Primeira" }, { ...fixture(), name: "Segunda" }] }));
  render(<StoreProvider><FamilyPage /></StoreProvider>);
  const add = await screen.findByRole("button", { name: "Adicionar pessoa" });
  expect(screen.getByRole("heading", { name: "Segunda" }).compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(add);
  fireEvent.change(screen.getByLabelText("Nome ou apelido"), { target: { value: "Terceira" } });
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.change(screen.getByLabelText(/Grupo sanguíneo/), { target: { value: "AB" } });
  fireEvent.change(screen.getByLabelText(/Fator Rh/), { target: { value: "negativo" } });
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  expect(screen.getByLabelText(/Alergias/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /Próxima etapa/ }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  expect(await screen.findByRole("heading", { name: "Terceira" })).toBeDefined();
  const saved = parseEnvelope(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.status).toBe("ok");
  if (saved.status === "ok") expect(saved.data.people).toHaveLength(3);
});

it("salva e abre outra pessoa com formulário limpo, preservando o cadastro anterior", async () => {
  render(<StoreProvider><FamilyPage /></StoreProvider>);
  fireEvent.click(await screen.findByRole("button", { name: /Adicionar a primeira pessoa/ }));
  fireEvent.change(screen.getByLabelText("Nome ou apelido"), { target: { value: "Primeira pessoa em sequência" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar e adicionar outra pessoa" }));
  await waitFor(() => expect((screen.getByLabelText("Nome ou apelido") as HTMLInputElement).value).toBe(""));
  const result = parseEnvelope(localStorage.getItem(STORAGE_KEY)!);
  expect(result.status).toBe("ok");
  if (result.status === "ok") expect(result.data.people[0]?.name).toBe("Primeira pessoa em sequência");
});
