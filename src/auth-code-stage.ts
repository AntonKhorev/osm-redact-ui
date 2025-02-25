import AuthStage from './auth-stage'
import ConnectionShowStage from './connection-show-stage'
import PopupWindowOpener from './popup-window-opener'
import AbortManager from './abort-manager'
import { makeElement, makeDiv, makeLabel } from './html'
import { isObject } from './types'

export default class AuthCodeStage extends AuthStage {
	private $authClientIdInput=makeElement('input')()()
	private $authCodeControls=makeElement('fieldset')()()

	constructor(abortManager: AbortManager, connectionShowStage: ConnectionShowStage, popupWindowOpener: PopupWindowOpener) {
		super()

		abortManager.addRunControl(this.runControl)

		this.$authClientIdInput.name='auth-client-id'
		this.$authClientIdInput.required=true

		const $authCodeInput=makeElement('input')()()
		$authCodeInput.name='auth-code'
		const $authCodeButton=makeElement('button')()(`Accept code`)
		$authCodeButton.type='button'

		this.$authCodeControls.append(
			makeDiv('input-group')(
				makeLabel()(
					`Authorization code`, $authCodeInput
				)
			),
			makeDiv('input-group')(
				$authCodeButton
			)
		)
		this.$authCodeControls.hidden=true

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			this.runControl.logger.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			try {
				const osmWebRoot=this.$osmWebRootInput.value.trim()
				const authFlow=await this.authFlowFactory.makeAuthFlow(
					this.$authClientIdInput.value.trim(),
					'urn:ietf:wg:oauth:2.0:oob'
				)
				{
					const urlStart=`${osmWebRoot}oauth2/authorize`
					const url=urlStart+`?`+authFlow.getAuthRequestParams()
					this.runControl.logger.appendText(`open browser window ${urlStart}`)
					const authWindow=popupWindowOpener.open(url)
					try {
						this.$authCodeControls.hidden=false
						await new Promise((resolve,reject)=>{
							$authCodeButton.onclick=resolve
							abortSignal.onabort=reject
						})
					} finally {
						this.$authCodeControls.hidden=true
						authWindow.close()
						$authCodeButton.onclick=null
						abortSignal.onabort=null
					}
				}
				{
					const url=`${osmWebRoot}oauth2/token`
					this.runControl.logger.appendText(`POST ${url}`)
					const response=await fetch(url,{
						signal: abortSignal,
						method: 'POST',
						body: authFlow.getAccessTokenRequestParams(
							$authCodeInput.value.trim()
						)
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
		return [
			this.$authCodeControls
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
