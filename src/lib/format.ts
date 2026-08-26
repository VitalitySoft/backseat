export function formatDeparture(date: Date | string | null): string {
  if (!date) return "Departure time not set";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function hasDeparted(date: Date | string | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() <= Date.now();
}
