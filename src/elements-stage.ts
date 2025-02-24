import RunControl from './run-control'
import AbortManager from './abort-manager'
import OsmApi from './osm-api'
import { isOsmElementType } from './osm-element-collection'
import { makeElement, makeDiv, makeLabel } from './html'
import { toPositiveInteger } from './types'

type ReadyState = {
	apiRoot: string
	authToken: string
}

export default class ElementsStage {
	private readyState?: ReadyState

	$expectedChangesCountOutput=makeElement('output')()()
	$downloadedChangesCountOutput=makeElement('output')()()
	$targetTextarea=makeElement('textarea')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`See target elements`)
	)

	private runControl=new RunControl(
		`Redact target elements`,
		`Abort redacting target elements`,
		`Redact log`
	)

	constructor(abortManager: AbortManager) {
		this.$targetTextarea.rows=10
		this.$targetTextarea.name='osm-elements-to-redact'
		
		const $redactionInput=makeElement('input')()()
		$redactionInput.name='redaction-id'
		$redactionInput.required=true

		this.runControl.$widget.hidden=true
		abortManager.addRunControl(this.runControl)

		const $form=makeElement('form')()(
			makeDiv('output-group')(
				`Expected changes count: `,this.$expectedChangesCountOutput
			),
			makeDiv('output-group')(
				`Downloaded changes count: `,this.$downloadedChangesCountOutput
			),
			makeDiv('input-group')(
				makeLabel()(
					`Elements to redact `,this.$targetTextarea
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Redaction id `,$redactionInput
				)
			),
			this.runControl.$widget
		)

		$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			if (!this.readyState) return
			const abortSignal=abortManager.enterStage(this.runControl)
			const osmApi=new OsmApi(this.readyState.apiRoot,this.readyState.authToken,this.runControl.logger,abortSignal)
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
								`${redactedElementWithVersion}/redaction?redaction=${encodeURIComponent($redactionInput.value)}`
							)
							if (!response.ok) throw new TypeError(`failed to redact element version`)
						}
					}
					this.$targetTextarea.value=targetValue.replace(/.*\n?/,'')
				}
			} catch (ex) {
				console.log(ex)
			}
			// TODO: post-check if top versions match
			abortManager.exitStage()
		}

		this.$section.append($form)
	}

	clear() {
		this.readyState=undefined
		this.runControl.$widget.hidden=true
		this.runControl.logger.clear()
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
		this.$targetTextarea.value=''
	}

	setReadyState(
		apiRoot: string,
		authToken: string
	) {
		this.readyState={apiRoot,authToken}
		this.runControl.$widget.hidden=false
	}
}
