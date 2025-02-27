import { makeElement, makeDiv, makeLabel } from '../../html'
import OsmClientIdProvider from './osm-client-id-provider'

export default class InputOsmClientIdProvider extends OsmClientIdProvider {
	private $clientIdInput=makeElement('input')()()

	constructor() {
		super()

		this.$clientIdInput.name='auth-client-id'
		this.$clientIdInput.required=true
	}

	getWidgets(): HTMLElement[] {
		return [
			makeDiv('input-group')(
				makeLabel()(
					`Application client id`, this.$clientIdInput
				)
			)
		]
	}

	get clientId(): string {
		return this.$clientIdInput.value.trim()
	}
}
