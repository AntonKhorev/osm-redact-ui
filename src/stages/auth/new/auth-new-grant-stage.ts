import AuthNewStage from './auth-new-stage'
import OsmUrlProvider from './osm-url-provider'
import OsmClientIdProvider from './osm-client-id-provider'
import PopupWindowOpener from '../../../popup-window-opener'
import AuthFlowFactory from '../../../auth-flow-factory'
import AuthFlow from '../../../auth-flow'
import { OsmAuthOauthData } from '../../../osm-auth-data'
import { isObject } from '../../../types'

export default abstract class AuthNewGrantStage extends AuthNewStage {
	protected readonly authFlowFactory=new AuthFlowFactory

	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider,
		private readonly osmClientIdProvider: OsmClientIdProvider,
		private readonly popupWindowOpener: PopupWindowOpener
	) {
		super(title,type,osmUrlProvider)
	}

	protected async getOauthData(abortSignal: AbortSignal): Promise<OsmAuthOauthData> {
		const osmWebRoot=this.osmWebRoot
		const clientId=this.osmClientIdProvider.clientId
		const authFlow=await this.getAuthFlow(clientId)
		let code: string
		{
			const urlStart=`${osmWebRoot}oauth2/authorize`
			const url=urlStart+`?`+authFlow.getAuthRequestParams()
			this.runControl.logger.appendOperation(`open browser window`,urlStart)
			const authWindow=this.popupWindowOpener.open(url)
			try {
				code=await this.getAuthCode(abortSignal)
			} finally {
				authWindow.close()
				this.cleanupAfterGetCode(abortSignal)
			}
		}
		let token: string
		{
			const url=`${osmWebRoot}oauth2/token`
			this.runControl.logger.appendRequest('POST',url)
			const response=await fetch(url,{
				signal: abortSignal,
				method: 'POST',
				body: authFlow.getAccessTokenRequestParams(code)
			})
			if (!response.ok) throw new TypeError(`Failed to fetch token`)
			const json=await response.json()
			token=getTokenFromTokenResponseJson(json)
		}
		return {clientId,token}
	}

	protected renderWidgetsInsideForm(): HTMLElement[] {
		return this.osmClientIdProvider.getWidgets()
	}

	protected abstract getAuthFlow(clientId: string): Promise<AuthFlow>
	protected abstract getAuthCode(abortSignal: AbortSignal): Promise<string>
	protected abstract cleanupAfterGetCode(abortSignal: AbortSignal): void
}

function getTokenFromTokenResponseJson(json: unknown): string {
	if (
		isObject(json) && 'access_token' in json &&
		typeof json.access_token == 'string'
	) {
		return json.access_token
	} else {
		throw new TypeError(`received invalid token`)
	}
}
