import { emptyData, type AppData } from "@/lib/domain/types";
import { normalizeShopping } from "@/lib/domain/shopping";

/**
 * Versioned local persistence (browser localStorage). Nothing leaves the device.
 *
 * Safety rules:
 * - A read that fails (invalid JSON, wrong shape, newer schema) NEVER overwrites the stored
 *   value: the app enters a blocked state and writes are refused until the user decides.
 * - Before a migration or a user-requested reset, the raw value is copied to a backup key.
 */
export const STORAGE_KEY = "familia-segura:dados";
export const BACKUP_PREFIX = "familia-segura:backup:";
export const SCHEMA_VERSION = 2;
export const APP_ID = "familia-segura";

export interface Envelope {
  app: typeof APP_ID;
  schemaVersion: number;
  savedAt: string;
  data: AppData;
}

export type LoadResult =
  | { status: "ok"; data: AppData; savedAt: string | null; migratedFrom?: number }
  | { status: "empty"; data: AppData }
  | { status: "corrupt"; raw: string; reason: string }
  | { status: "newer"; raw: string; version: number }
  | { status: "unavailable"; reason: string };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
/** migrations[n] upgrades schema n -> n+1. */
const MIGRATIONS: Record<number, Migration> = { 1: (data) => ({ ...data }) };

const ARRAY_KEYS: (keyof AppData)[] = [
  "people",
  "animals",
  "contacts",
  "checkins",
  "supplies",
  "equipment",
  "vehicles",
  "destinations",
  "kit",
  "treatments",
  "notices",
];
const OBJECT_KEYS: (keyof AppData)[] = ["home", "water", "scenario", "exitPlan", "entertainment"];

/** Validates shape and fills missing sections with defaults. Throws on wrong types. */
export function normalizeData(input: unknown): AppData {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("dados não são um objeto");
  const src = input as Record<string, unknown>;
  const base = emptyData();
  const out = { ...base } as Record<string, unknown>;
  for (const k of ARRAY_KEYS) {
    if (src[k] === undefined) continue;
    if (!Array.isArray(src[k])) throw new Error(`seção "${k}" deveria ser uma lista`);
    const arr = src[k] as unknown[];
    if (
      arr.some((r) => !r || typeof r !== "object" || typeof (r as { id?: unknown }).id !== "string")
    )
      throw new Error(`registro inválido em "${k}"`);
    out[k] = arr;
  }
  for (const k of OBJECT_KEYS) {
    if (src[k] === undefined) continue;
    const v = src[k];
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`seção "${k}" inválida`);
    out[k] = { ...(base[k] as object), ...(v as object) };
  }
  out["shopping"] = normalizeShopping(src["shopping"]);
  return out as unknown as AppData;
}

export function parseEnvelope(raw: string): LoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: "corrupt",
      raw,
      reason: "O conteúdo salvo não pôde ser lido (formato inválido).",
    };
  }
  if (!parsed || typeof parsed !== "object" || (parsed as Envelope).app !== APP_ID)
    return {
      status: "corrupt",
      raw,
      reason: "O conteúdo salvo não é reconhecido como dados do Família Segura.",
    };
  const env = parsed as Envelope;
  const version = Number(env.schemaVersion);
  if (!Number.isInteger(version) || version < 1)
    return { status: "corrupt", raw, reason: "Versão dos dados ausente ou inválida." };
  if (version > SCHEMA_VERSION) return { status: "newer", raw, version };
  let data = env.data as unknown as Record<string, unknown>;
  try {
    for (let v = version; v < SCHEMA_VERSION; v++) {
      const m = MIGRATIONS[v];
      if (!m) throw new Error(`sem migração da versão ${v}`);
      data = m(data);
    }
    const normalized = normalizeData(data);
    return {
      status: "ok",
      data: normalized,
      savedAt: typeof env.savedAt === "string" ? env.savedAt : null,
      ...(version < SCHEMA_VERSION ? { migratedFrom: version } : {}),
    };
  } catch (e) {
    return {
      status: "corrupt",
      raw,
      reason: `Dados com estrutura inesperada: ${(e as Error).message}.`,
    };
  }
}

export function loadData(storage: StorageLike | null): LoadResult {
  if (!storage)
    return { status: "unavailable", reason: "Armazenamento local indisponível neste navegador." };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      status: "unavailable",
      reason: "O navegador bloqueou o acesso ao armazenamento local.",
    };
  }
  if (raw === null) return { status: "empty", data: emptyData() };
  const result = parseEnvelope(raw);
  if (result.status === "ok" && result.migratedFrom) {
    // Keep the pre-migration copy before anything is written in the new format.
    backupRaw(storage, raw, `migracao-v${result.migratedFrom}`);
  }
  return result;
}

export function serialize(data: AppData, now: Date = new Date()): string {
  const env: Envelope = {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    savedAt: now.toISOString(),
    data,
  };
  return JSON.stringify(env);
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: string };

export function saveData(
  storage: StorageLike | null,
  data: AppData,
  now: Date = new Date(),
): SaveResult {
  if (!storage) return { ok: false, reason: "Armazenamento local indisponível." };
  try {
    storage.setItem(STORAGE_KEY, serialize(data, now));
    return { ok: true, savedAt: now.toISOString() };
  } catch (e) {
    const quota = e instanceof Error && /quota/i.test(e.name + e.message);
    return {
      ok: false,
      reason: quota
        ? "Espaço de armazenamento do navegador esgotado. Nada foi apagado."
        : "Não foi possível salvar neste navegador. Nada foi apagado.",
    };
  }
}

export function backupRaw(
  storage: StorageLike,
  raw: string,
  label: string,
  now: Date = new Date(),
): string | null {
  const key = `${BACKUP_PREFIX}${label}:${now.toISOString()}`;
  try {
    storage.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

/** Only called after explicit user confirmation. Backs up the unreadable value first. */
export function resetAfterBackup(
  storage: StorageLike,
  raw: string,
  now: Date = new Date(),
): SaveResult {
  const key = backupRaw(storage, raw, "ilegivel", now);
  if (!key)
    return {
      ok: false,
      reason: "Não foi possível guardar a cópia de segurança; nada foi alterado.",
    };
  return saveData(storage, emptyData(), now);
}

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage;
    s.getItem(STORAGE_KEY); // throws when blocked (privacy mode / disabled storage)
    return s;
  } catch {
    return null;
  }
}
