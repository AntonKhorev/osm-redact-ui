import ElementsStage from './elements-stage'
import RunControl from '../run-control'
import RunLogger from '../run-logger'
import AbortManager from '../abort-manager'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import type { OsmElementType } from '../osm-element-collection'
import { isOsmElementType, OsmElementLowerVersionCollection } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel } from '../html'
import { isObject, isArray, toPositiveInteger } from '../types'

export default class ChangesetStage {
	private readonly runControl=new RunControl(
		`Fetch target elements`,
		`Abort fetching target elements`
	)
	private readonly runLogger=new RunLogger(`Fetch log`)

	private readonly $redactedChangesetInput=makeElement('input')()()
	protected readonly $form=makeElement('form')('formatted')()

	private readonly $expectedChangesCountOutput=makeElement('output')()()
	private readonly $downloadedChangesCountOutput=makeElement('output')()()

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Target changeset`)
	)

	constructor(abortManager: AbortManager, currentOsmAuthProvider: CurrentOsmAuthProvider, elementsStage: ElementsStage) {
		this.$redactedChangesetInput.name='redacted-changeset'
		this.$redactedChangesetInput.required=true
	
		this.runControl.$widget.hidden=true
		abortManager.addRunControl(this.runControl)
	
		document.body.addEventListener('osmRedactUi:currentAuthUpdate',()=>{
			this.runControl.$widget.hidden=!currentOsmAuthProvider.currentOsmAuth
		})

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			if (!currentOsmAuthProvider.currentOsmAuth) return
			this.runLogger.clear()
			elementsStage.clear()
			const abortSignal=abortManager.enterStage(this.runControl)
			const osmApi=currentOsmAuthProvider.currentOsmAuth.connectToOsmApi(this.runLogger,abortSignal)
			try {
				const changesetIdString=this.$redactedChangesetInput.value.trim()

				let expectedChangesCount: number
				{
					const response=await osmApi.get(
						`changeset/${encodeURIComponent(changesetIdString)}.json`
					)
					if (!response.ok) throw new TypeError(`failed to fetch changeset metadata`)
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
					if (!response.ok) throw new TypeError(`failed to fetch changeset changes`)
					const text=await response.text()
					const doc=new DOMParser().parseFromString(text,`text/xml`)
					for (const $element of doc.querySelectorAll('node, way, relation')) {
						downloadedChangesCount++
						const type=$element.localName
						if (!isOsmElementType(type)) throw new TypeError(`encountered invalid element type`)
						const id=toPositiveInteger($element.id)
						const version=toPositiveInteger($element.getAttribute('version'))
						startingVersions.add(type,id,version)
					}
					this.$downloadedChangesCountOutput.value=String(downloadedChangesCount)
				}
				if (expectedChangesCount!=downloadedChangesCount) throw new TypeError(`got missing elements in changeset changes`)
	
				const topVersions=new OsmElementLowerVersionCollection
				{
					for (const query of startingVersions.listMultiFetchBatches()) {
						const response=await osmApi.get(
							query
						)
						if (!response.ok) throw new TypeError(`failed to fetch top element versions`)
						const json=await response.json()
						for (const [type,id,version] of listElementTypesIdsAndVersionsFromElementsResponseJson(json)) {
							topVersions.add(type,id,version)
						}
					}
				}
				for (const [type,id,version] of startingVersions.listElementTypesIdsAndVersionsBefore(topVersions)) {
					elementsStage.$targetTextarea.value+=`${type}/${id}/${version}\n`
				}
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}
	}

	start() {
		this.$form.append(
			makeDiv('input-group')(
				makeLabel()(
					`Changeset id to redact`, this.$redactedChangesetInput
				)
			),
			this.runControl.$widget
		)

		this.$section.append(
			this.$form,
			this.runLogger.$widget,
			makeDiv('output-group')(
				`Expected changes count: `,this.$expectedChangesCountOutput
			),
			makeDiv('output-group')(
				`Downloaded changes count: `,this.$downloadedChangesCountOutput
			),
		)
	}

	clear() {
		this.runLogger.clear()
		this.$expectedChangesCountOutput.value=''
		this.$downloadedChangesCountOutput.value=''
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
