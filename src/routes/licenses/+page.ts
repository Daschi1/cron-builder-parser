import type { PageLoad } from "./$types";

export type LicensePackage = {
  name: string;
  version: string;
  license: string;
  repository?: string | null;
  url?: string | null;
  publisher?: string | null;
  email?: string | null;
};

export type LicensesPayload = {
  generatedAt: string;
  total: number;
  byLicense: Record<string, number>;
  packages: LicensePackage[];
};

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch("/licenses.json", {
      headers: { "cache-control": "no-cache" }
    });
    if (!res.ok) return { licenses: null as LicensesPayload | null };
    const data: LicensesPayload = await res.json();
    return { licenses: data };
  } catch {
    return { licenses: null as LicensesPayload | null };
  }
};
