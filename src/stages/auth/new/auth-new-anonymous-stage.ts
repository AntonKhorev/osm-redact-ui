import AuthNewStage from './auth-new-stage'
import OsmUrlProvider from './osm-url-provider'

export default class AuthNewAnonymousStage extends AuthNewStage {
	constructor(
		title: string, type: string,
		osmUrlProvider: OsmUrlProvider
	) {
		super(title,type,osmUrlProvider)
	}

	protected async getOauthData(abortSignal: AbortSignal): Promise<undefined> {}
}
