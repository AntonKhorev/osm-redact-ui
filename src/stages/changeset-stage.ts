import ElementsStage from './elements-stage'
import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import type { OsmElementType } from '../osm-element-collection'
import { isOsmElementType, OsmElementLowerVersionCollection } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel } from '../html'
import { isObject, isArray, toPositiveInteger } from '../types'

export default class ChangesetStage {
	protected readonly runControl=new RunControl

	private readonly $redactedChangesetInput=makeElement('input')()()
	protected readonly $runButton=makeElement('button')()(`Fetch target elements`)

	protected readonly $form=makeElement('form')('formatted')()

	private readonly $expectedChangesCountOutput=makeElement('output')()()
	private readonly $downloadedChangesCountOutput=makeElement('output')()()
	private readonly $elementVersionsToRedactCountOutput=makeElement('output')()()

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Target changeset`),
		makeElement('p')('hint')(
			`Assumes that the changeset is already reverted. `+
			`Collects all element versions from this changeset and their later versions up to but not including the current ones. `+
			`Copies the collected element versions to `,makeElement('em')()(`target elements`),` below.`
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
			this.clear()
			elementsStage.clear()
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=currentOsmAuthProvider.currentOsmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
				const changesetIdString=this.$redactedChangesetInput.value.trim()

				let expectedChangesCount: number
				{
					const response=await osmApi.get(
						`changeset/${encodeURIComponent(changesetIdString)}.json`
					)
					if (!response.ok) throw new TypeError(`Failed to fetch changeset metadata`)
					const json=await response.json()
					expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
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
						const type=$element.localName
						if (!isOsmElementType(type)) throw new TypeError(`Encountered invalid element type`)
						const id=toPositiveInteger($element.id)
						const version=toPositiveInteger($element.getAttribute('version'))
						startingVersions.add(type,id,version)
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
						for (const [type,id,version] of listElementTypesIdsAndVersionsFromElementsResponseJson(json)) {
							topVersions.add(type,id,version)
						}
					}
				}
				let evCount=0
				for (const [type,id,version] of startingVersions.listElementTypesIdsAndVersionsBefore(topVersions)) {
					elementsStage.$targetTextarea.value+=`${type}/${id}/${version}\n`
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
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
		this.$elementVersionsToRedactCountOutput.value=''
	}
}

function getChangesCountFromChangesetMetadataResponseJson(json: unknown): number {
	if (
		isObject(json) && 'changeset' in json &&
		isObject(json.changeset) && 'changes_count' in json.changeset &&
		typeof json.changeset.changes_count == 'number'
	) {
		return json.changeset.changes_count
	} else {
		throw new TypeError(`received invalid changeset metadata`)
	}
}

function *listElementTypesIdsAndVersionsFromElementsResponseJson(json: unknown): Generator<[OsmElementType,number,number]> {
	if (
		isObject(json) && 'elements' in json &&
		isArray(json.elements)
	) {
		for (const element of json.elements) {
			if (
				isObject(element) &&
				'type' in element && isOsmElementType(element.type) &&
				'id' in element && typeof element.id == 'number' &&
				'version' in element && typeof element.version == 'number'
			) {
				yield [element.type,element.id,element.version]
			} else {
				throw new TypeError(`received invalid element data`)
			}
		}
	} else {
		throw new TypeError(`received invalid elements data`)
	}
}
