export const WARDS = ["3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B", "7A", "7B"];

export function prescriptionWeekday(settings, ward) {
  const day = settings?.[ward];
  return Number.isInteger(day) && day >= 0 && day <= 6 ? day : null;
}

// Apply only explicitly configured wards; retain old records and completed dates.
export function updatePrescriptionWeekdays(orders, patients, settings) {
  const next = {...orders};
  for (const patient of patients) {
    if (!Object.hasOwn(settings, patient.room) || !orders[patient.id]) continue;
    const weekday = prescriptionWeekday(settings, patient.room);
    next[patient.id] = orders[patient.id].map(order =>
      order.type === "med" && order.name === "定期処方"
        ? {...order, regWeekday: weekday}
        : order
    );
  }
  return next;
}
