import AuthGrantStage from './auth-grant-stage'
import ConnectionShowStage from './connection-show-stage'
import AuthLanding from '../auth-landing'
import PopupWindowOpener from '../popup-window-opener'
import AbortManager from '../abort-manager'
import AuthFlow from '../auth-flow'
import { makeElement, makeDiv, makeLabel } from '../html'

export default class AuthAutoGrantStage extends AuthGrantStage {
	private $authClientIdInput=makeElement('input')()()

	constructor(
		abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener,
		private authLanding: AuthLanding
	) {
		super(abortManager,connectionShowStage,popupWindowOpener)

		this.$authClientIdInput.name='auth-client-id'
		this.$authClientIdInput.required=true
	}

	protected renderHeading(): HTMLHeadingElement {
		return makeElement('h2')()(`Authorize`)
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

	protected getAuthFlow(): Promise<AuthFlow> {
		return this.authFlowFactory.makeAuthFlow(
			this.$authClientIdInput.value.trim(),
			this.authLanding.url
		)
	}

	protected getAuthCode(abortSignal: AbortSignal): Promise<string> {
		return this.authLanding.getCode(abortSignal)
	}

	protected cleanupAfterGetCode(abortSignal: AbortSignal): void {
		this.authLanding.cleanupAfterGetCode(abortSignal)
	}
}
