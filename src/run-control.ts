import RunLogger from './run-logger'
import { makeElement, makeDiv } from './html'

export default class RunControl {
	private abortController?: AbortController
	readonly logger=new RunLogger

	private $originButton?: HTMLButtonElement
	private readonly $abortButton=makeElement('button')()(`Abort`)

	readonly $widget=makeDiv('run')(
		makeDiv('abort')(
			this.$abortButton
		),
		this.logger.$widget
	)

	constructor() {
		this.$abortButton.type='button'
		this.$abortButton.disabled=true
	}

	enter($originButton: HTMLButtonElement): AbortSignal {
		if (this.abortController) {
			this.exit()
		}

		this.$originButton=$originButton
		this.$originButton.disabled=true

		this.logger.clear()
		this.abortController=new AbortController

		this.$abortButton.onclick=()=>{
			this.abortController?.abort()
		}
		this.$abortButton.disabled=false

		return this.abortController.signal
	}

	exit(): void {
		if (this.$originButton) {
			this.$originButton.disabled=false
		}
		delete this.$originButton

		this.$abortButton.disabled=true
		this.$abortButton.onclick=null
		delete this.abortController
	}
}
