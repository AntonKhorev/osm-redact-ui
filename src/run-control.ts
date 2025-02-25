import { makeElement, makeDiv } from "./html"

export default class RunControl {
	$button=makeElement('button')()()
	$widget=makeDiv()(
		makeDiv('input-group')(
			this.$button
		)
	)

	constructor(
		private normalButtonLabel: string,
		private abortButtonLabel: string
	) {
		this.$button.textContent=normalButtonLabel
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
