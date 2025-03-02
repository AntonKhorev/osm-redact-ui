import ElementsStage from './elements-stage'
import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import { OsmElementVersionData, isOsmElementVersionData, getOsmElementVersionDataFromDomElement } from '../osm-element-data'
import { OsmElementLowerVersionCollection } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel, makeLink } from '../html'
import { isObject, isArray } from '../types'

export default class ChangesetStage {
	protected readonly runControl=new RunControl

	private readonly $redactedChangesetInput=makeElement('input')()()
	protected readonly $runButton=makeElement('button')()(`Fetch target elements`)

	protected readonly $form=makeElement('form')('formatted')()

	private readonly $changesetOverviewSlot=makeElement('span')()()
	private readonly $expectedChangesCountOutput=makeElement('output')()()
	private readonly $downloadedChangesCountOutput=makeElement('output')()()
	private readonly $elementVersionsToRedactCountOutput=makeElement('output')()()

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Target changeset`),
		makeElement('p')('hint')(
			makeElement('small')()(
				`Assumes that the offending changes contained in this changeset are already reverted. `+
				`Collects all element versions from this changeset and their later versions up to but not including the current ones. `+
				`Copies the collected element versions to `,makeElement('em')()(`target elements`),` below.`
			)
		)
	)

	constructor(currentOsmAuthProvider: CurrentOsmAuthProvider, elementsStage: ElementsStage) {
		this.$redactedChangesetInput.name='redacted-changeset'
		this.$redactedChangesetInput.required=true
	
		this.$section.hidden=true
	
		document.body.addEventListener('osmRedactUi:currentAuthUpdate',()=>{
			this.$section.hidden=!currentOsmAuthProvider.currentOsmAuth
		})

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			if (!currentOsmAuthProvider.currentOsmAuth) return
			const osmAuth=currentOsmAuthProvider.currentOsmAuth
			this.clear()
			elementsStage.clear()
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=osmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
				const changesetIdString=this.$redactedChangesetInput.value.trim()
				const changesetRef=`changeset/${encodeURIComponent(changesetIdString)}`
				this.$changesetOverviewSlot.append(
					makeLink(`#${changesetIdString}`,osmAuth.webUrl(changesetRef))
				)

				let expectedChangesCount: number
				{
					const response=await osmApi.get(
						`${changesetRef}.json`
					)
					if (!response.ok) throw new TypeError(`Failed to fetch changeset metadata`)
					const json=await response.json()
					expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
					const comment=getCommentFromChangesetMetadataResponseJson(json)
					if (comment) {
						this.$changesetOverviewSlot.append(
							` `,makeElement('q')()(comment)
						)
					}
					const username=getUsernameFromChangesetMetadataResponseJson(json)
					if (username) {
						this.$changesetOverviewSlot.append(
							` by `,makeLink(username,osmAuth.webUrl(`user/${encodeURIComponent(username)}`))
						)
					}
				}
				this.$expectedChangesCountOutput.value=String(expectedChangesCount)
	
				let downloadedChangesCount=0
				const startingVersions=new OsmElementLowerVersionCollection
				{
					const response=await osmApi.get(
						`changeset/${encodeURIComponent(changesetIdString)}/download?show_redactions=true`
					)
					if (!response.ok) throw new TypeError(`Failed to fetch changeset changes`)
					const text=await response.text()
					const doc=new DOMParser().parseFromString(text,`text/xml`)
					for (const $element of doc.querySelectorAll('node, way, relation')) {
						downloadedChangesCount++
						const ev=getOsmElementVersionDataFromDomElement($element)
						startingVersions.add(ev)
					}
					this.$downloadedChangesCountOutput.value=String(downloadedChangesCount)
				}
				if (expectedChangesCount!=downloadedChangesCount) throw new TypeError(`Got missing elements in changeset changes`)
	
				const topVersions=new OsmElementLowerVersionCollection
				{
					for (const query of startingVersions.listMultiFetchBatches()) {
						const response=await osmApi.get(
							query
						)
						if (!response.ok) throw new TypeError(`Failed to fetch top element versions`)
						const json=await response.json()
						for (const ev of listElementTypesIdsAndVersionsFromElementsResponseJson(json)) {
							topVersions.add(ev)
						}
					}
				}
				let evCount=0
				for (const ev of startingVersions.listElementVersionsBefore(topVersions)) {
					elementsStage.$targetTextarea.value+=`${ev.type}/${ev.id}/${ev.version}\n`
					evCount++
				}
				this.$elementVersionsToRedactCountOutput.value=String(evCount)
				this.runControl.addMessage('success',(evCount>0
					? `Completed fetching element versions to redact`
					: `Completed with no element versions to redact`
				))
			} catch (ex) {
				this.runControl.handleException(ex)
			}
			this.runControl.exit()
		}
	}

	start() {
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`Changeset id to redact`, this.$redactedChangesetInput
				)
			),
			makeDiv('input-group')(
				this.$runButton
			)
		)

		this.$section.append(
			this.$form,
			this.runControl.$widget,
			makeDiv('output-group')(
				`Changeset: `,this.$changesetOverviewSlot
			),
			makeDiv('output-group')(
				`Expected changes count: `,this.$expectedChangesCountOutput
			),
			makeDiv('output-group')(
				`Downloaded changes count: `,this.$downloadedChangesCountOutput
			),
			makeDiv('output-group')(
				`Number of element versions to redact: `,this.$elementVersionsToRedactCountOutput
			)
		)
	}

	clear() {
		this.$changesetOverviewSlot.replaceChildren()
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
		this.$elementVersionsToRedactCountOutput.value=''
	}
}

function getChangesCountFromChangesetMetadataResponseJson(json: unknown): number {
	if (
		isObject(json) &&
		'changeset' in json && isObject(json.changeset) &&
		'changes_count' in json.changeset && typeof json.changeset.changes_count == 'number'
	) {
		return json.changeset.changes_count
	} else {
		throw new TypeError(`received invalid changeset metadata`)
	}
}

function getUsernameFromChangesetMetadataResponseJson(json: unknown): string | undefined {
	if (
		isObject(json) &&
		'changeset' in json && isObject(json.changeset) &&
		'user' in json.changeset && typeof json.changeset.user=='string'
	) {
		return json.changeset.user
	}
}

function getCommentFromChangesetMetadataResponseJson(json: unknown): string | undefined {
	if (
		isObject(json) &&
		'changeset' in json && isObject(json.changeset) &&
		'tags' in json.changeset && isObject(json.changeset.tags) &&
		'comment' in json.changeset.tags && typeof json.changeset.tags.comment == 'string'
	) {
		return json.changeset.tags.comment
	}
}

function *listElementTypesIdsAndVersionsFromElementsResponseJson(json: unknown): Generator<OsmElementVersionData> {
	if (
		isObject(json) && 'elements' in json &&
		isArray(json.elements)
	) {
		for (const element of json.elements) {
			if (isOsmElementVersionData(element)) {
				yield element
			} else {
				throw new TypeError(`received invalid element data`)
			}
		}
	} else {
		throw new TypeError(`received invalid elements data`)
	}
}
