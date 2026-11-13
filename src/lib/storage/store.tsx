import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { removeWithLinks } from "@/lib/domain/links";
import { emptyData, type AppData, type CollectionKey } from "@/lib/domain/types";
import { makeDemoData } from "@/lib/demo";
import {
  STORAGE_KEY,
  backupRaw,
  getBrowserStorage,
  loadData,
  parseEnvelope,
  resetAfterBackup,
  saveData,
  serialize,
  type LoadResult,
} from "./persist";

export type Phase = "loading" | "ready" | "blocked" | "memory";

interface StoreValue {
  phase: Phase;
  data: AppData;
  savedAt: string | null;
  saveError: string | null;
  blocked: Extract<LoadResult, { status: "corrupt" | "newer" }> | null;
  memoryReason: string | null;
  update: (fn: (d: AppData) => AppData) => boolean;
  upsert: <K extends CollectionKey>(key: K, record: AppData[K][number]) => boolean;
  remove: (key: CollectionKey, id: string) => boolean;
  resetBlocked: () => void;
  exportText: () => string;
  importText: (raw: string) => { ok: boolean; message: string };
  loadDemo: () => void;
  removeDemo: () => void;
  hasDemo: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<AppData>(() => emptyData());
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<StoreValue["blocked"]>(null);
  const [memoryReason, setMemoryReason] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const applyLoad = useCallback((r: LoadResult) => {
    if (r.status === "ok" || r.status === "empty") {
      setData(r.data);
      setSavedAt(r.status === "ok" ? r.savedAt : null);
      setBlocked(null);
      setPhase("ready");
    } else if (r.status === "unavailable") {
      setMemoryReason(r.reason);
      setPhase("memory");
    } else {
      setBlocked(r);
      setPhase("blocked");
    }
  }, []);

  useEffect(() => {
    applyLoad(loadData(getBrowserStorage()));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) applyLoad(loadData(getBrowserStorage()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applyLoad]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    const p = phaseRef.current;
    if (p === "blocked" || p === "loading") {
      toast.error(
        "Alteração não salva: os dados salvos não puderam ser lidos. Veja o aviso no topo.",
      );
      return false;
    }
    const next = fn(dataRef.current);
    if (p === "memory") {
      dataRef.current = next;
      setData(next);
      return true;
    }
    const res = saveData(getBrowserStorage(), next);
    if (res.ok) {
      setSavedAt(res.savedAt);
      setSaveError(null);
    } else {
      setSaveError(res.reason);
      toast.error(res.reason);
      return false;
    }
    dataRef.current = next;
    setData(next);
    return true;
  }, []);

  const upsert = useCallback(
    <K extends CollectionKey>(key: K, record: AppData[K][number]) =>
      update((d) => {
        const list = d[key] as unknown as { id: string }[];
        const exists = list.some((r) => r.id === record.id);
        const nextList = exists
          ? list.map((r) => (r.id === record.id ? record : r))
          : [...list, record];
        return { ...d, [key]: nextList };
      }),
    [update],
  );

  const remove = useCallback(
    (key: CollectionKey, id: string) => update((d) => removeWithLinks(d, key, id)),
    [update],
  );

  const resetBlocked = useCallback(() => {
    const storage = getBrowserStorage();
    if (!storage || !blocked) return;
    const res = resetAfterBackup(storage, blocked.raw);
    if (res.ok) {
      toast.success("Cópia de segurança guardada neste aparelho. Cadastro reiniciado.");
      applyLoad(loadData(storage));
    } else toast.error(res.reason);
  }, [blocked, applyLoad]);

  const exportText = useCallback(
    () => (blocked ? blocked.raw : serialize(dataRef.current)),
    [blocked],
  );

  const importText = useCallback(
    (raw: string) => {
      const r = parseEnvelope(raw);
      if (r.status !== "ok") {
        return {
          ok: false,
          message:
            r.status === "newer"
              ? "Arquivo de uma versão mais nova do aplicativo. Nada foi alterado."
              : r.status === "corrupt"
                ? `${r.reason} Nada foi alterado.`
                : "Arquivo não reconhecido. Nada foi alterado.",
        };
      }
      const storage = getBrowserStorage();
      if (storage) {
        const current = storage.getItem(STORAGE_KEY);
        if (current) backupRaw(storage, current, "antes-de-importar");
      }
      setPhase("ready");
      setBlocked(null);
      phaseRef.current = "ready";
      if (!update(() => r.data))
        return {
          ok: false,
          message:
            "Não foi possível salvar a cópia importada. Os dados anteriores foram preservados.",
        };
      return {
        ok: true,
        message: "Cópia importada. O conteúdo anterior foi guardado como cópia de segurança.",
      };
    },
    [update],
  );

  const loadDemo = useCallback(() => update((d) => mergeDemo(d, makeDemoData(newId))), [update]);
  const removeDemo = useCallback(() => update(stripDemo), [update]);

  const hasDemo = useMemo(() => {
    const d = data;
    return [
      d.people,
      d.animals,
      d.contacts,
      d.supplies,
      d.equipment,
      d.vehicles,
      d.destinations,
      d.kit,
      d.treatments,
      d.notices,
    ].some((l) => (l as { fictitious?: boolean }[]).some((r) => r.fictitious));
  }, [data]);

  const value: StoreValue = {
    phase,
    data,
    savedAt,
    saveError,
    blocked,
    memoryReason,
    update,
    upsert,
    remove,
    resetBlocked,
    exportText,
    importText,
    loadDemo,
    removeDemo,
    hasDemo,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function mergeDemo(d: AppData, demo: Partial<AppData>): AppData {
  const out = { ...d } as Record<string, unknown>;
  for (const [k, v] of Object.entries(demo)) {
    if (Array.isArray(v))
      out[k] = [...((d as unknown as Record<string, unknown[]>)[k] ?? []), ...v];
  }
  return out as unknown as AppData;
}

export function stripDemo(d: AppData): AppData {
  let next = d;
  const keys: CollectionKey[] = [
    "people",
    "animals",
    "contacts",
    "supplies",
    "equipment",
    "vehicles",
    "destinations",
    "kit",
    "treatments",
    "notices",
  ];
  for (const k of keys) {
    for (const r of next[k] as { id: string; fictitious?: boolean }[]) {
      if (r.fictitious) next = removeWithLinks(next, k, r.id);
    }
  }
  return next;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useStore precisa de <StoreProvider>");
  return v;
}

export function nowIso() {
  return new Date().toISOString();
}
