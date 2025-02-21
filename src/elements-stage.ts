import RunControl from './run-control'
import { OsmApiManager } from './osm-api'
import { makeElement, makeDiv, makeLabel } from './html'

export default class ElementsStage {
	$expectedChangesCountOutput=makeElement('output')()()
	$downloadedChangesCountOutput=makeElement('output')()()
	$elementsToRedactTextarea=makeElement('textarea')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`See target elements`)
	)

	private runControl=new RunControl(
		`Redact target elements`,
		`Abort redacting target elements`,
		`Redact log`
	)

	constructor(osmApiManager: OsmApiManager) {
		this.$elementsToRedactTextarea.rows=10
		this.$elementsToRedactTextarea.name='osm-elements-to-redact'
		
		osmApiManager.addRunControl(this.runControl)

		const $form=makeElement('form')()(
			makeDiv('output-group')(
				`Expected changes count: `,this.$expectedChangesCountOutput
			),
			makeDiv('output-group')(
				`Downloaded changes count: `,this.$downloadedChangesCountOutput
			),
			makeDiv('input-group')(
				makeLabel()(
					`Elements to redact`, this.$elementsToRedactTextarea
				)
			),
			this.runControl.$widget
		)

		$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			// TODO: decide how to pass token
			// const osmApiAccessor=osmApiManager.enterForm($apiInput.value,$tokenInput.value,elementsRunControl)
			try {
			} catch (ex) {
				console.log(ex)
			}
			// TODO: redact
			// TODO: post-check if top versions match
			osmApiManager.exitForm()
		}

		this.$section.append($form)
	}

	clear() {
		this.runControl.logger.clear()
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
		this.$elementsToRedactTextarea.value=''
	}
}
