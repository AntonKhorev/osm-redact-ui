import PrefixedStorage from './prefixed-storage'
import PrefixedArrayStorage from './prefixed-array-storage'
import { OsmAuthData, isOsmAuthData, isOsmAuthDataWithSameToken } from './osm-auth-data'

export default class AuthStorage {
	private readonly authArrayStorage: PrefixedArrayStorage

	constructor(
		private readonly storage: PrefixedStorage
	) {
		this.authArrayStorage=new PrefixedArrayStorage(storage,'osmAuths')
	}

	addData(osmAuthData: OsmAuthData): void {
		for (const index of this.authArrayStorage.getIndexes()) {
			const value=this.authArrayStorage.getItem(index)

			let json: unknown
			try {
				if (value!=null) json=JSON.parse(value)
			} catch {}

			if (!isOsmAuthData(json) || isOsmAuthDataWithSameToken(osmAuthData,json)) {
				this.authArrayStorage.removeItem(index)
			}
		}

		const value=JSON.stringify(osmAuthData)
		this.authArrayStorage.appendItem(value)
	}

	removeDataPossiblyRemovingCurrentData(osmAuthData: OsmAuthData): boolean {
		for (const index of this.authArrayStorage.getIndexes()) {
			const value=this.authArrayStorage.getItem(index)

			let json: unknown
			try {
				if (value!=null) json=JSON.parse(value)
			} catch {}

			if (!isOsmAuthData(json) || isOsmAuthDataWithSameToken(osmAuthData,json)) {
				this.authArrayStorage.removeItem(index)
			}
		}

		const currentData=this.currentData
		if (currentData && isOsmAuthDataWithSameToken(osmAuthData,currentData)) {
			this.currentData=undefined
			return true
		} else {
			return false
		}
	}

	get currentData(): OsmAuthData | undefined {
		const value=this.storage.getItem('currentOsmAuth')

		let json: unknown
		try {
			if (value!=null) json=JSON.parse(value)
		} catch {}
		
		if (isOsmAuthData(json)) return json
	}

	set currentData(currentData: OsmAuthData | undefined) {
		if (currentData) {
			const value=JSON.stringify(currentData)
			this.storage.setItem('currentOsmAuth',value)
		} else {
			this.storage.removeItem('currentOsmAuth')
		}
	}

	*listData(): Iterable<OsmAuthData> {
		for (const index of this.authArrayStorage.getIndexes()) {
			const value=this.authArrayStorage.getItem(index)

			let json: unknown
			try {
				if (value!=null) json=JSON.parse(value)
			} catch {}

			if (isOsmAuthData(json)) yield json
		}
	}
}
