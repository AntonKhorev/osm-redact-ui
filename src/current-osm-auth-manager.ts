import CurrentOsmAuthProvider from './current-osm-auth-provider'
import { OsmAuthData } from './osm-auth-data'
import OsmAuth from './osm-auth'

export default class CurrentOsmAuthManager {
	private _data?: OsmAuthData
	private _auth?: OsmAuth

	readonly provider=new CurrentOsmAuthProvider(
		() => this._auth
	)

	get data(): OsmAuthData | undefined {
		return this._data
	}

	set data(d: OsmAuthData | undefined) {
		this._data=d
		if (d) {
			this._auth=new OsmAuth(d)
		} else {
			this._auth=undefined
		}
	}
}
