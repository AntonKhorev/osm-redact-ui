import { makeElement, makeDiv, makeLabel } from '../../../html'
import OsmUrlProvider from './osm-url-provider'

export default class InputOsmUrlProvider extends OsmUrlProvider {
	private $webRootInput=makeElement('input')()()
	private $apiRootInput=makeElement('input')()()

	constructor() {
		super()

		this.$webRootInput.name='osm-web-root'
		this.$webRootInput.required=true

		this.$apiRootInput.name='osm-api-root'
	}

	getWidgets(): HTMLElement[] {
		return [
			makeDiv('input-group')(
				makeLabel()(
					`OSM web URL`, this.$webRootInput
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`OSM API URL (if different from web URL)`, this.$apiRootInput
				)
			)
		]
	}

	get webRoot(): string {
		return this.$webRootInput.value.trim()
	}

	get apiRoot(): string {
		const ownValue=this.$apiRootInput.value.trim()
		return ownValue || this.webRoot
	}
}
