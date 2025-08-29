/// <reference types="node" />
// Generate a consolidated licenses.json for all production dependencies
// Usage: pnpm gen:licenses
// Requires: devDependency "license-checker-rseidelsohn" and "tsx" to run

import { createRequire } from "module";
import { mkdir, writeFile, readdir, readFile, stat } from "fs/promises";
import path from "path";
import { exec } from "child_process";

// Types that reflect the shape we emit and partially what license-checker returns
interface LicenseCheckerPackageInfo {
  licenses?: string | string[];
  repository?: string | null;
  publisher?: string | null;
  email?: string | null;
  url?: string | null;
  homepage?: string | null;
  licenseFile?: string | null;
}

export type LicensePackage = {
  name: string;
  version: string;
  license: string;
  repository: string | null;
  publisher: string | null;
  email: string | null;
  url: string | null;
};

export type LicensesPayload = {
  generatedAt: string;
  total: number;
  byLicense: Record<string, number>;
  packages: LicensePackage[];
};

const requireCjs = createRequire(import.meta.url);

function loadLicenseChecker(): {
  init: (
    options: Record<string, unknown>,
    cb: (err: unknown, results: Record<string, LicenseCheckerPackageInfo>) => void
  ) => void;
} {
  try {
    // license-checker-rseidelsohn is CommonJS; require via createRequire
    const licenseChecker = requireCjs("license-checker-rseidelsohn");
    return licenseChecker as {
      init: (
        options: Record<string, unknown>,
        cb: (err: unknown, results: Record<string, LicenseCheckerPackageInfo>) => void
      ) => void;
    };
  } catch {
    throw new Error(
      'Missing devDependency "license-checker-rseidelsohn". Install it with: pnpm add -D license-checker-rseidelsohn'
    );
  }
}

function parseKey(key: string): { name: string; version: string } {
  // key is typically "name@version"; scoped packages look like "@scope/name@version"
  const lastAt = key.lastIndexOf("@");
  if (lastAt <= 0) return { name: key, version: "" };
  const name = key.slice(0, lastAt);
  const version = key.slice(lastAt + 1);
  return { name, version };
}

function normalizeLicense(licenses: string | string[] | undefined): string {
  if (!licenses) return "UNKNOWN";
  return Array.isArray(licenses) ? licenses.join(" OR ") : String(licenses);
}

