/**
 * Dependency inventory generator for pnpm workspaces/projects.
 * - Includes the root project and all transitive dependencies.
 * - Cross‑platform (Windows/macOS/Linux). Safe for CI/Docker.
 * - Privacy‑safe by default: absolute paths are scrubbed from output and logs.
 *
 * Usage
 *   pnpm run gen:licenses
 *   # or
 *   tsx scripts/generate-licenses.ts [flags]
 *
 * Flags (with defaults)
 *   --out=<file>         Output JSON file. Default: dependencies.full.json
 *   --no-enrich          Skip reading installed package.json files for extra fields.
 *   --no-lock            Ignore pnpm-lock.yaml when building the union set.
 *   --debug              Verbose progress with samples and source paths summary.
 *   --print              After writing the file, print all package IDs to stdout.
 *   --sample=<n>         In debug mode, limit sample size printed. Default: 20
 *   --keep-paths         Keep absolute paths in output JSON and logs (OFF by default).
 *   --debug-paths        When --debug is enabled, also show absolute paths in logs.
 *   --pnpm=<path>        Explicit pnpm binary to use (e.g., "C:\\pnpm\\pnpm.exe").
 *
 * Output
 *   JSON with metadata and a packages[] array. Each package has:
 *   id, name, version, license, author, description, homepage, repository,
 *   publisherEmail and optionally path (relative to project root unless --keep-paths).
 *
 * Notes
 *   - The generator merges information from: pnpm list, the virtual store scan,
 *     the root node_modules scan, pnpm-lock.yaml (unless --no-lock), and pnpm licenses.
 *   - To avoid leaking machine paths, path is sanitized to a project‑relative path by default.
 *   - Requires devDependency: yaml
 */

import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as fss from "node:fs";
import * as path from "node:path";
import YAML from "yaml";

const execFileP = promisify(execFile);
const execP = promisify(exec);

/* ----------------------------- Types ----------------------------- */
type Json = unknown;

interface PnpmListNode {
  name: string;
  version: string;
  path?: string;
  private?: boolean;
  dependencies?: PnpmListNode[];
}

interface PnpmLicenseEntry {
  name: string;
  version: string;
  license?: string;
  licenses?: string;
  author?: string | { name?: string; email?: string; url?: string };
  description?: string;
  homepage?: string;
  repository?: string | { url?: string };
  email?: string;
}

interface PkgJson {
  name?: string;
  version?: string;
  description?: string;
  author?: PnpmLicenseEntry["author"];
  homepage?: string;
  repository?: string | { url?: string };
  license?: string;
  funding?: unknown;
  maintainers?: unknown;
  contributors?: unknown;
}

type PnpmLockLike = {
  lockfileVersion?: unknown;
  packages?: Record<string, unknown>;
  snapshots?: Record<string, unknown>;
};

interface PackageRecord {
  id: string; // name@version
  name: string;
  version: string;
  path?: string; // absolute during processing; sanitized to relative at output (unless --keep-paths)
  license?: string;
  author?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  publisherEmail?: string;
  funding?: unknown;
  maintainers?: unknown;
  contributors?: unknown;
}

/* --------------------------- CLI options ------------------------- */
const ARGV = new Set(process.argv.slice(2));
function readArg(name: string, def?: string) {
  for (const a of ARGV) if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  return def;
}
const OUT_PATH = path.resolve(process.cwd(), readArg("--out", "dependencies.full.json")!);
const ENRICH = !ARGV.has("--no-enrich");
const USE_LOCK = !ARGV.has("--no-lock");
const DEBUG = ARGV.has("--debug");
const PRINT_ALL = ARGV.has("--print");
const SAMPLE = Number(readArg("--sample", "20")) || 20;
const KEEP_PATHS = ARGV.has("--keep-paths");
const DEBUG_PATHS = ARGV.has("--debug-paths");

const isWin = process.platform === "win32";
const PNPM_OVERRIDE = readArg("--pnpm"); // e.g. --pnpm="C:\\path\\to\\pnpm.exe"
const CWD = process.cwd();

/* --------------------------- PNPM runner -------------------------- */
type RunOut = { stdout: string; stderr: string };

