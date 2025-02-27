import PrefixedArrayStorage from './prefixed-array-storage'
import { OsmAuthData, isOsmAuthData, isOsmAuthDataWithSameToken } from './osm-auth-data'

export default class AuthStorage {
	constructor(
		private readonly storage: PrefixedArrayStorage
	) {}

	add(osmAuthData: OsmAuthData): void {
		for (const index of this.storage.getIndexes()) {
			const value=this.storage.getItem(index)

			let json: unknown
			try {
				if (value!=null) json=JSON.parse(value)
			} catch {}

			if (!isOsmAuthData(json) || isOsmAuthDataWithSameToken(osmAuthData,json)) {
				this.storage.removeItem(index)
			}
		}

		this.storage.appendItem(JSON.stringify(osmAuthData))
	}

	*list(): Iterable<OsmAuthData> {
		for (const index of this.storage.getIndexes()) {
			const value=this.storage.getItem(index)

			let json: unknown
			try {
				if (value!=null) json=JSON.parse(value)
			} catch {}

			if (isOsmAuthData(json)) yield json
		}
	}
}
