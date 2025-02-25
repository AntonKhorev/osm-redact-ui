import AuthStage from './auth-stage'
import ConnectionShowStage from './connection-show-stage'
import AbortManager from './abort-manager'
import { makeElement, makeDiv, makeLabel } from './html'

export default class AuthTokenStage extends AuthStage {
	private $tokenInput=makeElement('input')()()

	constructor(abortManager: AbortManager, connectionShowStage: ConnectionShowStage) {
		super()

		abortManager.addRunControl(this.runControl)

		this.$tokenInput.name='auth-token'
		this.$tokenInput.required=true

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runControl.logger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const token=this.$tokenInput.value.trim()
				await this.passToken(connectionShowStage,abortSignal,token)
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	protected renderHeading(): HTMLHeadingElement {
		return makeElement('h2')()(`Authorize by entering an existing token`)
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
