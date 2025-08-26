// Strict POSIX cron utilities (5 fields: min hour dom month dow)
// Allowed per field: '*', single integer, comma list, or numeric range low-high. No steps, no names, no macros.
// Ranges: minute 0-59; hour 0-23; dom 1-31; month 1-12; dow 0-6 (0=Sun).

export type FieldSpec = {
	any: boolean;
	values: number[]; // normalized, sorted unique, within min..max inclusive
};

export type CronFields = {
	minute: FieldSpec;
	hour: FieldSpec;
	dom: FieldSpec; // day of month
	month: FieldSpec;
	dow: FieldSpec; // day of week (0=Sun)
};

export type ParseResult =
	| {
			ok: true;
			fields: CronFields;
			cron: string;
			human: string;
	  }
	| {
			ok: false;
			error: string;
	  };

export const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
] as const;
export const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function range(a: number, b: number): number[] {
	const out: number[] = [];
	for (let i = a; i <= b; i++) out.push(i);
	return out;
}
function uniqSorted(arr: number[]): number[] {
	return [...new Set(arr)].sort((a, b) => a - b);
}
function arraysEqual(a: number[], b: number[]): boolean {
	return a.length === b.length && a.every((v, i) => v === b[i]);
}

export const LIMITS = {
	minute: { min: 0, max: 59, name: 'minute' },
	hour: { min: 0, max: 23, name: 'hour' },
	dom: { min: 1, max: 31, name: 'day of month' },
	month: { min: 1, max: 12, name: 'month' },
	dow: { min: 0, max: 6, name: 'day of week' } // 0=Sun, 6=Sat; 7 not allowed
} as const;

function allowedCharsOnly(text: string): boolean {
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		const isDigit = ch >= '0' && ch <= '9';
		if (!(isDigit || ch === ',' || ch === '-')) return false;
	}
	return true;
}

export function parseField(
	text: string,
	min: number,
	max: number,
	label: string
): FieldSpec | { error: string } {
	text = text.trim();
	if (text === '*') return { any: true, values: range(min, max) };
	if (text.length === 0) return { error: `${label}: empty field.` };
	if (!allowedCharsOnly(text))
		return {
			error: `${label}: only digits, comma, and hyphen allowed (no steps, names, or macros).`
		};
	const parts = text.split(',');
	let values: number[] = [];
	for (const part of parts) {
		if (part.length === 0) return { error: `${label}: empty list element.` };
		if (part.includes('-')) {
			const [aStr, bStr, ...rest] = part.split('-');
			if (rest.length) return { error: `${label}: invalid range syntax.` };
			const a = Number(aStr);
			const b = Number(bStr);
			if (!Number.isInteger(a) || !Number.isInteger(b))
				return { error: `${label}: non-integer in range.` };
			if (a > b) return { error: `${label}: range must be low-high.` };
			if (a < min || b > max) return { error: `${label}: range out of bounds (${min}-${max}).` };
			for (let v = a; v <= b; v++) values.push(v);
		} else {
			const n = Number(part);
			if (!Number.isInteger(n)) return { error: `${label}: non-integer value.` };
			if (n < min || n > max)
				return { error: `${label}: value ${n} out of bounds (${min}-${max}).` };
			values.push(n);
		}
	}
	values = uniqSorted(values);
	return { any: false, values };
}

export function parseCron(cron: string): ParseResult {
	const trimmed = cron.trim().replace(/\s+/g, ' ');
	const parts = trimmed.split(' ');
	if (parts.length !== 5)
		return {
			ok: false,
			error: 'Cron must have exactly 5 fields: minute hour day-of-month month day-of-week.'
		};
	const [m, h, dom, mon, dow] = parts;
	const fMinute = parseField(m, LIMITS.minute.min, LIMITS.minute.max, 'Minute');
	if ('error' in fMinute) return { ok: false, error: fMinute.error };
	const fHour = parseField(h, LIMITS.hour.min, LIMITS.hour.max, 'Hour');
	if ('error' in fHour) return { ok: false, error: fHour.error };
	const fDom = parseField(dom, LIMITS.dom.min, LIMITS.dom.max, 'Day of month');
	if ('error' in fDom) return { ok: false, error: fDom.error };
	const fMon = parseField(mon, LIMITS.month.min, LIMITS.month.max, 'Month');
	if ('error' in fMon) return { ok: false, error: fMon.error };
	const fDow = parseField(dow, LIMITS.dow.min, LIMITS.dow.max, 'Day of week');
	if ('error' in fDow) return { ok: false, error: fDow.error };
	const fields: CronFields = {
		minute: fMinute,
		hour: fHour,
		dom: fDom,
		month: fMon,
		dow: fDow
	} as CronFields;
	const cronNorm = buildCron(fields);
	return { ok: true, fields, cron: cronNorm, human: humanize(fields) };
}

