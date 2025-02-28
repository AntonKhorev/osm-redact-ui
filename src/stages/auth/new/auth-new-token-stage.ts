import AuthNewStage from './auth-new-stage'
import OsmUrlProvider from './osm-url-provider'
import { OsmAuthOauthData } from '../../../osm-auth-data'
import { makeElement, makeDiv, makeLabel } from '../../../html'

export default class AuthNewTokenStage extends AuthNewStage {
	private $tokenInput=makeElement('input')()()

	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider
	) {
		super(title,type,osmUrlProvider)

		this.$tokenInput.name='auth-token'
		this.$tokenInput.required=true
	}

	protected async getOauthData(abortSignal: AbortSignal): Promise<OsmAuthOauthData> {
		const token=this.$tokenInput.value.trim()
		return {token}
	}

	protected renderWidgetsInsideForm(): HTMLElement[] {
		return [
			makeDiv('input-group')(
				makeLabel()(
					`Auth token`, this.$tokenInput
				)
			)
		]
	}
}
