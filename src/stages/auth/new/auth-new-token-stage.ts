import AuthNewStage from './auth-new-stage'
import OsmUrlProvider from './osm-url-provider'
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

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			const abortSignal=this.runControl.enter(this.$runButton)
			try {
				const token=this.$tokenInput.value.trim()
				await this.passToken(abortSignal,{token})
			} catch (ex) {
				this.runControl.handleException(ex)
			}
			this.runControl.exit()
		}
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