function log(msg: string) {
  console.log(msg);
}
function logPath(label: string, p?: string) {
  if (!DEBUG) return;
  const shown = KEEP_PATHS && DEBUG_PATHS ? (p ?? "") : sanitizeForDisplay(p);
  log(`${label}${shown ? `: ${shown}` : ""}`);
}

async function runPnpm(pnpmArgs: string[]): Promise<RunOut> {
  const maxBuffer = 1024 * 1024 * 64;

  const npmExecPath = process.env.npm_execpath || process.env.npm_execPath || "";
  if (npmExecPath && /pnpm/i.test(npmExecPath)) {
    if (DEBUG) log("[runPnpm] using pnpm via npm_execpath");
    if (DEBUG && DEBUG_PATHS) log(`  node: ${process.execPath}`);
    if (DEBUG && DEBUG_PATHS) log(`  execpath: ${npmExecPath}`);
    return execFileP(process.execPath, [npmExecPath, ...pnpmArgs], { encoding: "utf8", maxBuffer });
  }

  if (PNPM_OVERRIDE) {
    if (DEBUG) log("[runPnpm] using explicit pnpm override");
    if (DEBUG && DEBUG_PATHS) log(`  override: ${PNPM_OVERRIDE}`);
    return execFileP(PNPM_OVERRIDE, pnpmArgs, { encoding: "utf8", maxBuffer, shell: isWin });
  }

  try {
    const cmd = isWin ? "pnpm.cmd" : "pnpm";
    if (DEBUG) log(`[runPnpm] trying ${cmd}`);
    return await execFileP(cmd, pnpmArgs, { encoding: "utf8", maxBuffer, shell: isWin });
  } catch {
    /* continue to npx fallback */
  }

  const npxCmd = isWin ? "npx.cmd" : "npx";
  if (DEBUG) log(`[runPnpm] falling back to ${npxCmd} pnpm ...`);
  const cmdStr = `${npxCmd} pnpm ${pnpmArgs.map(escapeArg).join(" ")}`;
  return execP(cmdStr, { encoding: "utf8", maxBuffer });
}
function escapeArg(a: string) {
  if (/[\s"]/g.test(a)) return `"${a.replace(/"/g, '\\"')}"`;
  return a;
}

/* --------------------------- Utilities --------------------------- */
function normalizePkgId(name: string, version: string) {
  return `${name}@${version}`;
}
function cleanseAuthor(author: PnpmLicenseEntry["author"]): string | undefined {
  if (!author) return undefined;
  if (typeof author === "string") return author;
  const parts: string[] = [];
  if (author.name) parts.push(author.name);
  if (author.email) parts.push(`<${author.email}>`);
  if (author.url) parts.push(author.url);
  return parts.join(" ") || undefined;
}
function pickFirstDefined<T>(...vals: (T | undefined | null | "" | false)[]) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "" && v !== false) return v as T;
  return undefined;
}
function repoToString(repo: PnpmLicenseEntry["repository"]): string | undefined {
  if (!repo) return undefined;
  if (typeof repo === "string") return repo;
  return repo.url;
}
function extractHomepage(pj: PkgJson): string | undefined {
  const homepage = pj?.homepage;
  const repo = typeof pj?.repository === "string" ? pj.repository : pj?.repository?.url;
  return pickFirstDefined(homepage, repo);
}
function safeJson<T = Json>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    const preview = s.slice(0, 500);
    throw new Error(`Failed to parse JSON. Preview:\n${preview}\n\n${(e as Error).message}`);
  }
}
function uniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

/* ---- privacy helpers ---- */
function toPosix(p: string) {
  return p.split(path.sep).join("/");
}
function sanitizeForOutputPath(p?: string): string | undefined {
  if (!p) return undefined;
  if (KEEP_PATHS) return p;
  const rel = path.relative(CWD, p);
  if (!rel || rel === "") return ".";
  if (rel.startsWith("..")) return undefined; // outside project -> drop
  return toPosix(rel);
}
function sanitizeForDisplay(p?: string): string | undefined {
  const s = sanitizeForOutputPath(p);
  return s ?? "(outside project)";
}

