import RunControl from '../run-control'
import RunLogger from '../run-logger'
import AbortManager from '../abort-manager'
import OsmApi from '../osm-api'
import { OsmAuthData } from '../osm-auth-data'
import { isOsmElementType } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel } from '../html'
import { toPositiveInteger } from '../types'

export default class ElementsStage {
	private osmConnection?: OsmAuthData

	private runControl=new RunControl(
		`Redact target elements`,
		`Abort redacting target elements`
	)
	private runLogger=new RunLogger(`Redact log`)

	$expectedChangesCountOutput=makeElement('output')()()
	$downloadedChangesCountOutput=makeElement('output')()()
	$targetTextarea=makeElement('textarea')()()

	private $redactionInput=makeElement('input')()()
	protected $form=makeElement('form')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`See target elements`)
	)

	constructor(abortManager: AbortManager) {
		this.$targetTextarea.rows=10
		this.$targetTextarea.name='osm-elements-to-redact'
		
		this.$redactionInput.name='redaction-id'
		this.$redactionInput.required=true

		this.runControl.$widget.hidden=true
		abortManager.addRunControl(this.runControl)

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			if (!this.osmConnection) return
			const abortSignal=abortManager.enterStage(this.runControl)
			const authToken=this.osmConnection.user?this.osmConnection.user.token:''
			const osmApi=new OsmApi(this.osmConnection.apiRoot,authToken,this.runLogger,abortSignal)
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
			// TODO: post-check if top versions match
			abortManager.exitStage()
		}
	}

	render() {
		this.$form.append(
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
					`Redaction id `,this.$redactionInput
				)
			),
			this.runControl.$widget
		)

		this.$section.append(
			this.$form,
			this.runLogger.$widget
		)
	}

	clear() {
		this.osmConnection=undefined
		this.runControl.$widget.hidden=true
		this.runLogger.clear()
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
		this.$targetTextarea.value=''
	}

	setReadyState(osmConnection: OsmAuthData) {
		this.osmConnection=osmConnection
		this.runControl.$widget.hidden=false
	}
}
