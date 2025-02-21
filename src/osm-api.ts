import Logger from "./logger";

export default class OsmApiAccessor {
	constructor(private apiRoot: string, private authToken: string, private logger: Logger) {}

	get(path: string, signal: AbortSignal): Promise<Response> {
		const url=`${this.apiRoot}api/0.6/${path}`
		this.logger.appendGetRequest(url)
		const options: RequestInit = {signal}
		if (this.authToken) options.headers={'Authorization': `Bearer ${this.authToken}`}
		return fetch(url,options)
	}
}
