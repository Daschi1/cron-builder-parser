/*
  General URL sanitizer and helpers.
  - Normalizes various git/ssh aliases to https URLs for known hosts (GitHub, GitLab, Bitbucket).
  - Trims trailing .git
  - Expands shorthands like owner/repo and provider aliases github:/gitlab:/bitbucket:
  - Adds https:// when protocol is missing for known hosts or www.
  - Optionally infers shorthand owner/repo for non-URL strings when inferShorthand is true.
*/

export type SanitizeOptions = {
  inferShorthand?: boolean; // default true
  keepHash?: boolean; // default true
};

const HTTPS_HOSTS = new Set(["github.com", "gitlab.com", "bitbucket.org"]);

export function sanitizeUrl(raw?: string, opts: SanitizeOptions = {}): string | undefined {
  const { inferShorthand = true, keepHash = true } = opts;
  if (!raw) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;

  // Drop git+ prefix
  if (s.startsWith("git+")) s = s.slice(4);

  // git@host:owner/repo(.git)
  const scpLike = s.match(/^git@([^:]+):(.+)$/i);
  if (scpLike) {
    const host = scpLike[1];
    let path = scpLike[2];
    path = path.replace(/\.git$/i, "");
    return `https://${host}/${path}`;
  }

  // Provider shorthands like github:user/repo
  const providerShort = s.match(/^(github|gitlab|bitbucket):([^#]+)$/i);
  if (providerShort) {
    const provider = providerShort[1].toLowerCase();
    const path = providerShort[2].replace(/\.git$/i, "");
    const host =
      provider === "github" ? "github.com" : provider === "gitlab" ? "gitlab.com" : "bitbucket.org";
    return `https://${host}/${path}`;
  }

  // Plain GitHub shorthand owner/repo
  if (/^[\w.-]+\/[\w.-]+$/.test(s)) {
    if (!inferShorthand) return undefined;
    return `https://github.com/${s}`;
  }

  // Missing protocol but starts with known host or www
  if (/^(www\.|github\.com\/|gitlab\.com\/|bitbucket\.org\/)/i.test(s)) {
    s = `https://${s}`;
  }

  // git://host/user/repo(.git) -> https
  if (s.toLowerCase().startsWith("git://")) {
    s = "https://" + s.slice(6);
  }

  // ssh://git@host/user/repo(.git) -> https://host/user/repo
  if (s.toLowerCase().startsWith("ssh://")) {
    try {
      const u = new URL(s);
      const host = u.hostname;
      let path = u.pathname.replace(/^\/+/, "");
      path = path.replace(/\.git$/i, "");
      return `https://${host}/${path}`;
    } catch {
      // fall through
    }
  }

  // If it's a regular URL, tidy it
  try {
    const u = new URL(s);

    // Prefer https on well-known hosts
    const proto = HTTPS_HOSTS.has(u.hostname) ? "https:" : u.protocol;

    const pathname = u.pathname.replace(/\.git$/i, "");
    const hash = keepHash ? u.hash : "";
    const normalized = `${proto}//${u.host}${pathname}${u.search}${hash}`;
    if (normalized.startsWith("http")) return normalized;
    return undefined;
  } catch {
    // Not a URL
    return undefined;
  }
}
