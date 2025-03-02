import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import { getOsmElementVersionDataFromString } from '../osm-element-data'
import { getOsmRedactionIdFromString } from '../osm-redaction-data'
import { makeElement, makeDiv, makeLabel, makeLink } from '../html'

let targetTextareaCount=0

export default class ElementsStage {
	private readonly runControl=new RunControl

	readonly $targetTextarea=makeElement('textarea')()()
	private readonly $redactionInput=makeElement('input')()()
	private readonly $redactionsList=makeDiv()()
	protected readonly $runButton=makeElement('button')()(`Redact target elements`)

	private readonly $elementsList=makeElement('ul')()()

	protected readonly $form=makeElement('form')('formatted')()

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Target elements`),
		makeElement('p')('hint')(
			makeElement('small')()(
				`Receives element versions from the previous stage. `+
				`This list of versions can also be used with `,makeElement('code')()(`batch_redaction.pl`),
				` from `,makeLink(`osm-revert-scripts`,`https://github.com/woodpeck/osm-revert-scripts`),`. `+
				`Performs the actual redactions.`
			)
		)
	)

	constructor(
		private readonly currentOsmAuthProvider: CurrentOsmAuthProvider
	) {
		this.$targetTextarea.id=`target-elements-${targetTextareaCount++}`
		this.$targetTextarea.rows=10
		this.$targetTextarea.name='osm-elements-to-redact'
		this.$targetTextarea.required=true
		
		this.$redactionInput.name='redaction-id'
		this.$redactionInput.required=true

		this.$section.hidden=true

		document.body.addEventListener('osmRedactUi:currentAuthUpdate',()=>{
			const osmAuth=currentOsmAuthProvider.currentOsmAuth
			this.$section.hidden=!osmAuth
			this.$redactionsList.replaceChildren()
			if (!osmAuth) return
			this.$redactionsList.replaceChildren(
				makeElement('small')()(
					`Visit `,makeLink(`redactions page`,osmAuth.webUrl('redactions')),` to see available redactions or make a new one.`
				)
			)
		})

		this.$targetTextarea.onchange=()=>{
			this.updateElements()
		}

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			const osmAuth=currentOsmAuthProvider.currentOsmAuth
			if (!osmAuth) return
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=osmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
				const redactionId=getOsmRedactionIdFromString(
					osmAuth.serverUrls,
					this.$redactionInput.value.trim()
				)
				let targetValue: string
				while (targetValue=this.$targetTextarea.value) {
					const lineMatch=targetValue.match(/.*/)
					if (lineMatch) {
						const [line]=lineMatch
						let redactedElementVersionString: string|undefined
						try {
							const elementVersion=getOsmElementVersionDataFromString(osmAuth.serverUrls,line)
							redactedElementVersionString=`${elementVersion.type}/${elementVersion.id}/${elementVersion.version}`
						} catch {
							console.log(`Was unable to parse redaction target line ${line}`)
						}
						if (redactedElementVersionString!=null) {
							const response=await osmApi.post(
								`${redactedElementVersionString}/redaction?redaction=${encodeURIComponent(redactionId)}`
							)
							if (!response.ok) throw new TypeError(`Failed to redact element version "${redactedElementVersionString}"`)
						}
					}
					this.$targetTextarea.value=targetValue.replace(/.*\n?/,'')
				}
				this.runControl.addMessage('success',`Completed redactions`)
			} catch (ex) {
				this.runControl.handleException(ex)
			}
			// TODO: post-check if top versions match - no, this is only needed after revert
			// actual TODO: post-check if everything is redacted
			this.runControl.exit()
		}
	}

	start() {
		const $targetTextareaLabel=makeLabel()(`Element versions to redact`)
		$targetTextareaLabel.htmlFor=this.$targetTextarea.id

		const $elementsAside=makeElement('aside')('target-elements')(
			this.$elementsList
		)
		$elementsAside.tabIndex=-1

		this.$form.append(
			makeDiv('input-group')(
				$targetTextareaLabel,
				makeDiv('aside-group')(
					this.$targetTextarea,
					$elementsAside
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Redaction id or URL`,this.$redactionInput
				),
				this.$redactionsList
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

	updateElements() {
		this.$elementsList.replaceChildren()
		const osmAuth=this.currentOsmAuthProvider.currentOsmAuth
		if (!osmAuth) return
		for (const line of this.$targetTextarea.value.split('\n')) {
			try {
				const elementVersion=getOsmElementVersionDataFromString(osmAuth.serverUrls,line)
				const evString=`${elementVersion.type[0]}${elementVersion.id}v${elementVersion.version}`
				const evPath=`${elementVersion.type}/${elementVersion.id}/history/${elementVersion.version}`
				const $a=makeLink(evString,osmAuth.webUrl(evPath))
				$a.tabIndex=-1
				this.$elementsList.append(
					makeElement('li')()(
						makeElement('code')()(
							$a
						)
					)
				)
			} catch {}
		}
	}
}
