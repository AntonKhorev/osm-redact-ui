import RunControl from '../../../run-control'
import RunLogger from '../../../run-logger'
import OsmUrlProvider from './osm-url-provider'
import { OsmAuthData, OsmAuthOauthData, convertOsmUserDetailsJsonToOsmAuthUserData } from '../../../osm-auth-data'
import OsmApi from '../../../osm-api'
import { makeElement } from '../../../html'
import { bubbleCustomEvent } from '../../../events'

export default abstract class AuthNewStage {
	protected readonly runControl=new RunControl(
		`Authorize`,
		`Abort authorization`
	)
	protected readonly runLogger=new RunLogger

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
			...this.renderPreRunControlWidgets(),
			this.runControl.$widget,
		)

		this.$section.append(
			makeElement('h3')()(this.title),
			this.$form,
			this.runLogger.$widget,
			...this.renderPostRunControlWidgets()
		)
	}

	protected renderPreRunControlWidgets(): HTMLElement[] {
		return []
	}

	protected renderPostRunControlWidgets(): HTMLElement[] {
		return []
	}

	protected async passToken(abortSignal: AbortSignal, oauth?: OsmAuthOauthData): Promise<void> {
		const osmAuthData: OsmAuthData = {
			webRoot: this.osmWebRoot,
			apiRoot: this.osmApiRoot,
		}
		if (oauth) {
			const osmApi=new OsmApi(osmAuthData.apiRoot,oauth.token,this.runLogger,abortSignal)
			const response=await osmApi.get(`user/details.json`)
			if (!response.ok) throw new TypeError(`failed to fetch user details`)
			const json=await response.json()
			osmAuthData.user=convertOsmUserDetailsJsonToOsmAuthUserData(json,oauth)
		}
		bubbleCustomEvent(this.$section,'osmRedactUi:newAuth',osmAuthData)
	}
}
