import CurrentOsmAuthProvider from './current-osm-auth-provider'
import OsmAuth from './osm-auth'

export default class CurrentOsmAuthManager {
	currentOsmAuth?: OsmAuth
	readonly provider=new CurrentOsmAuthProvider(
		() => this.currentOsmAuth
	)
}
