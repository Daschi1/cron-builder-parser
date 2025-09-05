// IPv4 subnet utilities
// Clean, typed, self-contained helpers for parsing IPv4 addresses, masks, and computing subnet details.

export type IPv4Info =
  | {
      ok: true;
      inputIp: string;
      inputMask: string;
      ip: string;
      prefix: number; // 0..32
      mask: string; // dotted
      wildcard: string; // dotted
      network: string;
      broadcast: string;
      firstHost: string;
      lastHost: string;
      total: number; // total addresses in subnet
      usable: number; // usable host addresses
      range: string; // firstHost - lastHost (or network - broadcast for /31,/32)
      class: "A" | "B" | "C" | "D" | "E";
      flags: {
        isPrivateRFC1918: boolean;
        isLoopback: boolean;
        isLinkLocal: boolean;
        isMulticast: boolean;
        isReserved: boolean;
      };
    }
  | { ok: false; error: string };

export function parseIPv4(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let out = 0 >>> 0;
  for (const part of parts) {
    if (!/^[0-9]{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    out = ((out << 8) | n) >>> 0;
  }
  return out >>> 0;
}

export function intToIPv4(n: number): string {
  n = n >>> 0;
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

export function prefixToMask(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("Invalid prefix");
  if (prefix === 0) return 0 >>> 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(maskStr: string): number | null {
  const n = parseIPv4(maskStr);
  if (n === null) return null;
  // Must be contiguous ones followed by zeros
  // Check that n & (n + 1) === 0 after inverting leading ones? Better: n | (n - 1) should set all lower bits; valid masks are of form 111..1100..00
  // Compute prefix by counting ones from MSB until first zero; after that, all must be zeros.
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    const bit = (n >>> i) & 1;
    if (bit === 1) {
      if (count !== 32 - (i + 1)) {
        // ensure contiguous: once we saw a 0, can't see 1 again; but we haven't seen 0 yet here.
      }
      count++;
    } else {
      // ensure remaining bits are zero
      const lowerMask = (1 << i) - 1;
      if ((n & lowerMask) !== 0) return null;
      break;
    }
  }
  // Special case mask 0.0.0.0 -> prefix 0
  if (n === 0) return 0;
  // Validate again: recompute mask and compare
  const recomputed = prefixToMask(count);
  if (recomputed !== n) return null;
  return count;
}

export function parseMask(mask: string): { prefix: number; maskInt: number } | { error: string } {
  const raw = mask.trim();
  if (!raw) return { error: "Empty mask" };
  let m = raw;
  if (m.startsWith("/")) m = m.slice(1);
  if (/^\d{1,2}$/.test(m)) {
    const p = Number(m);
    if (p < 0 || p > 32) return { error: "Prefix length must be 0-32" };
    return { prefix: p, maskInt: prefixToMask(p) };
  }
  const pfx = maskToPrefix(raw);
  if (pfx === null) return { error: "Invalid dotted netmask (must be contiguous)" };
  return { prefix: pfx, maskInt: prefixToMask(pfx) };
}

function classify(ipInt: number): "A" | "B" | "C" | "D" | "E" {
  const first = (ipInt >>> 24) & 0xff;
  if (first <= 127) return "A";
  if (first <= 191) return "B";
  if (first <= 223) return "C";
  if (first <= 239) return "D";
  return "E";
}

function flags(ipInt: number) {
  // RFC1918 private ranges
  const isPrivateRFC1918 =
    (ipInt & 0xff000000) === 0x0a000000 || // 10.0.0.0/8
    (ipInt & 0xfff00000) === 0xac100000 || // 172.16.0.0/12
    (ipInt & 0xffff0000) === 0xc0a80000; // 192.168.0.0/16
  const isLoopback = (ipInt & 0xff000000) === 0x7f000000; // 127.0.0.0/8
  const isLinkLocal = (ipInt & 0xffff0000) === 0xa9fe0000; // 169.254.0.0/16
  const isMulticast = (ipInt & 0xf0000000) === 0xe0000000; // 224.0.0.0/4
  const isReserved = ipInt >>> 24 === 0 || ipInt >>> 24 === 255; // includes 0.0.0.0/8 and 255.0.0.0/8
  return { isPrivateRFC1918, isLoopback, isLinkLocal, isMulticast, isReserved };
}

export function computeIPv4Subnet(ip: string, mask: string): IPv4Info {
  const ipInt = parseIPv4(ip);
  if (ipInt === null) return { ok: false, error: "Invalid IPv4 address" };
  const maskRes = parseMask(mask);
  if ("error" in maskRes) return { ok: false, error: maskRes.error };
  const { prefix, maskInt } = maskRes;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;

  const total = 2 ** (32 - prefix);
  let usable: number;
  if (prefix === 32) usable = 1;
  else if (prefix === 31)
    usable = 2; // RFC 3021 point-to-point
  else usable = Math.max(total - 2, 0);

  const firstHostInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  const ipClass = classify(ipInt);
  const f = flags(ipInt);

  const maskStr = intToIPv4(maskInt);
  const wildcardStr = intToIPv4(~maskInt >>> 0);

  const networkStr = intToIPv4(networkInt);
  const broadcastStr = intToIPv4(broadcastInt);
  const firstHostStr = intToIPv4(firstHostInt);
  const lastHostStr = intToIPv4(lastHostInt);

  const range =
    prefix >= 31 ? `${networkStr} - ${broadcastStr}` : `${firstHostStr} - ${lastHostStr}`;

  return {
    ok: true,
    inputIp: ip,
    inputMask: mask,
    ip: intToIPv4(ipInt),
    prefix,
    mask: maskStr,
    wildcard: wildcardStr,
    network: networkStr,
    broadcast: broadcastStr,
    firstHost: firstHostStr,
    lastHost: lastHostStr,
    total,
    usable,
    range,
    class: ipClass,
    flags: f
  };
}
