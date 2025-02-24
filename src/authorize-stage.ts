import AuthFlowFactory from './auth-flow-factory'
import AbortManager from './abort-manager'
import RunControl from './run-control'
import { makeElement, makeDiv, makeLabel } from './html'

const authFlowFactory=new AuthFlowFactory

export default class ChangesetStage {
	$section=makeElement('section')()(
		makeElement('h2')()(`Authorize`)
	)

	constructor(abortManager: AbortManager) {
		const $osmWebRootInput=makeElement('input')()()
		$osmWebRootInput.name='osm-api-root'
		$osmWebRootInput.required=true
		$osmWebRootInput.value=`http://127.0.0.1:3000/`

		const $authClientIdInput=makeElement('input')()()
		$authClientIdInput.name='auth-client-id'
		$authClientIdInput.required=true

		const $authCodeInput=makeElement('input')()()
		$authCodeInput.name='auth-code'
		const $authCodeButton=makeElement('button')()(`Accept code`)
		$authCodeButton.type='button'

		const $authCodeControls=makeElement('fieldset')()(
			makeDiv('input-group')(
				makeLabel()(
					`Authorization code`, $authCodeInput
				)
			),
			makeDiv('input-group')(
				$authCodeButton
			)
		)
		$authCodeControls.hidden=true

		const runControl=new RunControl(
			`Authorize`,
			`Abort authorization`,
			`Authorization log`
		)
		abortManager.addRunControl(runControl)

		const $form=makeElement('form')()(
			makeDiv('input-group')(
				makeLabel()(
					`OSM web url`, $osmWebRootInput
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Application client id`, $authClientIdInput
				)
			),
			runControl.$widget,
			$authCodeControls
		)

		$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			runControl.logger.clear()
			const abortSignal=abortManager.enterStage(runControl)
			try {
				const osmWebRoot=$osmWebRootInput.value.trim()
				const authFlow=await authFlowFactory.makeAuthFlow(
					$authClientIdInput.value.trim(),
					'urn:ietf:wg:oauth:2.0:oob'
				)
				{
					const width=600
					const height=600
					const urlStart=`${osmWebRoot}oauth2/authorize`
					const url=urlStart+`?`+authFlow.getAuthRequestParams()
					runControl.logger.appendText(`open ${urlStart} in a window`)
					const authWindow=open(url,'_blank',
						`width=${width},height=${height},left=${screen.width/2-width/2},top=${screen.height/2-height/2}`
					)
					if (!authWindow) throw new TypeError(`failed to open auth window`)
					try {
						$authCodeControls.hidden=false
						await new Promise((resolve,reject)=>{
							$authCodeButton.onclick=resolve
							abortSignal.onabort=reject
						})
					} finally {
						$authCodeControls.hidden=true
						authWindow.close()
						$authCodeButton.onclick=null
						abortSignal.onabort=null
					}
				}
				{
					const url=`${osmWebRoot}oauth2/token`
					runControl.logger.appendText(`POST ${url}`)
					const response=await fetch(url,{
						signal: abortSignal,
						method: 'POST',
						body: authFlow.getAccessTokenRequestParams(
							$authCodeInput.value.trim()
						)
					})
					if (!response.ok) throw new TypeError(`failed to fetch token`)
					const json=await response.json()
					console.log(`received token`,json)
				}
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
			$authCodeInput.value=''
		}

		this.$section.append($form)
	}
}
