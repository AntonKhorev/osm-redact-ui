export default class AuthFlow {
	constructor(
		private clientId: string,
		private redirectUri: string,
		private codeVerifier: string,
		private codeChallenge: string
	) {}

	getAuthRequestParams(): URLSearchParams {
		return new URLSearchParams([
			['client_id',this.clientId],
			['redirect_uri',this.redirectUri],
			['scope','read_prefs write_redactions'],
			['response_type','code'],
			['code_challenge',this.codeChallenge],
			['code_challenge_method','S256']
		])
	}

	getAccessTokenRequestParams(code: string): URLSearchParams {
		return new URLSearchParams([
			['client_id',this.clientId],
			['redirect_uri',this.redirectUri],
			['grant_type','authorization_code'],
			['code',code],
			['code_verifier',this.codeVerifier]
		])
	}
}
