import AuthStage from './auth-stage'
import OsmUrlProvider from './osm-url-provider'
import AbortManager from '../../abort-manager'
import { makeElement, makeDiv, makeLabel } from '../../html'

export default class AuthTokenStage extends AuthStage {
	private $tokenInput=makeElement('input')()()

	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider, abortManager: AbortManager
	) {
		super(title,type,osmUrlProvider)

		abortManager.addRunControl(this.runControl)

		this.$tokenInput.name='auth-token'
		this.$tokenInput.required=true

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runLogger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const token=this.$tokenInput.value.trim()
				await this.passToken(abortSignal,token)
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	protected renderPreRunControlWidgets(): HTMLElement[] {
		return [
			makeDiv('input-group')(
				makeLabel()(
					`Auth token`, this.$tokenInput
				)
			)
		]
	}
}