function condense(values: number[], min: number, max: number): string {
	const all = range(min, max);
	values = uniqSorted(values);
	if (arraysEqual(values, all)) return '*';
	// if they form a contiguous range, use a-b, else comma list
	let contiguous = values.length > 0;
	for (let i = 1; i < values.length; i++) {
		if (values[i] !== values[i - 1] + 1) {
			contiguous = false;
			break;
		}
	}
	if (contiguous && values.length >= 2) return `${values[0]}-${values[values.length - 1]}`;
	return values.join(',');
}

export function buildCron(fields: CronFields): string {
	return [
		condense(fields.minute.values, LIMITS.minute.min, LIMITS.minute.max),
		condense(fields.hour.values, LIMITS.hour.min, LIMITS.hour.max),
		condense(fields.dom.values, LIMITS.dom.min, LIMITS.dom.max),
		condense(fields.month.values, LIMITS.month.min, LIMITS.month.max),
		condense(fields.dow.values, LIMITS.dow.min, LIMITS.dow.max)
	].join(' ');
}

export function emptyFields(): CronFields {
	return {
		minute: { any: true, values: range(LIMITS.minute.min, LIMITS.minute.max) },
		hour: { any: true, values: range(LIMITS.hour.min, LIMITS.hour.max) },
		dom: { any: true, values: range(LIMITS.dom.min, LIMITS.dom.max) },
		month: { any: true, values: range(LIMITS.month.min, LIMITS.month.max) },
		dow: { any: true, values: range(LIMITS.dow.min, LIMITS.dow.max) }
	};
}

export function humanize(fields: CronFields): string {
	const m = fields.minute,
		h = fields.hour,
		dom = fields.dom,
		mon = fields.month,
		dow = fields.dow;
	let time: string;
	if (m.any && h.any) {
		time = 'Every minute';
	} else if (!m.any && h.any) {
		time = `At minute${m.values.length > 1 ? 's' : ''} ${formatList(m.values)} past every hour`;
	} else if (m.any && !h.any) {
		time = `Every minute of ${h.values.length > 1 ? 'hours' : 'hour'} ${formatList(h.values)}`;
	} else {
		time = `At ${formatList(m.values)} minute${m.values.length > 1 ? 's' : ''} past ${h.values.length > 1 ? 'hours' : 'hour'} ${formatList(h.values)}`;
	}

	const months = mon.any
		? 'every month'
		: 'in ' + formatList(mon.values, (n) => `${MONTH_NAMES[n - 1]} (${n})`);

	let datePart: string;
	if (dom.any && dow.any) {
		datePart = 'every day';
	} else if (!dom.any && dow.any) {
		datePart = `on day${dom.values.length > 1 ? 's' : ''} ${formatList(dom.values)} of ${months}`;
	} else if (dom.any && !dow.any) {
		datePart = `on ${formatList(dow.values, (n) => `${DOW_NAMES[n]} (${n})`)} of ${months}`;
	} else {
		datePart = `on day${dom.values.length > 1 ? 's' : ''} ${formatList(dom.values)} of ${months} (or) on ${formatList(dow.values, (n) => `${DOW_NAMES[n]} (${n})`)} of ${months}`;
	}

	return `${time}, ${datePart}.`;
}

function formatList(nums: number[], mapFn?: (n: number) => string): string {
	const items = nums.map((n) => (mapFn ? mapFn(n) : String(n)));
	if (items.length === 0) return '';
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} and ${items[1]}`;
	return `${items.slice(0, -1).join(', ')}, and ${items.slice(-1)}`;
}

// Builder helpers
export function toggleValue(spec: FieldSpec, v: number, min: number, max: number): FieldSpec {
	// when toggling, leave 'any' mode and toggle presence of v
	let values = spec.any ? [] : [...spec.values];
	if (values.includes(v)) values = values.filter((x) => x !== v);
	else values.push(v);
	values = uniqSorted(values.filter((x) => x >= min && x <= max));
	const full = max - min + 1;
	if (values.length === 0) {
		// empty selection -> reset to any
		return { any: true, values: range(min, max) };
	}
	if (values.length === full) {
		return { any: true, values: range(min, max) };
	}
	return { any: false, values };
}

export function setEvery(spec: FieldSpec, min: number, max: number): FieldSpec {
	return { any: true, values: range(min, max) };
}
