/**
 * Analizador del CSV de alta masiva de clínicas.
 *
 * Vive aquí, y no en `server/adminOps.ts`, porque es lógica pura: no toca la
 * base de datos ni la sesión, y así puede probarse (y usarse desde un script)
 * sin arrastrar la cadena de autenticación de Next.
 */
import { isSafeExternalUrl } from "@/lib/validation";

export const CSV_HEADERS = ["name", "website", "address", "postal_code", "city", "province", "phone", "lat", "lng"] as const;
export const MAX_CSV_ROWS = 500;

export type CsvClinicRow = {
  rowNumber: number;
  errors: string[];
  data: {
    name: string;
    website: string | null;
    address: string;
    postalCode: string;
    city: string;
    province: string;
    phone: string;
    lat: number;
    lng: number;
  } | null;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/** Analiza y valida el CSV fila a fila. Sin dependencias externas. */
export function parseClinicsCsv(csvText: string): { rows: CsvClinicRow[]; headerError: string | null } {
  const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], headerError: "El CSV está vacío." };

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missing = CSV_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    return { rows: [], headerError: `Faltan columnas en la cabecera: ${missing.join(", ")}.` };
  }
  if (lines.length - 1 > MAX_CSV_ROWS) {
    return { rows: [], headerError: `Demasiadas filas (máximo ${MAX_CSV_ROWS} por importación).` };
  }

  const rows: CsvClinicRow[] = lines.slice(1).map((line, idx) => {
    const cells = splitCsvLine(line);
    const record: Record<string, string> = {};
    header.forEach((h, i) => {
      record[h] = cells[i] ?? "";
    });

    const errors: string[] = [];
    const name = record.name?.trim() ?? "";
    if (!name) errors.push("Falta el nombre.");

    const website = record.website?.trim() ?? "";
    if (website && !isSafeExternalUrl(website)) errors.push("La web no es una URL válida.");

    const address = record.address?.trim() ?? "";
    if (!address) errors.push("Falta la dirección.");

    const postalCode = record.postal_code?.trim() ?? "";
    if (!/^\d{5}$/.test(postalCode)) errors.push("El código postal debe tener 5 dígitos.");

    const city = record.city?.trim() ?? "";
    if (!city) errors.push("Falta el municipio.");

    const province = record.province?.trim() ?? "";
    if (!province) errors.push("Falta la provincia.");

    const phoneDigits = (record.phone ?? "").replace(/\D/g, "");
    const localPhone = phoneDigits.startsWith("34") && phoneDigits.length === 11 ? phoneDigits.slice(2) : phoneDigits;
    if (!/^[6789]\d{8}$/.test(localPhone)) errors.push("Teléfono no válido.");

    const lat = Number(record.lat);
    const lng = Number(record.lng);
    if (!Number.isFinite(lat) || lat < 27 || lat > 44) errors.push("Latitud fuera de rango para España.");
    if (!Number.isFinite(lng) || lng < -19 || lng > 5) errors.push("Longitud fuera de rango para España.");

    return {
      rowNumber: idx + 2,
      errors,
      data:
        errors.length === 0
          ? { name, website: website || null, address, postalCode, city, province, phone: localPhone, lat, lng }
          : null,
    };
  });

  return { rows, headerError: null };
}
