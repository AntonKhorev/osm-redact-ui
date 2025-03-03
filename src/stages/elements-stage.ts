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
	protected readonly $runButton=makeElement('button')()(`Redact targets`)
	private readonly $stopOnErrorsCheckbox=makeElement('input')()()

	private readonly $elementsList=makeElement('ul')()()

	protected readonly $form=makeElement('form')('formatted')()

	private readonly $redactedTextarea=makeElement('textarea')()()
	private readonly $skippedTextarea=makeElement('textarea')()()
	private readonly $moveSkippedButton=makeElement('button')()(`Move back to targets`)
	private readonly $postForm=makeElement('form')('formatted')()

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

		this.$stopOnErrorsCheckbox.type='checkbox'
		this.$stopOnErrorsCheckbox.checked=true

		this.$redactedTextarea.autocomplete='off'
		this.$redactedTextarea.rows=10

		this.$skippedTextarea.autocomplete='off'
		this.$skippedTextarea.rows=10
		this.$skippedTextarea.required=true

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
						const [untrimmedLine]=lineMatch
						const line=untrimmedLine.trim()
						if (line!='') {
							try {
								const elementVersion=getOsmElementVersionDataFromString(osmAuth.serverUrls,line)
								const redactedElementVersionString=`${elementVersion.type}/${elementVersion.id}/${elementVersion.version}`
								const response=await osmApi.post(
									`${redactedElementVersionString}/redaction?redaction=${encodeURIComponent(redactionId)}`
								)
								if (!response.ok) throw new TypeError(`Failed to redact element version "${redactedElementVersionString}"`)
								this.$redactedTextarea.value+=untrimmedLine+'\n'
							} catch (ex) {
								if (this.$stopOnErrorsCheckbox.checked) {
									throw ex;
								} else {
									this.$skippedTextarea.value+=untrimmedLine+'\n'
									if (ex instanceof TypeError) {
										console.log(`Error on line "${line}"`,ex.message);
									} else {
										console.log(`Unexpected error on line "${line}"`,ex);
									}
								}
							}
						} else {
							this.$redactedTextarea.value+=untrimmedLine+'\n'
						}
					}
					this.$targetTextarea.value=targetValue.replace(/.*\n?/,'')
				}
				this.runControl.addMessage('success',`Completed redactions`)
			} catch (ex) {
				this.runControl.handleException(ex)
			}
			this.updateElements()
			this.runControl.exit()
		}

		this.$postForm.onsubmit=(ev)=>{
			ev.preventDefault()
			let separator=''
			if (this.$targetTextarea.value!='') {
				let newlinesBetween=0
				{
					const match=this.$targetTextarea.value.match(/\n*$/)
					if (match) {
						const [newlines]=match
						newlinesBetween+=newlines.length
					}
				}{
					const match=this.$skippedTextarea.value.match(/^\n*/)
					if (match) {
						const [newlines]=match
						newlinesBetween+=newlines.length
					}
				}
				if (newlinesBetween==0) {
					separator='\n\n'
				} else if (newlinesBetween==1) {
					separator='\n'
				}
			}
			this.$targetTextarea.value+=separator+this.$skippedTextarea.value
			this.$skippedTextarea.value=''
		}

		// TODO: post-check if top versions match - no, this is only needed after revert
		// actual TODO: post-check if everything is redacted
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
			),
			makeDiv('input-group')(
				makeLabel()(
					this.$stopOnErrorsCheckbox,` Stop on errors`
				)
			)
		)

		this.$postForm.append(
			makeDiv('double-group')(
				makeDiv('input-group')(
					makeLabel()(
						`Redacted element versions`,
						this.$redactedTextarea
					)
				),
				makeDiv('input-group')(
					makeLabel()(
						`Skipped element versions`,
						this.$skippedTextarea,
						this.$moveSkippedButton
					)
				)
			)
		)

		this.$section.append(
			this.$form,
			this.runControl.$widget,
			this.$postForm
		)
	}

	clear() {
		this.$targetTextarea.value=''
		this.$redactedTextarea.value=''
		this.$skippedTextarea.value=''
	}

	updateElements() {
		this.$elementsList.replaceChildren()
		const osmAuth=this.currentOsmAuthProvider.currentOsmAuth
		if (!osmAuth) return

		let lineStartingCharIndex:number
		let lineEndingCharIndex=-1
		let errorState: {
			errorCount: number
			firstErrorLine: string
		} | undefined
		for (const untrimmedLine of this.$targetTextarea.value.split('\n')) {
			lineStartingCharIndex=lineEndingCharIndex+1
			lineEndingCharIndex=lineStartingCharIndex+untrimmedLine.length
			const line=untrimmedLine.trim()
			if (line=='') continue
			try {
				const elementVersion=getOsmElementVersionDataFromString(osmAuth.serverUrls,line)
				const evString=`${elementVersion.type[0]}${elementVersion.id}v${elementVersion.version}`
				const evPath=`${elementVersion.type}/${elementVersion.id}/history/${elementVersion.version}`
				if (!errorState) {
					const $a=makeLink(evString,osmAuth.webUrl(evPath))
					$a.tabIndex=-1
					this.$elementsList.append(
						makeElement('li')()(
							makeElement('code')()(
								$a
							)
						)
					)
				}
			} catch {
				if (!errorState) {
					errorState={
						errorCount: 0,
						firstErrorLine: line
					}
					this.$elementsList.replaceChildren()
				}
				errorState.errorCount++
				const selectionStart=lineStartingCharIndex
				const selectionEnd=lineEndingCharIndex
				const $a=makeElement('a')('error')(line)
				$a.href='#'+this.$targetTextarea.id
				$a.onclick=(ev)=>{
					ev.preventDefault()
					this.$targetTextarea.scrollIntoView({block:'nearest'})
					this.$targetTextarea.focus()
					this.$targetTextarea.setSelectionRange(selectionStart,selectionEnd)
				}
				this.$elementsList.append(
					makeElement('li')()(
						makeElement('code')()(
							$a
						)
					)
				)
			}
		}
		if (!errorState) {
			this.$targetTextarea.setCustomValidity('')
		} else if (errorState.errorCount==1) {
			this.$targetTextarea.setCustomValidity(`Please fix the element reference "${errorState.firstErrorLine}"`)
		} else if (errorState.errorCount==2) {
			this.$targetTextarea.setCustomValidity(`Please fix the element reference "${errorState.firstErrorLine}" and one other error`)
		} else {
			this.$targetTextarea.setCustomValidity(`Please fix the element reference "${errorState.firstErrorLine}" and ${errorState.errorCount-1} other errors`)
		}
	}
}
