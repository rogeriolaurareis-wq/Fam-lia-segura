import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
export type LocatedHome = { latitude: number; longitude: number; accuracy: number; capturedAt: string };
export function HomeLocation({ onLocation }: { onLocation: (point: LocatedHome, address?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const lastQuery = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);
  const locate = async () => {
    if (!navigator.geolocation) { setMessage("Este navegador não oferece localização. Preencha o endereço manualmente."); return; }
    setBusy(true); setMessage("Aguardando a permissão e a localização do aparelho…");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }));
      if (!active.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      const point = { latitude, longitude, accuracy, capturedAt: new Date(position.timestamp).toISOString() };
      onLocation(point);
      if (!navigator.onLine) { setMessage("Localização obtida. Sem internet para buscar a rua; preencha o endereço manualmente e salve a moradia."); return; }
      if (Date.now() - lastQuery.current < 2000) { setMessage("Localização obtida. Aguarde alguns segundos para consultar o endereço novamente."); return; }
      lastQuery.current = Date.now();
      setMessage("Localização obtida. Buscando o endereço aproximado…");
      controller.current = new AbortController();
      const timer = setTimeout(() => controller.current?.abort(), 12000);
      try {
        const query = new URLSearchParams({ format: "jsonv2", lat: latitude.toFixed(5), lon: longitude.toFixed(5), "accept-language": "pt-BR", addressdetails: "1" });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, { signal: controller.current.signal, credentials: "omit", referrerPolicy: "origin" });
        if (!response.ok) throw new Error("geocoding");
        const result: unknown = await response.json();
        const address = (result as { display_name?: unknown })?.display_name;
        if (typeof address !== "string" || !address.trim()) throw new Error("no address");
        if (active.current) { onLocation(point, address.slice(0, 500)); setMessage("Endereço aproximado encontrado. Confira rua, número e complemento antes de salvar a moradia."); }
      } catch { if (active.current) setMessage("Localização obtida, mas não foi possível consultar o endereço. Digite a rua manualmente; as coordenadas estão disponíveis para salvar."); }
      finally { clearTimeout(timer); }
    } catch (error) {
      if (!active.current) return;
      const code = (error as GeolocationPositionError).code;
      setMessage(code === 1 ? "Permissão de localização negada. Você pode liberá-la nas configurações do navegador ou digitar o endereço." : code === 3 ? "O aparelho demorou para obter a localização. Tente novamente em local aberto ou digite o endereço." : "Não foi possível obter a localização. Verifique o GPS do aparelho ou digite o endereço.");
    } finally { if (active.current) setBusy(false); }
  };
  return <div className="space-y-2 rounded-xl border p-4 sm:col-span-2">
    <Button type="button" variant="outline" disabled={busy} onClick={locate}><LocateFixed aria-hidden />{busy ? "Buscando localização…" : "Usar minha localização"}</Button>
    <p className="text-sm text-muted-foreground">Use quando estiver na moradia. Ao tocar, o app solicita a localização do aparelho e, com internet, envia as coordenadas ao OpenStreetMap/Nominatim para procurar o endereço. Não há rastreamento contínuo.</p>
    {message && <p role="status" className="text-sm">{message}</p>}
    <p className="text-xs text-muted-foreground">Endereços: <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© colaboradores OpenStreetMap</a>.</p>
  </div>;
}
