import Logger from "./logger"

export default class OsmApi {
	constructor(
		private apiRoot: string,
		private authToken: string,
		private logger: Logger,
		private signal: AbortSignal
	) {}

	get(path: string): Promise<Response> {
		return this.fetch(path)
	}

	post(path: string): Promise<Response> {
		return this.fetch(path,'POST')
	}

	fetch(path: string, method?: string): Promise<Response> {
		const url=`${this.apiRoot}api/0.6/${path}`
		this.logger.appendGetRequest(url)
		const options: RequestInit = {signal: this.signal}
		if (method) options.method=method
		if (this.authToken) options.headers={'Authorization': `Bearer ${this.authToken}`}
		return fetch(url,options)
	}
}
