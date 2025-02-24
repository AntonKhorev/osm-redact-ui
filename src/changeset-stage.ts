import ElementsStage from './elements-stage'
import RunControl from './run-control'
import AbortManager from './abort-manager'
import OsmApi from './osm-api'
import type { OsmElementType } from './osm-element-collection'
import { isOsmElementType, OsmElementLowerVersionCollection } from './osm-element-collection'
import { makeElement, makeDiv, makeLabel } from './html'
import { isObject, isArray, toPositiveInteger } from './types'

export default class ChangesetStage {
	$section=makeElement('section')()(
		makeElement('h2')()(`Enter initial information`)
	)

	constructor(abortManager: AbortManager, elementsStage: ElementsStage) {
		const $osmApiRootInput=makeElement('input')()()
		$osmApiRootInput.name='osm-api-root'
		$osmApiRootInput.required=true
		$osmApiRootInput.value=`http://127.0.0.1:3000/`
	
		const $tokenInput=makeElement('input')()()
		$tokenInput.name='auth-token'
		// $tokenInput.required=true
	
		const $redactedChangesetInput=makeElement('input')()()
		$redactedChangesetInput.name='redacted-changeset'
		$redactedChangesetInput.required=true
	
		const runControl=new RunControl(
			`Fetch target elements`,
			`Abort fetching target elements`,
			`Fetch log`
		)
		abortManager.addRunControl(runControl)
	
		const $form=makeElement('form')()(
			makeDiv('input-group')(
				makeLabel()(
					`OSM API url`, $osmApiRootInput
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Auth token`, $tokenInput
				)
			),
			makeDiv('input-group')(
				makeLabel()(
					`Redacted changeset`, $redactedChangesetInput
				)
			),
			runControl.$widget
		)

		$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			runControl.logger.clear()
			elementsStage.clear()
			const abortSignal=abortManager.enterStage(runControl)
			const osmApi=new OsmApi($osmApiRootInput.value,$tokenInput.value,runControl.logger,abortSignal)
			try {
				let expectedChangesCount: number
				{
					const response=await osmApi.get(
						`changeset/${encodeURIComponent($redactedChangesetInput.value)}.json`
					)
					if (!response.ok) throw new TypeError(`failed to fetch changeset metadata`)
					const json=await response.json()
					expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
				}
				elementsStage.$expectedChangesCountOutput.value=String(expectedChangesCount)
	
				let downloadedChangesCount=0
				const startingVersions=new OsmElementLowerVersionCollection
				{
					const response=await osmApi.get(
						`changeset/${encodeURIComponent($redactedChangesetInput.value)}/download?show_redactions=true`
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
					elementsStage.$downloadedChangesCountOutput.value=String(downloadedChangesCount)
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
				elementsStage.setReadyState($osmApiRootInput.value,$tokenInput.value)
			} catch (ex) {
				console.log(ex)
			}
			abortManager.exitStage()
		}

		this.$section.append($form)
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
