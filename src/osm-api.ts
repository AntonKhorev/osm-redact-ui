import RunLogger from './run-logger'

export default class OsmApi {
	constructor(
		private apiRoot: string,
		private authToken: string,
		private runLogger: RunLogger,
		private signal: AbortSignal
	) {}

	get(path: string): Promise<Response> {
		return this.fetch(path)
	}

	post(path: string): Promise<Response> {
		return this.fetch(path,'POST')
	}

	async fetch(path: string, method='GET'): Promise<Response> {
		const url=`${this.apiRoot}api/0.6/${path}`
		const logEntry=this.runLogger.appendRequest(method,url)
		const options: RequestInit = {signal: this.signal, method}
		if (this.authToken) options.headers={'Authorization': `Bearer ${this.authToken}`}
		const response=await fetch(url,options)
		logEntry.appendStatus(response)
		return response
	}
}
