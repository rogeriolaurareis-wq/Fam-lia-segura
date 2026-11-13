import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider } from "@/lib/storage/store";
import { ShoppingPlanner } from "@/components/fs/ShoppingPlanner";
beforeEach(() => window.localStorage.clear());
afterEach(cleanup);
describe("compras no aparelho", () => {
  it("seleciona, copia e mantém preferência após reabrir", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const view = render(
      <StoreProvider>
        <ShoppingPlanner />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText("Pessoas no planejamento")).toBeDefined());
    fireEvent.change(screen.getByLabelText("Pessoas no planejamento"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Dias de reserva"), { target: { value: "7" } });
    fireEvent.click(screen.getByLabelText("Arroz branco"));
    fireEvent.click(screen.getByRole("button", { name: "Copiar lista para WhatsApp" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Arroz branco — 4,2 kg")),
    );
    view.unmount();
    render(
      <StoreProvider>
        <ShoppingPlanner />
      </StoreProvider>,
    );
    await waitFor(() =>
      expect((screen.getByLabelText("Arroz branco") as HTMLInputElement).checked).toBe(true),
    );
    expect((screen.getByLabelText("Pessoas no planejamento") as HTMLInputElement).value).toBe("4");
    expect(screen.queryByLabelText("Validade")).toBeNull();
  });
  it("não fecha com falso sucesso quando armazenamento falha", async () => {
    render(
      <StoreProvider>
        <ShoppingPlanner />
      </StoreProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText("Pessoas no planejamento")).toBeDefined());
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fireEvent.click(screen.getByLabelText("Arroz branco"));
    expect((screen.getByLabelText("Arroz branco") as HTMLInputElement).checked).toBe(false);
    spy.mockRestore();
  });
});
