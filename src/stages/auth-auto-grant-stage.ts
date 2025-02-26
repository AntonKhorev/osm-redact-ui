import AuthGrantStage from './auth-grant-stage'
import ConnectionShowStage from './connection-show-stage'
import OsmUrlProvider from '../osm-url-provider'
import OsmClientIdProvider from '../osm-client-id-provider'
import AuthLanding from '../auth-landing'
import PopupWindowOpener from '../popup-window-opener'
import AbortManager from '../abort-manager'
import AuthFlow from '../auth-flow'
import { makeElement } from '../html'

export default class AuthAutoGrantStage extends AuthGrantStage {
	constructor(
		osmUrlProvider: OsmUrlProvider, osmClientIdProvider: OsmClientIdProvider,
		abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener,
		private authLanding: AuthLanding
	) {
		super(osmUrlProvider,osmClientIdProvider,abortManager,connectionShowStage,popupWindowOpener)
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
