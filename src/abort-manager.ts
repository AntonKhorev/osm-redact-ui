import RunControl from "./run-control"

export default class AbortManager {
	private abortController?: AbortController
	private runControls: RunControl[] = []
	
	addRunControl(runControl: RunControl): void {
		this.runControls.push(runControl)
	}

	enterStage(
		activeRunControl: RunControl
	): AbortSignal {
		if (this.abortController) this.exitStage()
		this.abortController=new AbortController
		for (const runControl of this.runControls) {
			if (runControl==activeRunControl) {
				runControl.enterRunningState(this.abortController)
			} else {
				runControl.enterDisabledState()
			}
		}
		return this.abortController.signal
	}

	exitStage(): void {
		this.abortController?.abort()
		this.abortController=undefined
		for (const runControl of this.runControls) {
			runControl.enterReadyState()
		}
	}
}
