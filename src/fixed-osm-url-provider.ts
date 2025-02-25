import OsmUrlProvider from './osm-url-provider'

export default class FixedOsmUrlProvider extends OsmUrlProvider {
	constructor(
		readonly webRoot: string,
		readonly apiRoot=webRoot
	) {
		super()
	}

	getWidgets(): HTMLElement[] {
		return []
	}
}
