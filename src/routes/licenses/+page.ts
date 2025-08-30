import type { PageLoad } from "./$types";

export type LicensePkg = {
  id: string;
  name: string;
  version: string;
  path?: string;
  license?: string;
  author?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  publisherEmail?: string;
  funding?: unknown;
  maintainers?: unknown;
  contributors?: unknown;
};

export type LicensesFile = {
  generatedAt: string;
  root?: string;
  stats?: {
    usedVirtualStoreFallback?: boolean;
    usedLockfile?: boolean;
    counts?: {
      pnpmList?: number;
      virtualStore?: number;
      rootNodeModules?: number;
      installedUnion?: number;
      lockfile?: number;
      final?: number;
    };
  };
  packages: LicensePkg[];
};

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch("/licenses.json", { headers: { "cache-control": "no-cache" } });
    if (!res.ok) return { licenses: null as LicensesFile | null };
    const data: LicensesFile = await res.json();
    return { licenses: data };
  } catch {
    return { licenses: null as LicensesFile | null };
  }
};
