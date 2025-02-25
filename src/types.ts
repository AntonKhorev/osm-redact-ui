export function isObject(value: unknown): value is object {
	return !!(value && typeof value == 'object')
}

export function isArrayOfStrings(value: unknown): value is string[] {
	return isArray(value) && value.every(item => typeof item == 'string')
}
export function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value)
}

export function toPositiveInteger(s: unknown): number {
	if (typeof s != 'string') throw new TypeError(`received invalid number`)
	const n=parseInt(s,10)
	if (!(n>0)) throw new TypeError(`received invalid number`)
	return n
}
