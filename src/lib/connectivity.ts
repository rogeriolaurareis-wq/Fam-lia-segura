import { useEffect, useState } from "react";

export type NetStatus = "verificando" | "conectado" | "sem_rede" | "sem_acesso";

export interface NetState {
  status: NetStatus;
  checkedAt: string | null;
}

/**
 * Real connectivity: navigator.onLine only tells if there is a network interface, so we also
 * probe our own origin with a no-store request (no data sent). Re-checks on events and every 30s.
 */
export function useConnectivity(): NetState & { recheck: () => void } {
  const [net, setNet] = useState<NetState>({ status: "verificando", checkedAt: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!navigator.onLine) {
        if (!cancelled) setNet({ status: "sem_rede", checkedAt: new Date().toISOString() });
        return;
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(`/favicon.ico?conectividade=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!cancelled)
          setNet({ status: res.ok || res.status < 500 ? "conectado" : "sem_acesso", checkedAt: new Date().toISOString() });
      } catch {
        if (!cancelled) setNet({ status: navigator.onLine ? "sem_acesso" : "sem_rede", checkedAt: new Date().toISOString() });
      } finally {
        clearTimeout(timer);
      }
    };
    void check();
    const onChange = () => void check();
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    const id = setInterval(check, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
      clearInterval(id);
    };
  }, [tick]);

  return { ...net, recheck: () => setTick((t) => t + 1) };
}

export const NET_LABEL: Record<NetStatus, string> = {
  verificando: "Verificando conexão…",
  conectado: "Conectado",
  sem_rede: "Sem conexão",
  sem_acesso: "Rede sem acesso",
};
