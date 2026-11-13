import type { Vehicle } from "./types";

export interface CapacityResult {
  workingVehicles: number;
  seats: number;
  animalSpaces: number;
  people: number;
  animals: number;
  missingSeats: number;
  missingAnimalSpaces: number;
  /** True only means the declared numbers add up — it never means the exit is viable. */
  numbersCover: boolean;
}

/** Only vehicles declared as working ("sim") count. "Não sei" is not counted. */
export function computeCapacity(vehicles: Vehicle[], people: number, animals: number): CapacityResult {
  const working = vehicles.filter((v) => v.working === "sim");
  const seats = working.reduce((a, v) => a + Math.max(0, v.seatsHumans || 0), 0);
  const animalSpaces = working.reduce((a, v) => a + Math.max(0, v.animalSpaces || 0), 0);
  const missingSeats = Math.max(0, people - seats);
  const missingAnimalSpaces = Math.max(0, animals - animalSpaces);
  return {
    workingVehicles: working.length,
    seats,
    animalSpaces,
    people,
    animals,
    missingSeats,
    missingAnimalSpaces,
    numbersCover: missingSeats === 0 && missingAnimalSpaces === 0 && working.length > 0,
  };
}
