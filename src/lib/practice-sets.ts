import setsData from "../../data/practice-sets.json";
import type { PracticeSet } from "./types";

export const practiceSets: PracticeSet[] = setsData as PracticeSet[];

export function getPracticeSet(id: string): PracticeSet | undefined {
  return practiceSets.find((s) => s.id === id);
}
