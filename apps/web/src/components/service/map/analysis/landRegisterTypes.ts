export type LandRegisterSummary = {
  parcel_count: number;
  full_included_count: number;
  partial_included_count: number;
  total_included_area_m2: number;
};

export type LandRegisterRow = {
  no: number;
  check: string;
  pnu: string;
  ledger_no: string;
  address: string;
  ledger_type: string;
  jibun: string;
  jimok: string;
  land_area_m2: number;
  included_area_m2: number;
  included_ratio: number | null;
  inclusion_type: string;
  official_price: number | null;
  price_base_date: string | null;
};

export type LandRegisterResponse = {
  input: {
    type: string;
    srid: number;
  };
  summary: LandRegisterSummary;
  rows: LandRegisterRow[];
};
