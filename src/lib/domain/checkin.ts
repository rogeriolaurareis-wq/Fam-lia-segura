import type { CheckIn } from "./types";

/**
 * There is no sending backend in this version. Every check-in is recorded on this device only,
 * with the single status below, regardless of connectivity.
 */
export const CHECKIN_STATUS_LABEL = "Registrado neste aparelho — não enviado";

export function createCheckIn(kind: CheckIn["kind"], note: string, now: Date, id: string): CheckIn {
  return {
    id,
    kind,
    createdAt: now.toISOString(),
    note: note.trim().slice(0, 300),
    status: "registrado_local_nao_enviado",
  };
}

export function checkInStatusLabel(_c: CheckIn): string {
  return CHECKIN_STATUS_LABEL;
}

export const CHECKIN_KIND_LABEL: Record<CheckIn["kind"], string> = {
  ok: "ESTÁ TUDO BEM",
  sos: "SOCORRO",
};
