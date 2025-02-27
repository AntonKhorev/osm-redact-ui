import PrefixedStorage from './prefixed-storage'

export default class PrefixedArrayStorage {
	constructor(
		private readonly storage: PrefixedStorage,
		private readonly arrayName: string
	) {}

	getItem(i: number): string | null {
		return this.storage.getItem(this.getKey(i))
	}

	setItem(i: number, v: string): void {
		this.storage.setItem(this.getKey(i),v)
	}

	appendItem(v: string): void {
		const maxIndex=Math.max(-1,...this.getIndexes())
		const i=Math.floor(maxIndex+1)
		this.storage.setItem(this.getKey(i),v)
	}

	removeItem(i: number): void {
		this.storage.removeItem(this.getKey(i))
	}

	getIndexes(): number[] {
		const result:number[]=[]
		const keyRegExp=new RegExp(`^${this.arrayName}\\[(\\d+)\\]$`)
		for (const key of this.storage.getKeys()) {
			let match:RegExpMatchArray|null
			if (match=key.match(keyRegExp)) {
				const [_,indexString]=match
				result.push(Number(indexString))
			}
		}
		result.sort((a,b)=>a-b)
		return result
	}

	// TODO: compactify

	private getKey(i: number): string {
		return `${this.arrayName}[${i}]`
	}
}
