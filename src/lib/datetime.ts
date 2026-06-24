import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

// Toda la app opera en horario de Argentina. Los datetime se ENVIAN en UTC
// explicito y se MUESTRAN convertidos a esta zona.
export const AR_TZ = "America/Argentina/Buenos_Aires";

/**
 * Convierte una hora de pared en Argentina (fecha `YYYY-MM-DD` + hora `HH:mm`)
 * al instante UTC equivalente, en ISO 8601 con `Z` (sin milisegundos). ENVIAR al backend.
 * Ej: ("2026-06-23", "23:39") -> "2026-06-24T02:39:00Z".
 */
export function arWallTimeToUtcIso(dateStr: string, timeHHmm: string): string {
  const utc = fromZonedTime(`${dateStr}T${timeHHmm}:00`, AR_TZ);
  return formatInTimeZone(utc, "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

/**
 * Formatea un instante (ISO/Date del backend, en UTC) en horario de Argentina.
 * Ej: formatAr("2026-06-19T17:30:00Z", "HH:mm") -> "14:30".
 */
export function formatAr(value: string | Date | number, fmt: string): string {
  return formatInTimeZone(value, AR_TZ, fmt, { locale: es });
}

/** Fecha calendario de "hoy" en Argentina (`YYYY-MM-DD`). */
export function todayAr(): string {
  return formatInTimeZone(new Date(), AR_TZ, "yyyy-MM-dd");
}
