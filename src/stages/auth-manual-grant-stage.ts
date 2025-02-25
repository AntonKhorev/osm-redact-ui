import AuthGrantStage from './auth-grant-stage'
import ConnectionShowStage from './connection-show-stage'
import PopupWindowOpener from '../popup-window-opener'
import AbortManager from '../abort-manager'
import AuthFlow from '../auth-flow'
import { makeElement, makeDiv, makeLabel } from '../html'

export default class AuthManualGrantStage extends AuthGrantStage {
	private $authClientIdInput=makeElement('input')()()
	private $authCodeForm=makeElement('form')()()
	private $authCodeInput=makeElement('input')()()
	private $authCodeButton=makeElement('button')()(`Accept code`)

	constructor(
		abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener
	) {
		super(abortManager,connectionShowStage,popupWindowOpener)

		this.$authClientIdInput.name='auth-client-id'
		this.$authClientIdInput.required=true

		this.$authCodeInput.name='auth-code'

		this.$authCodeForm.hidden=true
	}

	protected renderHeading(): HTMLHeadingElement {
		return makeElement('h2')()(`Authorize by copying a code`)
	}

	protected renderPreRunControlWidgets(): HTMLElement[] {
		return [
			makeDiv('input-group')(
				makeLabel()(
					`Application client id`, this.$authClientIdInput
				)
			)
		]
	}

	protected renderPostRunControlWidgets(): HTMLElement[] {
		this.$authCodeForm.append(
			makeDiv('input-group')(
				makeLabel()(
					`Authorization code`, this.$authCodeInput
				)
			),
			makeDiv('input-group')(
				this.$authCodeButton
			)
		)
		return [
			this.$authCodeForm
		]
	}

	protected getAuthFlow(): Promise<AuthFlow> {
		return this.authFlowFactory.makeAuthFlow(
			this.$authClientIdInput.value.trim(),
			'urn:ietf:wg:oauth:2.0:oob'
		)
	}

	protected async getAuthCode(abortSignal: AbortSignal): Promise<string> {
		this.$authCodeForm.hidden=false
		return new Promise((resolve,reject)=>{
			this.$authCodeForm.onsubmit=(ev)=>{
				ev.preventDefault()
				resolve(this.$authCodeInput.value.trim())
			}
			abortSignal.onabort=reject
		})
	}

	protected cleanupAfterGetCode(abortSignal: AbortSignal): void {
		this.$authCodeForm.hidden=true
		this.$authCodeForm.onsubmit=null
		this.$authCodeInput.value=''
		abortSignal.onabort=null
	}
}
