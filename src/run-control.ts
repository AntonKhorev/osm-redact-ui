import RunLogger from './run-logger'
import { makeElement, makeDiv } from './html'

export default class RunControl {
	private abortController?: AbortController
	readonly logger=new RunLogger

	private $originButton?: HTMLButtonElement
	private readonly $abortButton=makeElement('button')()(`Abort`)
	private $messages=makeDiv('messages')()

	readonly $widget=makeDiv('run')(
		makeDiv('abort')(
			this.$abortButton
		),
		this.logger.$widget,
		this.$messages
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
		this.$messages.replaceChildren()
		this.abortController=new AbortController

		this.$abortButton.onclick=()=>{
			this.abortController?.abort()
		}
		this.$abortButton.disabled=false

		this.$messages.onclick=(ev)=>{
			if (!(ev.target instanceof Element)) return
			const $closeButton=ev.target.closest('button.close')
			if (!$closeButton) return
			const $message=$closeButton.closest('.message')
			$message?.remove()
		}

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

	handleException(ex: unknown): void {
		console.log(ex)
		if (ex instanceof TypeError) {
			this.addMessage('error',ex.message)
		}
	}

	addMessage(type: 'success'|'warning'|'error', message: string): void {
		const $closeButton=makeElement('button')('close')()
		$closeButton.innerHTML=`<svg width='16' height='16' viewBox='-8 -8 16 16' stroke='currentColor' stroke-width='1.5'>`+
			`<line x1='-4' y1='-4' x2='+4' y2='+4' />`+
			`<line x1='-4' y1='+4' x2='+4' y2='-4' />`+
		`</svg>`
		this.$messages.append(
			makeDiv('message',type)(
				makeElement('span')('text')(
					message
				),
				$closeButton
			)
		)
	}
}
