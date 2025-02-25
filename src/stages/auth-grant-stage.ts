import AuthStage from './auth-stage'
import ConnectionShowStage from './connection-show-stage'
import PopupWindowOpener from '../popup-window-opener'
import AbortManager from '../abort-manager'
import AuthFlow from '../auth-flow'
import { isObject } from '../types'

export default abstract class AuthGrantStage extends AuthStage {
	constructor(
		abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener
	) {
		super()

		abortManager.addRunControl(this.runControl)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runControl.logger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const osmWebRoot=this.$osmWebRootInput.value.trim()
				const authFlow=await this.getAuthFlow()
				let code: string
				{
					const urlStart=`${osmWebRoot}oauth2/authorize`
					const url=urlStart+`?`+authFlow.getAuthRequestParams()
					this.runControl.logger.appendText(`open browser window ${urlStart}`)
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
					this.runControl.logger.appendText(`POST ${url}`)
					const response=await fetch(url,{
						signal: abortSignal,
						method: 'POST',
						body: authFlow.getAccessTokenRequestParams(code)
					})
					if (!response.ok) throw new TypeError(`failed to fetch token`)
					const json=await response.json()
					const token=getTokenFromTokenResponseJson(json)
					await this.passToken(connectionShowStage,abortSignal,token)
				}
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	protected abstract getAuthFlow(): Promise<AuthFlow>
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
