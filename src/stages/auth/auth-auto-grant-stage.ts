import AuthGrantStage from './auth-grant-stage'
import OsmUrlProvider from './osm-url-provider'
import OsmClientIdProvider from './osm-client-id-provider'
import AuthLanding from '../../auth-landing'
import PopupWindowOpener from '../../popup-window-opener'
import AbortManager from '../../abort-manager'
import AuthFlow from '../../auth-flow'

export default class AuthAutoGrantStage extends AuthGrantStage {
	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider, osmClientIdProvider: OsmClientIdProvider,
		abortManager: AbortManager, popupWindowOpener: PopupWindowOpener,
		private authLanding: AuthLanding
	) {
		super(title,type,osmUrlProvider,osmClientIdProvider,abortManager,popupWindowOpener)
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
