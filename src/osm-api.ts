import Logger from "./logger";

export class OsmApiAccessor {
	constructor(
		private apiRoot: string,
		private authToken: string,
		private logger: Logger,
		private signal: AbortSignal
	) {}

	get(path: string): Promise<Response> {
		const url=`${this.apiRoot}api/0.6/${path}`
		this.logger.appendGetRequest(url)
		const options: RequestInit = {signal: this.signal}
		if (this.authToken) options.headers={'Authorization': `Bearer ${this.authToken}`}
		return fetch(url,options)
	}
}

export class OsmApiManager {
	private abortController?: AbortController
	private $activeFetchButton?: HTMLButtonElement
	private activeFetchButtonOriginalLabel?: string

	constructor(
		private $fetchButtons: HTMLButtonElement[]
	) {}

	enterForm(
		apiRoot: string,
		authToken: string,
		logger: Logger,
		$fetchButton: HTMLButtonElement
	): OsmApiAccessor {
		if (this.abortController) this.exitForm()
		this.abortController=new AbortController
		this.$activeFetchButton=$fetchButton
		this.activeFetchButtonOriginalLabel=this.$activeFetchButton.textContent??''
		this.$activeFetchButton.textContent=`Abort`
		this.$activeFetchButton.onclick=(ev)=>{
			ev.preventDefault()
			this.abortController?.abort()
		}
		for (const $otherFetchButton of this.$fetchButtons) {
			if ($otherFetchButton==$fetchButton) continue
			$otherFetchButton.disabled=true
		}
		return new OsmApiAccessor(apiRoot,authToken,logger,this.abortController.signal)
	}

	exitForm(): void {
		this.abortController?.abort()
		this.abortController=undefined
		if (this.$activeFetchButton && this.activeFetchButtonOriginalLabel!=null) {
			this.$activeFetchButton.textContent=this.activeFetchButtonOriginalLabel
		}
		this.activeFetchButtonOriginalLabel=undefined
		this.$activeFetchButton=undefined
		for (const $fetchButton of this.$fetchButtons) {
			$fetchButton.disabled=false
			$fetchButton.onclick=null
		}
	}
}
