import AuthNewGrantStage from './auth-new-grant-stage'
import OsmUrlProvider from './osm-url-provider'
import OsmClientIdProvider from './osm-client-id-provider'
import PopupWindowOpener from '../../../popup-window-opener'
import AuthFlow from '../../../auth-flow'
import { makeElement, makeDiv, makeLabel } from '../../../html'

export default class AuthNewManualGrantStage extends AuthNewGrantStage {
	private $authCodeForm=makeElement('form')('formatted')()
	private $authCodeInput=makeElement('input')()()
	private $authCodeButton=makeElement('button')()(`Accept code`)

	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider, osmClientIdProvider: OsmClientIdProvider,
		popupWindowOpener: PopupWindowOpener
	) {
		super(title,type,osmUrlProvider,osmClientIdProvider,popupWindowOpener)

		this.$authCodeInput.name='auth-code'
		this.$authCodeForm.hidden=true
	}

	protected renderWidgetsAfterForm(): HTMLElement[] {
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

	protected getAuthFlow(clientId: string): Promise<AuthFlow> {
		return this.authFlowFactory.makeAuthFlow(clientId,'urn:ietf:wg:oauth:2.0:oob')
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
