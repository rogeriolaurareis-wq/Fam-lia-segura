import type { AppData, CollectionKey } from "./types";

/**
 * Removes one record and clears references to it in other records, without deleting
 * independent records (e.g. removing a person keeps animals/treatments, only unlinks them).
 */
export function removeWithLinks(data: AppData, key: CollectionKey, id: string): AppData {
  const next: AppData = { ...data, [key]: (data[key] as { id: string }[]).filter((r) => r.id !== id) };
  if (key === "people") {
    next.people = next.people.map((p) => (p.responsibleId === id ? { ...p, responsibleId: null } : p));
    next.animals = next.animals.map((a) => (a.responsibleId === id ? { ...a, responsibleId: null } : a));
    next.treatments = next.treatments.map((t) =>
      t.holderType === "pessoa" && t.holderId === id ? { ...t, holderId: null } : t,
    );
  }
  if (key === "animals") {
    next.treatments = next.treatments.map((t) =>
      t.holderType === "animal" && t.holderId === id ? { ...t, holderId: null } : t,
    );
  }
  if (key === "contacts") {
    next.people = next.people.map((p) =>
      p.emergencyContactId === id ? { ...p, emergencyContactId: null } : p,
    );
    next.destinations = next.destinations.map((d) => (d.contactId === id ? { ...d, contactId: null } : d));
  }
  return next;
}

/** Counts how many other records point at this one (shown in the delete confirmation). */
export function countLinks(data: AppData, key: CollectionKey, id: string): number {
  if (key === "people")
    return (
      data.people.filter((p) => p.responsibleId === id).length +
      data.animals.filter((a) => a.responsibleId === id).length +
      data.treatments.filter((t) => t.holderType === "pessoa" && t.holderId === id).length
    );
  if (key === "animals")
    return data.treatments.filter((t) => t.holderType === "animal" && t.holderId === id).length;
  if (key === "contacts")
    return (
      data.people.filter((p) => p.emergencyContactId === id).length +
      data.destinations.filter((d) => d.contactId === id).length
    );
  return 0;
}
