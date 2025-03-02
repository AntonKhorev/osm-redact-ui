import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import { getOsmElementVersionDataFromString } from '../osm-element-data'
import { makeElement, makeDiv, makeLabel, makeLink } from '../html'

export default class ElementsStage {
	private readonly runControl=new RunControl

	readonly $targetTextarea=makeElement('textarea')()()
	private readonly $redactionInput=makeElement('input')()()
	private readonly $redactionsList=makeDiv()()
	protected readonly $runButton=makeElement('button')()(`Redact target elements`)

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

	constructor(currentOsmAuthProvider: CurrentOsmAuthProvider) {
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

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			const osmAuth=currentOsmAuthProvider.currentOsmAuth
			if (!osmAuth) return
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=osmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
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
								`${redactedElementVersionString}/redaction?redaction=${encodeURIComponent(this.$redactionInput.value)}`
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
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`Element versions to redact `,this.$targetTextarea
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Redaction id `,this.$redactionInput
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
}
