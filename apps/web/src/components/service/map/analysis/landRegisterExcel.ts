import type { LandRegisterResponse } from "./landRegisterTypes";

const SHEET_NAME = "토지대장 기초조서";
const TITLE = "토지대장 기초조서";
const HEADERS = [
  "연번",
  "확인 여부",
  "PNU",
  "대장번호",
  "주소",
  "대장구분",
  "지번",
  "지목",
  "토지면적(㎡)",
  "편입면적(㎡)",
  "편입상태",
  "개별공시지가(원)",
  "개별공시지가기준일",
  "소유자성명/명칭",
  "등록번호",
  "변동일",
  "변동원인"
];
const COLUMN_WIDTHS = [8, 10, 22, 24, 34, 12, 12, 10, 14, 14, 12, 16, 18, 20, 18, 14, 18];

function toCellText(value: string | null | undefined) {
  return value?.trim() ? value : "";
}

function toCellNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join("");
}

export async function downloadLandRegisterExcel(data: LandRegisterResponse): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = data.rows.map((row) => [
    toCellNumber(row.no),
    toCellText(row.check),
    toCellText(row.pnu),
    toCellText(row.ledger_no),
    toCellText(row.address),
    toCellText(row.ledger_type),
    toCellText(row.jibun),
    toCellText(row.jimok),
    toCellNumber(row.land_area_m2),
    toCellNumber(row.included_area_m2),
    toCellText(row.inclusion_type),
    toCellNumber(row.official_price),
    toCellText(row.price_base_date),
    "",
    "",
    "",
    ""
  ]);
  const worksheet = XLSX.utils.aoa_to_sheet([[TITLE], [], HEADERS, [], ...rows]);
  worksheet["!cols"] = COLUMN_WIDTHS.map((wch) => ({ wch }));
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, SHEET_NAME);

  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([output], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `토지조서_${formatTimestamp(new Date())}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
