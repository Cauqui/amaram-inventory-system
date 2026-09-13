export function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function createCsvContent(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\r\n")}`;
}

export function localFileTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const content = createCsvContent(headers, rows);
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}
