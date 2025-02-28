import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import { isOsmElementType } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel } from '../html'
import { toPositiveInteger } from '../types'

export default class ElementsStage {
	private readonly runControl=new RunControl

	readonly $targetTextarea=makeElement('textarea')()()
	private readonly $redactionInput=makeElement('input')()()
	protected readonly $runButton=makeElement('button')()(`Redact target elements`)

	protected readonly $form=makeElement('form')('formatted')()

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Target elements`)
	)

	constructor(currentOsmAuthProvider: CurrentOsmAuthProvider) {
		this.$targetTextarea.rows=10
		this.$targetTextarea.name='osm-elements-to-redact'
		this.$targetTextarea.required=true
		
		this.$redactionInput.name='redaction-id'
		this.$redactionInput.required=true

		this.runControl.$widget.hidden=true

		document.body.addEventListener('osmRedactUi:currentAuthUpdate',()=>{
			this.runControl.$widget.hidden=!currentOsmAuthProvider.currentOsmAuth
		})

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			if (!currentOsmAuthProvider.currentOsmAuth) return
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=currentOsmAuthProvider.currentOsmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
				let targetValue: string
				while (targetValue=this.$targetTextarea.value) {
					const lineMatch=targetValue.match(/.*/)
					if (lineMatch) {
						const [line]=lineMatch
						const [type,idString,versionString]=line.split('/')
						let redactedElementWithVersion: string|undefined
						try {
							if (!isOsmElementType(type)) throw new TypeError(`received invalid element type`)
							const id=toPositiveInteger(idString)
							const version=toPositiveInteger(versionString)
							redactedElementWithVersion=`${type}/${id}/${version}`
						} catch {
							console.log(`was unable to parse redaction target line ${line}`)
						}
						if (redactedElementWithVersion!=null) {
							const response=await osmApi.post(
								`${redactedElementWithVersion}/redaction?redaction=${encodeURIComponent(this.$redactionInput.value)}`
							)
							if (!response.ok) throw new TypeError(`failed to redact element version`)
						}
					}
					this.$targetTextarea.value=targetValue.replace(/.*\n?/,'')
				}
			} catch (ex) {
				console.log(ex)
			}
			// TODO: post-check if top versions match - no, this is only needed after revert
			// actual TODO: post-check if everything is redacted
			this.runControl.exit()
		}
	}

	start() {
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`Elements to redact `,this.$targetTextarea
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Redaction id `,this.$redactionInput
				)
			),
			makeDiv('input-group')(
				this.$runButton
			)
		)

		this.$section.append(
			this.$form,
			this.runControl.$widget,
		)
	}

	clear() {
		this.$targetTextarea.value=''
	}
}
