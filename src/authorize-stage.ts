import RunControl from './run-control'
import { makeElement, makeDiv, makeLabel } from './html'

export default class ChangesetStage {
	$section=makeElement('section')()(
		makeElement('h2')()(`Authorize`)
	)

	constructor() {
		const $osmWebRootInput=makeElement('input')()()
		$osmWebRootInput.name='osm-api-root'
		$osmWebRootInput.required=true
		$osmWebRootInput.value=`http://127.0.0.1:3000/`

		const $authClientIdInput=makeElement('input')()()
		$authClientIdInput.name='auth-client-id'
		$authClientIdInput.required=true

		const $authCodeInput=makeElement('input')()()
		$authCodeInput.name='auth-code'

		const runControl=new RunControl(
			`Authorize`,
			`Abort authorization`,
			`Authorization log`
		)

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
			makeDiv('input-group')(
				makeLabel()(
					`Authorization code`, $authCodeInput
				)
			),
			runControl.$widget
		)

		$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			runControl.logger.clear()
			if (!$authCodeInput.value) {
				const codeVerifier=getCodeVerifier()
				const codeChallenge=await getCodeChallenge(codeVerifier)
				const width=600
				const height=600
				const urlStart=`${$osmWebRootInput.value}oauth2/authorize`
				const url=urlStart+`?`+new URLSearchParams([
					['client_id',$authClientIdInput.value],
					['redirect_uri','urn:ietf:wg:oauth:2.0:oob'],
					['scope','read_prefs write_redactions'],
					['response_type','code'],
					['code_challenge',codeChallenge],
					['code_challenge_method','S256']
				])
				runControl.logger.appendText(`open ${urlStart} in a window`)
				const loginWindow=open(url,'_blank',
					`width=${width},height=${height},left=${screen.width/2-width/2},top=${screen.height/2-height/2}`
				)
				// if (loginWindow==null) return
			} else {
			}
		}

		this.$section.append($form)
	}
}

function getCodeVerifier():string {
	const byteLength=48 // verifier string length == byteLength * 8/6
	return encodeBase64url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

async function getCodeChallenge(codeVerifier:string):Promise<string> {
	const codeVerifierArray=new TextEncoder().encode(codeVerifier)
	const codeChallengeBuffer=await crypto.subtle.digest('SHA-256',codeVerifierArray)
	return encodeBase64url(new Uint8Array(codeChallengeBuffer))
}

function encodeBase64url(bytes:Uint8Array):string { // https://www.rfc-editor.org/rfc/rfc4648#section-5
	const string=String.fromCharCode(...bytes)
	return btoa(string).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
