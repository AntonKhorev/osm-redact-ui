export default class PrefixedStorage {
	constructor(
		private readonly storage: Storage,
		private readonly prefix: string
	) {}

	getItem(k: string): string | null {
		return this.storage.getItem(this.prefix+k)
	}

	setItem(k: string, v: string): void {
		this.storage.setItem(this.prefix+k,v)
	}

	removeItem(k: string): void {
		this.storage.removeItem(this.prefix+k)
	}

	getKeys(): string[] { // don't return iterator because may want to modify stuff while iterating
		const result:string[]=[]
		for (let i=0;i<this.storage.length;i++) {
			const k=this.storage.key(i)
			if (!k?.startsWith(this.prefix)) continue
			result.push(k.substring(this.prefix.length))
		}
		return result
	}

	clear(): void {
		for (const k of this.getKeys()) {
			this.removeItem(k)
		}
	}
}
