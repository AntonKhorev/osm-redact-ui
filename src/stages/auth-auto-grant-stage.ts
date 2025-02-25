import AuthGrantStage from './auth-grant-stage'
import ConnectionShowStage from './connection-show-stage'
import AuthLanding from '../auth-landing'
import PopupWindowOpener from '../popup-window-opener'
import AbortManager from '../abort-manager'
import AuthFlow from '../auth-flow'
import { makeElement } from '../html'

export default class AuthAutoGrantStage extends AuthGrantStage {
	constructor(
		abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener,
		private authLanding: AuthLanding
	) {
		super(abortManager,connectionShowStage,popupWindowOpener)
	}

	protected renderHeading(): HTMLHeadingElement {
		return makeElement('h2')()(`Authorize`)
	}

	protected getAuthFlow(clientId: string): Promise<AuthFlow> {
		return this.authFlowFactory.makeAuthFlow(clientId,this.authLanding.url)
	}

	protected getAuthCode(abortSignal: AbortSignal): Promise<string> {
		return this.authLanding.getCode(abortSignal)
	}

	protected cleanupAfterGetCode(abortSignal: AbortSignal): void {
		this.authLanding.cleanupAfterGetCode(abortSignal)
	}
}
