import CurrentOsmAuthProvider from './current-osm-auth-provider'
import AuthStorage from './auth-storage'
import { OsmAuthData } from './osm-auth-data'
import OsmAuth from './osm-auth'

export default class OsmAuthManager {
	private currentAuthMemoized=false
	private currentAuth?: OsmAuth

	constructor(
		private readonly storage: AuthStorage
	) {}

	readonly currentProvider=new CurrentOsmAuthProvider(
		() => {
			if (this.currentAuthMemoized) {
				return this.currentAuth
			} else {
				const currentData=this.currentData
				if (currentData) {
					this.currentAuth=new OsmAuth(currentData)
				} else {
					this.currentAuth=undefined
				}
				this.currentAuthMemoized=true
				return this.currentAuth
			}
		}
	)

	addData(osmAuthData: OsmAuthData): void {
		this.storage.addData(osmAuthData)
	}

	removeDataPossiblyRemovingCurrentData(osmAuthData: OsmAuthData): boolean {
		if (this.storage.removeDataPossiblyRemovingCurrentData(osmAuthData)) {
			this.currentAuthMemoized=false
			this.currentAuth=undefined
			return true
		} else {
			return false
		}
	}

	get currentData(): OsmAuthData | undefined {
		return this.storage.currentData
	}

	set currentData(currentData: OsmAuthData | undefined) {
		this.currentAuthMemoized=false
		this.currentAuth=undefined
		this.storage.currentData=currentData
	}

	*listData(): Iterable<OsmAuthData> {
		yield *this.storage.listData()
	}
}
