// Cron utilities ported from the single-file HTML sample, adapted for TypeScript
// SvelteKit 2 / Svelte 5 project

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export const DOW_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const;

export function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export function uniqSorted(arr: number[]): number[] {
  return [...new Set(arr)].sort((a, b) => a - b);
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function formatList<T>(nums: T[], mapFn?: (n: T) => string): string {
  const items = nums.map((n) => (mapFn ? mapFn(n) : String(n)));
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return items[0]! + ' and ' + items[1]!;
  return items.slice(0, -1).join(', ') + ', and ' + items.slice(-1);
}

export function condense(values: number[], min: number, max: number): string {
  const all = range(min, max);
  values = uniqSorted(values);
  if (arraysEqual(values, all)) return '*';
  let run = values.length > 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1]! + 1) {
      run = false;
      break;
    }
  }
  if (run && values.length >= 2) return values[0]! + '-' + values[values.length - 1]!;
  return values.join(',');
}

export function allowedCharsOnly(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const isDigit = ch >= '0' && ch <= '9';
    if (!(isDigit || ch === ',' || ch === '-')) return false;
  }
  return true;
}

export type ParsedField = { any: true; values: number[]; raw: '*'} | { any: false; values: number[]; raw: string };
export type ParseFieldError = { error: string };

export function parseField(text: string, min: number, max: number, fieldName: string): ParsedField | ParseFieldError {
  if (text === '*') return { any: true, values: range(min, max), raw: '*' };
  if (!allowedCharsOnly(text)) {
    return { error: `${fieldName}: only digits, comma, and hyphen allowed (no steps, names, or macros).` };
  }
  const parts = text.split(',');
  let values: number[] = [];
  for (const part of parts) {
    if (part.length === 0) return { error: `${fieldName}: empty list element.` };
    if (part.indexOf('-') !== -1) {
      const bits = part.split('-');
      if (bits.length !== 2) return { error: `${fieldName}: invalid range syntax.` };
      const a = Number(bits[0]);
      const b = Number(bits[1]);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return { error: `${fieldName}: non-integer in range.` };
      if (a > b) return { error: `${fieldName}: range must be low-high.` };
      if (a < min || b > max) return { error: `${fieldName}: range out of bounds (${min}-${max}).` };
      for (let v = a; v <= b; v++) values.push(v);
    } else {
      const n = Number(part);
      if (!Number.isInteger(n)) return { error: `${fieldName}: non-integer value.` };
      if (n < min || n > max) return { error: `${fieldName}: value ${n} out of bounds (${min}-${max}).` };
      values.push(n);
    }
  }
  values = uniqSorted(values);
  return { any: false, values, raw: text };
}

export type FieldState = { any: boolean; values: number[] };
export type Fields = {
  minute: FieldState;
  hour: FieldState;
  dom: FieldState;
  month: FieldState;
  dow: FieldState;
};

export function humanize(fields: Fields): string {
  const m = fields.minute, h = fields.hour, dom = fields.dom, mon = fields.month, dow = fields.dow;
  let time = '';
  if (m.any && h.any) {
    time = 'Every minute';
  } else if (!m.any && h.any) {
    time = `At minute${m.values.length > 1 ? 's' : ''} ${formatList(m.values)} past every hour`;
  } else if (m.any && !h.any) {
    time = `Every minute of ${h.values.length > 1 ? 'hours' : 'hour'} ${formatList(h.values)}`;
  } else {
    time = `At ${formatList(m.values)} minute${m.values.length > 1 ? 's' : ''} past ${h.values.length > 1 ? 'hours' : 'hour'} ${formatList(h.values)}`;
  }

  const months = mon.any ? 'every month' : 'in ' + formatList(mon.values, (n) => MONTH_NAMES[n - 1] + ` (${n})`);
  let datePart = '';
  if (dom.any && dow.any) {
    datePart = 'every day';
  } else if (!dom.any && dow.any) {
    datePart = `on day${dom.values.length > 1 ? 's' : ''} ${formatList(dom.values)} of ${months}`;
  } else if (dom.any && !dow.any) {
    datePart = `on ${formatList(dow.values, (n) => DOW_NAMES[n] + ` (${n})`)} of ${months}`;
  } else {
    datePart = `on day${dom.values.length > 1 ? 's' : ''} ${formatList(dom.values)} of ${months} <span class="muted">(or)</span> on ${formatList(dow.values, (n) => DOW_NAMES[n] + ` (${n})`)} of ${months}`;
  }

  return `${time}, ${datePart}.`;
}

export function splitFields(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inSpace = true;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const isWS = code <= 32;
    if (isWS) {
      if (!inSpace) {
        out.push(cur);
        cur = '';
        inSpace = true;
      }
    } else {
      cur += s[i];
      inSpace = false;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export type ParseCronResult =
  | { empty: true }
  | { error: string }
  | { ok: true; fields: { minute: ParsedField; hour: ParsedField; dom: ParsedField; month: ParsedField; dow: ParsedField }; human: string };

export function parseCronText(text: string): ParseCronResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { empty: true } as const;
  }
  if (trimmed[0] === '@') {
    return { error: 'POSIX does not define @macros such as @reboot or @daily.' };
  }
  if (trimmed.indexOf('/') !== -1) {
    return { error: 'Step syntax like */5 or 1-10/2 is not POSIX.' };
  }
  const parts = splitFields(trimmed);
  if (parts.length !== 5) {
    return { error: `Expected exactly 5 fields, found ${parts.length}.` };
  }
  const minute = parts[0]!;
  const hour = parts[1]!;
  const dom = parts[2]!;
  const month = parts[3]!;
  const dow = parts[4]!;

  const fMinute = parseField(minute, 0, 59, 'Minute');
  if ('error' in fMinute) return { error: fMinute.error };
  const fHour = parseField(hour, 0, 23, 'Hour');
  if ('error' in fHour) return { error: fHour.error };
  const fDom = parseField(dom, 1, 31, 'Day of month');
  if ('error' in fDom) return { error: fDom.error };
  const fMonth = parseField(month, 1, 12, 'Month');
  if ('error' in fMonth) return { error: fMonth.error };
  const fDow = parseField(dow, 0, 6, 'Day of week');
  if ('error' in fDow) return { error: fDow.error };

  const fields = { minute: fMinute, hour: fHour, dom: fDom, month: fMonth, dow: fDow } as const;
  const human = humanize({
    minute: { any: fMinute.any, values: fMinute.values },
    hour: { any: fHour.any, values: fHour.values },
    dom: { any: fDom.any, values: fDom.values },
    month: { any: fMonth.any, values: fMonth.values },
    dow: { any: fDow.any, values: fDow.values }
  });
  return { ok: true, fields, human };
}
