// Centralized application timezone configuration
// Mountain Time (Canada - Calgary/Edmonton) with DST handling automatically
export const APP_TIME_ZONE = "America/Edmonton"; // MST/MDT

// Optional helpers if needed elsewhere
export const formatTimeInTZ = (
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
) => {
  const d = new Date(value);
  return d.toLocaleTimeString([], { timeZone: APP_TIME_ZONE, ...options });
};

export const formatDateInTZ = (
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
) => {
  const d = new Date(value);
  return d.toLocaleDateString([], { timeZone: APP_TIME_ZONE, ...options });
};

export const isSameDayInTZ = (a: Date | string | number, b: Date | string | number) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  const fmt: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: APP_TIME_ZONE };
  return d1.toLocaleDateString("en-CA", fmt) === d2.toLocaleDateString("en-CA", fmt);
};
