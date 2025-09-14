export function formatTimestamp(timestampMs: number) {
  const dt = new Date(timestampMs);
  const year = dt.getFullYear();
  const month = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  const hours = dt.getHours();
  const hour = `${hours % 12 || 12}`.padStart(2, "0");
  const minute = `${dt.getMinutes()}`.padStart(2, "0");
  const amOrPm = hours >= 12 ? "pm" : "am";

  return `${year}-${month}-${day} ${hour}:${minute} ${amOrPm}`;
}

export function humanizeTimestamp(timestampMs: number) {
  const delta = Date.now() - timestampMs;
  const absDelta = Math.abs(delta);

  const units = [
    { label: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { label: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { label: "day", ms: 24 * 60 * 60 * 1000 },
    { label: "hour", ms: 60 * 60 * 1000 },
    { label: "minute", ms: 60 * 1000 },
  ];

  for (const { label, ms } of units) {
    if (absDelta >= ms) {
      const remainder = absDelta % ms;
      let value =
        remainder / ms >= 0.8
          ? Math.ceil(absDelta / ms)
          : Math.floor(absDelta / ms);
      if (delta >= 0) {
        return `${value} ${label}${value > 1 ? "s" : ""} ago`;
      } else {
        return `in ${value} ${label}${value > 1 ? "s" : ""}`;
      }
    }
  }
  return "just now";
}
