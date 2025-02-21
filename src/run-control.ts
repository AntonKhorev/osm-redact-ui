import Logger from "./logger"
import { makeElement, makeDiv } from "./html"

export default class RunControl {
	$button=makeElement('button')()()
	$widget=makeDiv()(
		makeDiv('input-group')(
			this.$button
		)
	)
	logger: Logger

	constructor(
		private normalButtonLabel: string,
		private abortButtonLabel: string,
		loggerSummary: string
	) {
		this.$button.textContent=normalButtonLabel
		this.logger=new Logger(loggerSummary)
		this.$widget.append(this.logger.$widget)
	}

	enterReadyState() {
		this.$button.disabled=false
		this.$button.textContent=this.normalButtonLabel
		this.$button.onclick=null
	}

	enterRunningState(abortController: AbortController) {
		this.$button.disabled=false
		this.$button.textContent=this.abortButtonLabel
		this.$button.onclick=(ev)=>{
			ev.preventDefault()
			abortController.abort()
		}
	}

	enterDisabledState() {
		this.$button.disabled=true
		this.$button.textContent=this.normalButtonLabel
		this.$button.onclick=null
	}
}
