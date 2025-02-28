import RunControl from '../../../run-control'
import OsmUrlProvider from './osm-url-provider'
import { OsmAuthData, OsmAuthOauthData, convertOsmUserDetailsJsonToOsmAuthUserData } from '../../../osm-auth-data'
import OsmApi from '../../../osm-api'
import { makeElement, makeDiv } from '../../../html'
import { bubbleCustomEvent } from '../../../events'

export default abstract class AuthNewStage {
	protected readonly runControl=new RunControl

	protected readonly $runButton=makeElement('button')()(`Authorize`)
	protected readonly $form=makeElement('form')('formatted')()
	readonly $section=makeElement('section')()()

	constructor(
		readonly title: string,
		readonly type: string,
		private readonly osmUrlProvider: OsmUrlProvider
	) {}

	protected get osmWebRoot(): string {
		return this.osmUrlProvider.webRoot
	}

	protected get osmApiRoot(): string {
		return this.osmUrlProvider.apiRoot
	}

	start() {
		this.$form.append(
			...this.osmUrlProvider.getWidgets(),
			...this.renderWidgetsInsideForm(),
			makeDiv('input-group')(
				this.$runButton
			)
		)

		this.$section.append(
			makeElement('h3')()(this.title),
			this.$form,
			this.runControl.$widget,
			...this.renderWidgetsAfterForm()
		)
	}

	protected renderWidgetsInsideForm(): HTMLElement[] {
		return []
	}

	protected renderWidgetsAfterForm(): HTMLElement[] {
		return []
	}

	protected async passToken(abortSignal: AbortSignal, oauth?: OsmAuthOauthData): Promise<void> {
		const osmAuthData: OsmAuthData = {
			webRoot: this.osmWebRoot,
			apiRoot: this.osmApiRoot,
		}
		if (oauth) {
			const osmApi=new OsmApi(osmAuthData.apiRoot,oauth.token,this.runControl.logger,abortSignal)
			const response=await osmApi.get(`user/details.json`)
			if (!response.ok) throw new TypeError(`failed to fetch user details`)
			const json=await response.json()
			osmAuthData.user=convertOsmUserDetailsJsonToOsmAuthUserData(json,oauth)
		}
		bubbleCustomEvent(this.$section,'osmRedactUi:newAuth',osmAuthData)
	}
}
