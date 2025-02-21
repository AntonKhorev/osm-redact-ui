import RunControl from "./run-control"
import Logger from "./logger"

export class OsmApiAccessor {
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

export class OsmApiManager {
	private abortController?: AbortController
	private runControls: RunControl[] = []
	
	addRunControl(runControl: RunControl): void {
		this.runControls.push(runControl)
	}

	enterStage(
		apiRoot: string,
		authToken: string,
		activeRunControl: RunControl
	): OsmApiAccessor {
		if (this.abortController) this.exitStage()
		this.abortController=new AbortController
		for (const runControl of this.runControls) {
			if (runControl==activeRunControl) {
				runControl.enterRunningState(this.abortController)
			} else {
				runControl.enterDisabledState()
			}
		}
		return new OsmApiAccessor(apiRoot,authToken,activeRunControl.logger,this.abortController.signal)
	}

	exitStage(): void {
		this.abortController?.abort()
		this.abortController=undefined
		for (const runControl of this.runControls) {
			runControl.enterReadyState()
		}
	}
}
