import {parseDate} from "./dates.js";
export const URGENCY_LABELS = {"":"未設定", high:"高", medium:"中", low:"低"};
const RANK = {high:0, medium:1, low:2};

export function manualCCr(value) {
  if (typeof value === "boolean" || value == null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function patientFloor(ward) {
  return String(ward || "").match(/^\d+/)?.[0] || "other";
}

export function admissionTime(patient) { return parseDate(patient.admitDateISO || patient.admitDate)?.getTime() ?? null; }

export function selectPatients(patients, {doctor="all",floor="all",sort="ward"} = {}) {
  const filtered = patients.filter(p => (doctor === "all" || p.doctor === doctor) && (floor === "all" || patientFloor(p.room) === floor));
  return filtered.sort((a,b) => {
    if (sort === "urgency") return (RANK[a.urgency] ?? 3) - (RANK[b.urgency] ?? 3);
    if (sort === "admission") {
      const ad = admissionTime(a), bd = admissionTime(b);
      if (ad === null) return bd === null ? 0 : 1;
      if (bd === null) return -1;
      return bd - ad;
    }
    return 0; // Input already follows the established ward order. Ties stay stable.
  });
}