/* ----------------------- Primary (pnpm list) ---------------------- */
async function runPnpmList(): Promise<PnpmListNode[]> {
  const { stdout } = await runPnpm(["list", "--json", "--depth", "Infinity"]);
  const parsed = safeJson<PnpmListNode[] | PnpmListNode>(stdout);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  return flattenTree(arr);
}
function flattenTree(nodes: PnpmListNode[]): PnpmListNode[] {
  const out: PnpmListNode[] = [];
  const stack = [...nodes];
  const seen = new Set<string>();
  while (stack.length) {
    const n = stack.pop()!;
    if (!n?.name || !n?.version) continue;
    const key = `${n.path ?? ""}::${n.name}@${n.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
    if (n.dependencies) for (const d of n.dependencies) stack.push(d);
  }
  return out;
}
function indexPkgJsons(nodes: PnpmListNode[]): PackageRecord[] {
  return nodes.map((n) => ({
    id: normalizePkgId(n.name, n.version),
    name: n.name,
    version: n.version,
    path: n.path // absolute for now; sanitized later
  }));
}

/* ------------------------- Licenses merge ------------------------- */
async function runPnpmLicenses(): Promise<PnpmLicenseEntry[]> {
  const { stdout } = await runPnpm(["licenses", "list", "--json", "--long"]);
  const parsed = safeJson<PnpmLicenseEntry[] | { packages?: unknown }>(stdout);
  // Some pnpm versions wrap as { packages: [...] }
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const maybe = (parsed as { packages?: unknown }).packages;
    if (Array.isArray(maybe)) return maybe as PnpmLicenseEntry[];
  }
  return [];
}
function mergeLicenses(records: PackageRecord[], licenses: PnpmLicenseEntry[]): PackageRecord[] {
  const map = new Map<string, PnpmLicenseEntry>();
  for (const l of licenses) map.set(normalizePkgId(l.name, l.version), l);
  for (const r of records) {
    const hit = map.get(r.id);
    if (!hit) continue;
    r.license = pickFirstDefined(hit.license, hit.licenses, r.license);
    r.author = pickFirstDefined(cleanseAuthor(hit.author), r.author);
    r.description = pickFirstDefined(hit.description, r.description);
    r.homepage = pickFirstDefined(hit.homepage, repoToString(hit.repository), r.homepage);
    r.repository = pickFirstDefined(repoToString(hit.repository), r.repository);
    r.publisherEmail = pickFirstDefined(hit.email, r.publisherEmail);
  }
  return records;
}

/* -------------------- Virtual store + root scans ------------------ */
async function getNodeModulesDir(): Promise<string> {
  const { stdout } = await runPnpm(["root"]);
  const nm = stdout.trim();
  if (!nm) throw new Error("Could not resolve node_modules directory via `pnpm root`.");
  return path.isAbsolute(nm) ? nm : path.resolve(CWD, nm);
}
async function resolveVirtualStoreDir(projectRootNm: string): Promise<string> {
  try {
    const { stdout } = await runPnpm(["config", "get", "virtual-store-dir"]);
    const v = stdout.trim();
    if (v && v !== "undefined") {
      const vsd = path.isAbsolute(v) ? v : path.resolve(CWD, v);
      logPath("[virtual store] from config", vsd);
      return vsd;
    }
  } catch {
    /* ignore */
  }
  const vsd = path.join(projectRootNm, ".pnpm");
  logPath("[virtual store] default", vsd);
  return vsd;
}

// Read entries under a node_modules directory (handles @scopes and symlinks)
async function collectPackagesUnderDir(dir: string): Promise<PackageRecord[]> {
  const out: PackageRecord[] = [];
  let entries: import("node:fs").Dirent[];
  try {
    entries = (await fs.readdir(dir, {
      withFileTypes: true
    })) as unknown as import("node:fs").Dirent[];
  } catch {
    return out;
  }

  for (const ent of entries) {
    const name = ent.name;
    // skip bins / internals
    if (name === ".bin" || name === ".pnpm") continue;

    // Handle scopes first
    if (name.startsWith("@")) {
      const scopeDir = path.join(dir, name);
      let scoped: import("node:fs").Dirent[];
      try {
        scoped = (await fs.readdir(scopeDir, {
          withFileTypes: true
        })) as unknown as import("node:fs").Dirent[];
      } catch {
        continue;
      }
      for (const child of scoped) {
        const childPath = path.join(scopeDir, child.name);
        const pjPath = path.join(childPath, "package.json");
        if (!(await exists(pjPath))) continue;
        try {
          const pj = JSON.parse(await fs.readFile(pjPath, "utf8"));
          if (!pj?.name || !pj?.version) continue;
          out.push(fromPackageJson(pj, path.dirname(pjPath))); // absolute now; sanitize later
        } catch {
          /* ignore */
        }
      }
      continue;
    }

    // Non-scoped at this level (dir OR symlink to dir)
    const pkgPath = path.join(dir, name);
    const pjPath = path.join(pkgPath, "package.json");
    if (!(await exists(pjPath))) continue;
    try {
      const pj = JSON.parse(await fs.readFile(pjPath, "utf8"));
      if (!pj?.name || !pj?.version) continue;
      out.push(fromPackageJson(pj, path.dirname(pjPath))); // absolute now; sanitize later
    } catch {
      /* ignore */
    }
  }
  return out;
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function fromPackageJson(
  pj: PkgJson & { name: string; version: string },
  pkgDir?: string
): PackageRecord {
  return {
    id: `${pj.name}@${pj.version}`,
    name: pj.name,
    version: pj.version,
    path: pkgDir, // absolute; sanitized for output
    description: pj.description,
    author: cleanseAuthor(pj.author),
    homepage: extractHomepage(pj),
    repository: typeof pj.repository === "string" ? pj.repository : pj?.repository?.url,
    license: pj.license,
    funding: pj.funding,
    maintainers: pj.maintainers,
    contributors: pj.contributors
  };
}

async function scanVirtualStore(): Promise<PackageRecord[]> {
  const nm = await getNodeModulesDir();
  const vsd = await resolveVirtualStoreDir(nm);
  if (!fss.existsSync(vsd)) {
    throw new Error(`Virtual store not found (did you run "pnpm install"?).`);
  }

  const entries = await fs.readdir(vsd, { withFileTypes: true });
  let totalBuckets = 0;
  const records: PackageRecord[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const innerNm = path.join(vsd, ent.name, "node_modules");
    if (!(await exists(innerNm))) continue;
    totalBuckets++;
    const pkgs = await collectPackagesUnderDir(innerNm);
    records.push(...pkgs);
  }

  const uniq = uniqueById(records).sort((a, b) => a.id.localeCompare(b.id));
  if (DEBUG)
    log(
      `[virtual store] buckets=${totalBuckets}, scanned=${records.length}, unique=${uniq.length}`
    );
  return uniq;
}

async function scanRootNodeModules(): Promise<PackageRecord[]> {
  const nm = await getNodeModulesDir();
  const records = await collectPackagesUnderDir(nm);
  if (DEBUG) log(`[root node_modules] scanned=${records.length}`);
  return uniqueById(records);
}

/* -------------------------- Lockfile parse ------------------------ */
async function findLockfileUpwards(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  while (true) {
    const candidate = path.join(dir, "pnpm-lock.yaml");
    if (fss.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function parseLockKey(rawKey: string): { name: string; version: string } | null {
  // Accept both:
  // - "/name@1.2.3"
  // - "@scope/name@1.2.3"
  // - "name@1.2.3(peer@x)(peer2@y)"
  // - "/@scope/name@npm:1.2.3"
  let key = String(rawKey).trim();
  if (!key) return null;
  // strip leading slash
  if (key.startsWith("/")) key = key.slice(1);
  // drop peer suffix like "(...)" if present
  const parenIdx = key.indexOf("(");
  if (parenIdx > -1) key = key.slice(0, parenIdx);
  // last '@' separates version (works with @scopes)
  const at = key.lastIndexOf("@");
  if (at <= 0 || at === key.length - 1) return null;
  const name = key.slice(0, at);
  let version = key.slice(at + 1);
  if (version.startsWith("npm:")) version = version.slice(4);
  return { name, version };
}

async function parseLockfile(): Promise<{
  entries: PackageRecord[];
  lockPath?: string;
  lockVersion?: string;
}> {
  const lockPath = await findLockfileUpwards(CWD);
  if (!lockPath) {
    if (DEBUG) log("[lockfile] not found");
    return { entries: [] };
  }
  const text = await fs.readFile(lockPath, "utf8");
  const data = YAML.parse(text) as PnpmLockLike;
  const lockVersion = String(data?.lockfileVersion ?? "");
  const out: PackageRecord[] = [];

  // v7/8: data.packages has "/name@version" keys
  // v9: data.snapshots has "name@version(...)" keys, and data.packages may still exist
  const maps = [data?.packages, data?.snapshots].filter(Boolean);

  for (const m of maps) {
    if (m && typeof m === "object") {
      for (const rawKey of Object.keys(m)) {
        const parsed = parseLockKey(rawKey);
        if (!parsed) continue;
        out.push({
          id: `${parsed.name}@${parsed.version}`,
          name: parsed.name,
          version: parsed.version
        });
      }
    }
  }

  const uniq = uniqueById(out).sort((a, b) => a.id.localeCompare(b.id));
  const shown = KEEP_PATHS && DEBUG_PATHS ? lockPath : sanitizeForDisplay(lockPath);
  if (DEBUG) log(`[lockfile] path=${shown}, version=${lockVersion || "?"}, parsed=${uniq.length}`);
  return { entries: uniq, lockPath, lockVersion };
}

/* ---------------------------- Enrichment -------------------------- */
async function enrichFromInstalledPackageJson(records: PackageRecord[]): Promise<PackageRecord[]> {
  for (const r of records) {
    if (!r.path) continue; // absolute path for reading only
    try {
      const pjStr = await fs.readFile(path.join(r.path, "package.json"), "utf8");
      const pj = JSON.parse(pjStr);
      r.description = r.description ?? pj.description;
      r.author = r.author ?? cleanseAuthor(pj.author);
      r.homepage = r.homepage ?? extractHomepage(pj);
      r.license = r.license ?? pj.license;
      if (!r.repository && pj.repository) {
        r.repository = typeof pj.repository === "string" ? pj.repository : pj.repository.url;
      }
      if (pj.funding) r.funding = pj.funding;
      if (pj.maintainers) r.maintainers = pj.maintainers;
      if (pj.contributors) r.contributors = pj.contributors;
    } catch {
      /* ignore */
    }
  }
  return records;
}

/* ----------------------- Root project injection ------------------- */
async function readRootProjectRecord(): Promise<PackageRecord | null> {
  const pjPath = path.resolve(CWD, "package.json");
  if (!fss.existsSync(pjPath)) return null;
  try {
    const pj = JSON.parse(await fs.readFile(pjPath, "utf8"));
    if (!pj?.name || !pj?.version) return null;
    return fromPackageJson(pj, path.dirname(pjPath)); // absolute now; sanitize later
  } catch {
    return null;
  }
}

/* ----------------------------- Logging ---------------------------- */
function printSample(title: string, list: PackageRecord[], n = SAMPLE) {
  if (!DEBUG) return;
  const ids = list.map((x) => x.id).sort((a, b) => a.localeCompare(b));
  log(`${title} sample(${Math.min(n, ids.length)} of ${ids.length}):`);
  for (const id of ids.slice(0, n)) log(`  - ${id}`);
  if (ids.length > n) log(`  ... (+${ids.length - n} more)`);
}

/* -------------------------- Sanitization -------------------------- */
function sanitizeRecordsForOutput(records: PackageRecord[]): PackageRecord[] {
  // Do not mutate originals; clone with sanitized path
  return records.map((r) => {
    const clone: PackageRecord = { ...r };
    const sp = sanitizeForOutputPath(clone.path);
    if (sp === undefined && !KEEP_PATHS) delete (clone as { path?: string }).path;
    else if (sp !== undefined) clone.path = sp;
    return clone;
  });
}

/* ------------------------------- Main ----------------------------- */
async function main() {
  const started = Date.now();

  // 0) Always include the root project
  const rootRecord = await readRootProjectRecord();
  if (DEBUG && rootRecord) log(`[root] ${rootRecord.id}`);

  // 1) Try pnpm list (may return only root in some envs)
  let records_list: PackageRecord[] = [];
  try {
    const listNodes = await runPnpmList();
    records_list = indexPkgJsons(listNodes);
    if (DEBUG) log(`[pnpm list] nodes=${records_list.length}`);
    printSample("[pnpm list]", records_list);
  } catch {
    if (DEBUG) log(`[pnpm list] failed, will use fallbacks`);
  }

  // 2) Virtual store + root node_modules scans
  let usedVirtualStoreFallback = false;
  let records_vs: PackageRecord[] = [];
  let records_rootnm: PackageRecord[] = [];
  if (records_list.length <= 1) {
    usedVirtualStoreFallback = true;
    if (DEBUG) log(`[info] Falling back to scanning virtual store...`);
    records_vs = await scanVirtualStore();
    printSample("[virtual store]", records_vs);
    records_rootnm = await scanRootNodeModules();
    printSample("[root node_modules]", records_rootnm);
  }

  // Union of installed sources
  const installedUnion = uniqueById([...records_list, ...records_vs, ...records_rootnm]);
  if (DEBUG)
    log(
      `[installed] pre-dedupe=${records_list.length + records_vs.length + records_rootnm.length}, unique=${installedUnion.length}`
    );
  printSample("[installed union]", installedUnion);

  // 3) Lockfile union (source of truth for complete set), unless disabled
  let usedLock = false;
  let lockEntries: PackageRecord[] = [];
  if (USE_LOCK) {
    usedLock = true;
    const { entries } = await parseLockfile();
    lockEntries = entries;
    printSample("[lockfile entries]", lockEntries);
  }

  // Merge installed + lock (prefer installed metadata)
  const map = new Map<string, PackageRecord>();
  for (const r of installedUnion) map.set(r.id, r);
  for (const lr of lockEntries) if (!map.has(lr.id)) map.set(lr.id, lr);
  let merged = Array.from(map.values());
  if (DEBUG)
    log(
      `[merge] installed=${installedUnion.length}, lock=${lockEntries.length}, merged=${merged.length}`
    );

  // 4) Merge license info (best effort)
  try {
    const licenseEntries = await runPnpmLicenses();
    merged = mergeLicenses(merged, licenseEntries);
  } catch {
    if (DEBUG) log(`[pnpm licenses] failed (continuing)`);
  }

  // 5) Optional enrichment from installed package.json
  if (ENRICH) merged = await enrichFromInstalledPackageJson(merged);

  // 6) Ensure root is present; dedupe; sort
  if (rootRecord) merged = uniqueById([rootRecord, ...merged]);
  merged = merged.sort((a, b) => a.id.localeCompare(b.id));

  // Debug split: installed vs lock-only
  if (DEBUG) {
    const installedSet = new Set(installedUnion.map((r) => r.id));
    const lockOnly = merged.filter((r) => !installedSet.has(r.id));
    log(
      `[summary] installedUnique=${installedUnion.length}, lockOnly=${lockOnly.length}, total=${merged.length}`
    );
    printSample("[lock-only sample]", lockOnly);
  }

  // 7) Sanitize paths for OUTPUT
  const outputPackages = sanitizeRecordsForOutput(merged);

  // 8) Output file (root is privacy-safe ".")
  const payload = {
    generatedAt: new Date().toISOString(),
    root: ".", // scrub absolute project path
    stats: {
      usedVirtualStoreFallback,
      usedLockfile: usedLock,
      counts: {
        pnpmList: records_list.length,
        virtualStore: records_vs.length,
        rootNodeModules: records_rootnm.length,
        installedUnion: installedUnion.length,
        lockfile: lockEntries.length,
        final: outputPackages.length
      }
    },
    packages: outputPackages
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const ms = Date.now() - started;
  const outShown = sanitizeForDisplay(OUT_PATH) || path.basename(OUT_PATH);
  log(
    `Wrote ${outputPackages.length} packages to ${outShown} in ${ms}ms (fallback=${usedVirtualStoreFallback}, lock=${usedLock})`
  );

  if (PRINT_ALL) {
    log("\nAll package IDs:");
    for (const r of outputPackages) log(r.id);
  }
}

main().catch((err) => {
  console.error("[export-deps] ERROR:");
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
