import AuthFlow from './auth-flow'

export default class AuthFlowFactory {
	async makeAuthFlow(
		clientId: string,
		redirectUri: string
	): Promise<AuthFlow> {
		const codeVerifier=getCodeVerifier()
		const codeChallenge=await getCodeChallenge(codeVerifier)
		return new AuthFlow(
			clientId,
			redirectUri,
			codeVerifier,
			codeChallenge
		)
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
