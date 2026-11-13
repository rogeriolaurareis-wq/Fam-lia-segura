import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { HomeLocation } from "@/components/fs/HomeLocation";
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("não captura nem consulta localização sem toque; permissão negada mantém alternativa manual", async () => {
  const getCurrentPosition = vi.fn((_ok, fail) => fail({ code: 1 }));
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  const change = vi.fn();
  render(<HomeLocation onLocation={change} />);
  expect(getCurrentPosition).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("negada"));
  expect(change).not.toHaveBeenCalled();
});
it("retorna coordenadas e endereço aproximado com consulta pontual", async () => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (ok: Function) => ok({ coords: { latitude: -20, longitude: -49, accuracy: 15 }, timestamp: 1000 }) } });
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ display_name: "Rua de teste, Brasil" }) });
  vi.stubGlobal("fetch", fetchMock);
  const change = vi.fn();
  render(<HomeLocation onLocation={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
  await waitFor(() => expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: -20, longitude: -49 }), "Rua de teste, Brasil"));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