async function generate(): Promise<LicensesPayload> {
  const start = process.cwd();

  const licenseChecker = loadLicenseChecker();

  const options = {
    start,
    production: true,
    development: true,
    excludePrivatePackages: false,
    direct: false, // include transitive deps as well
    licenseFile: false // do not include license file path to avoid leaking absolute paths
  } satisfies Record<string, unknown>;

  let packages: Record<string, LicenseCheckerPackageInfo> = await new Promise((resolve, reject) => {
    licenseChecker.init(options, (err, results) => {
      if (err) return reject(err);
      resolve(results ?? {});
    });
  });

  // Fallback via CLI if API seems to return only the root package
  const apiKeys = Object.keys(packages ?? {});
  const likelyOnlyRoot = apiKeys.length <= 1;
  if (likelyOnlyRoot) {
    // Attempt via pnpm exec first
    try {
      const { stdout } = await new Promise<{ stdout: string; stderr: string }>(
        (resolve, reject) => {
          exec(
            `${process.platform === "win32" ? "pnpm.cmd" : "pnpm"} exec license-checker-rseidelsohn --json --production --development`,
            { cwd: start, maxBuffer: 10 * 1024 * 1024 },
            (err, stdout, stderr) => {
              if (err) return reject(err);
              resolve({ stdout, stderr });
            }
          );
        }
      );
      const parsed = JSON.parse(stdout) as Record<string, LicenseCheckerPackageInfo>;
      const count = parsed ? Object.keys(parsed).length : 0;
      console.log(`[fallback pnpm exec] parsed ${count} entries`);
      if (parsed && count > 0) {
        packages = parsed;
      }
    } catch {
      // Fallback to executing the local .bin directly
      try {
        const bin = path.join(
          start,
          "node_modules",
          ".bin",
          process.platform === "win32"
            ? "license-checker-rseidelsohn.cmd"
            : "license-checker-rseidelsohn"
        );
        const { stdout } = await new Promise<{ stdout: string; stderr: string }>(
          (resolve, reject) => {
            exec(
              `"${bin}" --json --production --development`,
              { cwd: start, maxBuffer: 20 * 1024 * 1024 },
              (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve({ stdout, stderr });
              }
            );
          }
        );
        const parsed = JSON.parse(stdout) as Record<string, LicenseCheckerPackageInfo>;
        const count = parsed ? Object.keys(parsed).length : 0;
        console.log(`[fallback .bin] parsed ${count} entries`);
        if (parsed && count > 0) {
          packages = parsed;
        }
      } catch (e2) {
        console.warn("license-checker CLI fallback failed:", (e2 as Error)?.message);
      }
    }

    // If we still only see the root or nothing, fallback to scanning pnpm store structure
    const stillOnlyRoot = Object.keys(packages ?? {}).length <= 1;
    if (stillOnlyRoot) {
      console.log(
        "[fallback pnpm .pnpm scan] attempting to enumerate packages from node_modules/.pnpm"
      );
      const pnpmDir = path.join(start, "node_modules", ".pnpm");
      try {
        const entries = await readdir(pnpmDir, { withFileTypes: true });
        const seen = new Set<string>();
        const result: Record<string, LicenseCheckerPackageInfo> = {};
        for (const ent of entries) {
          if (!ent.isDirectory()) continue;
          const base = path.join(pnpmDir, ent.name, "node_modules");
          try {
            let hasNodeModules = false;
            try {
              await stat(base);
              hasNodeModules = true;
            } catch {
              hasNodeModules = false;
            }
            if (!hasNodeModules) continue;
            const nmEntries = await readdir(base, { withFileTypes: true });
            for (const nmEnt of nmEntries) {
              if (nmEnt.name.startsWith("@") && nmEnt.isDirectory()) {
                const scopeDir = path.join(base, nmEnt.name);
                const scoped = await readdir(scopeDir, { withFileTypes: true });
                for (const pkgEnt of scoped) {
                  if (!pkgEnt.isDirectory()) continue;
                  const pkgDir = path.join(scopeDir, pkgEnt.name);
                  const pkgJsonPath = path.join(pkgDir, "package.json");
                  const key = pkgDir;
                  if (seen.has(key)) continue;
                  seen.add(key);
                  try {
                    const raw = await readFile(pkgJsonPath, "utf8");
                    const pj = JSON.parse(raw);
                    const lic = normalizeLicense(pj.license?.type ?? pj.license ?? pj.licenses);
                    const repository =
                      typeof pj.repository === "string" ? pj.repository : pj.repository?.url;
                    result[`${pj.name}@${pj.version}`] = {
                      licenses: lic,
                      repository: repository ?? null,
                      publisher:
                        (typeof pj.author === "string" ? pj.author : pj.author?.name) ?? null,
                      email: (typeof pj.author === "object" ? pj.author?.email : null) ?? null,
                      url: pj.homepage ?? null
                    };
                  } catch {
                    // ignore unreadable or missing package.json
                  }
                }
              } else if (nmEnt.isDirectory()) {
                const pkgDir = path.join(base, nmEnt.name);
                const pkgJsonPath = path.join(pkgDir, "package.json");
                const key = pkgDir;
                if (seen.has(key)) continue;
                seen.add(key);
                try {
                  const raw = await readFile(pkgJsonPath, "utf8");
                  const pj = JSON.parse(raw);
                  const lic = normalizeLicense(pj.license?.type ?? pj.license ?? pj.licenses);
                  const repository =
                    typeof pj.repository === "string" ? pj.repository : pj.repository?.url;
                  result[`${pj.name}@${pj.version}`] = {
                    licenses: lic,
                    repository: repository ?? null,
                    publisher:
                      (typeof pj.author === "string" ? pj.author : pj.author?.name) ?? null,
                    email: (typeof pj.author === "object" ? pj.author?.email : null) ?? null,
                    url: pj.homepage ?? null
                  };
                } catch {
                  // ignore unreadable or missing package.json
                }
              }
            }
          } catch {
            // ignore non-standard entries
          }
        }
        if (Object.keys(result).length > 0) {
          packages = result;
        }
      } catch (e3) {
        console.warn("pnpm .pnpm scan fallback failed:", (e3 as Error)?.message);
      }
    }
  }

  // Ensure the root project itself is included (fallback scans may omit it)
  try {
    const pj = requireCjs(path.join(start, "package.json"));
    if (pj?.name && pj?.version) {
      const repository = typeof pj.repository === "string" ? pj.repository : pj.repository?.url;
      const rootLic = normalizeLicense(
        pj.license?.type ?? pj.license ?? pj.licenses ?? (pj.private ? "UNLICENSED" : undefined)
      );
      packages[`${pj.name}@${pj.version}`] = {
        licenses: rootLic,
        repository: repository ?? null,
        publisher: (typeof pj.author === "string" ? pj.author : pj.author?.name) ?? null,
        email: (typeof pj.author === "object" ? pj.author?.email : null) ?? null,
        url: pj.homepage ?? null
      };
    }
  } catch {
    // ignore if package.json is missing or unreadable
  }

  // Include all packages, including the root project itself
  const items: LicensePackage[] = Object.entries(packages).map(([key, info]) => {
    const { name, version } = parseKey(key);
    const license = normalizeLicense(info.licenses);
    return {
      name,
      version,
      license,
      repository: info.repository ?? null,
      publisher: info.publisher ?? null,
      email: info.email ?? null,
      url: info.url ?? info.homepage ?? null
    } satisfies LicensePackage;
  });

  // Build a summary by license type
  const byLicense = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.license] = (acc[it.license] ?? 0) + 1;
    return acc;
  }, {});

  items.sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    total: items.length,
    byLicense,
    packages: items
  } satisfies LicensesPayload;
}

async function main() {
  const outDir = path.join(process.cwd(), "static");
  const outFile = path.join(outDir, "licenses.json");

  const payload = await generate();

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(payload, null, 2), "utf8");

  console.log(`\nGenerated ${payload.total} package license entries at: ${outFile}`);
}

main().catch((err: unknown) => {
  console.error("Failed to generate licenses.json");
  console.error((err as Error)?.stack ?? err);
  process.exit(1);
});
