import type { LandRegisterResponse } from "./landRegisterTypes";

export type SiteAnalysisLocationRow = {
  id: string;
  pnu: string | null;
  address: string | null;
};

export function buildSiteAnalysisLocationRows(data: LandRegisterResponse | null): SiteAnalysisLocationRow[] {
  if (!data) {
    return [];
  }

  return data.rows.map((row) => ({
    id: `${row.no}-${row.pnu}-${row.ledger_no}`,
    pnu: row.pnu || null,
    address: row.address || null
  }));
}
