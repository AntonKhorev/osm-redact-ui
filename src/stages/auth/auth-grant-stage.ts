import AuthStage from './auth-stage'
import OsmUrlProvider from '../../osm-url-provider'
import OsmClientIdProvider from '../../osm-client-id-provider'
import PopupWindowOpener from '../../popup-window-opener'
import AbortManager from '../../abort-manager'
import AuthFlow from '../../auth-flow'
import { isObject } from '../../types'

export default abstract class AuthGrantStage extends AuthStage {
	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider,
		private readonly osmClientIdProvider: OsmClientIdProvider,
		abortManager: AbortManager, popupWindowOpener: PopupWindowOpener
	) {
		super(title,type,osmUrlProvider)

		abortManager.addRunControl(this.runControl)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runLogger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const osmWebRoot=this.osmWebRoot
				const clientId=osmClientIdProvider.clientId
				const authFlow=await this.getAuthFlow(clientId)
				let code: string
				{
					const urlStart=`${osmWebRoot}oauth2/authorize`
					const url=urlStart+`?`+authFlow.getAuthRequestParams()
					this.runLogger.appendOperation(`open browser window`,urlStart)
					const authWindow=popupWindowOpener.open(url)
					try {
						code=await this.getAuthCode(abortSignal)
					} finally {
						authWindow.close()
						this.cleanupAfterGetCode(abortSignal)
					}
				}
				{
					const url=`${osmWebRoot}oauth2/token`
					this.runLogger.appendRequest('POST',url)
					const response=await fetch(url,{
						signal: abortSignal,
						method: 'POST',
						body: authFlow.getAccessTokenRequestParams(code)
					})
					if (!response.ok) throw new TypeError(`failed to fetch token`)
					const json=await response.json()
					const token=getTokenFromTokenResponseJson(json)
					await this.passToken(abortSignal,token)
				}
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	protected renderPreRunControlWidgets(): HTMLElement[] {
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
