import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { StoreProvider } from "@/lib/storage/store";
import { HomeForm } from "@/routes/moradia";
import { STORAGE_KEY, parseEnvelope, serialize } from "@/lib/storage/persist";
import { emptyData } from "@/lib/domain/types";
import { within } from "@testing-library/react";
beforeEach(() => localStorage.setItem(STORAGE_KEY, serialize(emptyData())));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("salva endereço e riscos automaticamente, mantém após reabrir e mostra gráfico", async () => {
  const view = render(<StoreProvider><HomeForm /></StoreProvider>);
  await waitFor(() => expect(screen.getByLabelText(/^Endereço/)).toBeDefined());
  // Wait for provider initialization before editing.
  await waitFor(() => expect(screen.queryByText(/Moradia salva/)).toBeNull());
  fireEvent.change(screen.getByLabelText(/^Endereço/), { target: { value: "Rua Teste, 123" } });
  const field = screen.getByRole("group", { name: /Há rio/ });
  fireEvent.click(within(field).getByRole("radio", { name: "Sim" }));
  await waitFor(() => {
    const result = parseEnvelope(localStorage.getItem(STORAGE_KEY)!);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.data.home).toMatchObject({ address: "Rua Teste, 123", risks: { agua: "sim" } });
  }, { timeout: 2500 });
  expect(screen.getByRole("img", { name: /Riscos informados: 1/ })).toBeDefined();
  view.unmount(); render(<StoreProvider><HomeForm /></StoreProvider>);
  await waitFor(() => expect((screen.getByLabelText(/^Endereço/) as HTMLInputElement).value).toBe("Rua Teste, 123"));
});
it("falha de armazenamento mantém alterações e informa erro sem falso sucesso", async () => {
  render(<StoreProvider><HomeForm /></StoreProvider>);
  await screen.findByLabelText(/^Endereço/);
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
  fireEvent.change(screen.getByLabelText(/^Endereço/), { target: { value: "Rua Não Salva" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar moradia" }));
  expect((screen.getByLabelText(/^Endereço/) as HTMLInputElement).value).toBe("Rua Não Salva");
  expect(screen.getByText(/Alterações não salvas: tente/)).toBeDefined();
  spy.mockRestore();
});
