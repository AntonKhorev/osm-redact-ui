import OsmAuth from './osm-auth'

export default class CurrentOsmAuthProvider {
	constructor(
		private readonly getCurrentOsmAuth: () => OsmAuth | undefined
	) {}

	get currentOsmAuth(): OsmAuth | undefined {
		return this.getCurrentOsmAuth()
	}
}
