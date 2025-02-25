// TODO: remove copypaste from auth-code-stage

import AuthStage from './auth-stage'
import AuthLanding from './auth-landing'
import ConnectionShowStage from './connection-show-stage'
import AbortManager from './abort-manager'
import { makeElement, makeDiv, makeLabel } from './html'
import { isObject } from './types'

export default class AuthAutoStage extends AuthStage {
	private $authClientIdInput=makeElement('input')()()

	constructor(abortManager: AbortManager, connectionShowStage: ConnectionShowStage, authLanding: AuthLanding) {
		super()

		abortManager.addRunControl(this.runControl)

		this.$authClientIdInput.name='auth-client-id'
		this.$authClientIdInput.required=true

		const $authCodeInput=makeElement('input')()()
		$authCodeInput.name='auth-code'
		const $authCodeButton=makeElement('button')()(`Accept code`)
		$authCodeButton.type='button'

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runControl.logger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const osmWebRoot=this.$osmWebRootInput.value.trim()
				const authFlow=await this.authFlowFactory.makeAuthFlow(
					this.$authClientIdInput.value.trim(),
					authLanding.url
				)
				let code: string
				{
					const width=600
					const height=600
					const urlStart=`${osmWebRoot}oauth2/authorize`
					const url=urlStart+`?`+authFlow.getAuthRequestParams()
					this.runControl.logger.appendText(`open browser window ${urlStart}`)
					const authWindow=open(url,'_blank',
						`width=${width},height=${height},left=${screen.width/2-width/2},top=${screen.height/2-height/2}`
					)
					if (!authWindow) throw new TypeError(`failed to open auth window`)
					try {
						code=await authLanding.getCode(abortSignal) // TODO: reject on popup close, can't use authWindow.onclose
					} finally {
						authWindow.close()
						authLanding.cleanupAfterGetCode(abortSignal)
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
			$authCodeInput.value=''
		}
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
