import OsmClientIdProvider from './osm-client-id-provider'

export default class FixedOsmClientIdProvider extends OsmClientIdProvider {
	constructor(
		readonly clientId: string
	) {
		super()
	}

	getWidgets(): HTMLElement[] {
		return []
	}
}
