import Logger from "./logger";

export default class OsmApiAccessor {
	constructor(private apiRoot: string, private logger: Logger) {}

	get(path: string, signal: AbortSignal): Promise<Response> {
		const url=`${this.apiRoot}api/0.6/${path}`
		this.logger.appendGetRequest(url)
		return fetch(url,{signal})
	}
}
