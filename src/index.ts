import RunControl from './run-control'
import { OsmApiManager } from './osm-api'
import type { OsmElementType } from './osm-element-colection'
import { isOsmElementType, OsmElementLowerVersionCollection } from './osm-element-colection'
import { makeElement, makeDiv, makeLabel } from './html'

main()

function main(): void {
	const $apiInput=makeElement('input')()()
	$apiInput.name='osm-api-root'
	$apiInput.required=true
	$apiInput.value=`http://127.0.0.1:3000/`

	const $tokenInput=makeElement('input')()()
	$tokenInput.name='auth-token'
	// $tokenInput.required=true

	const $redactedChangesetInput=makeElement('input')()()
	$redactedChangesetInput.name='redacted-changeset'
	$redactedChangesetInput.required=true

	const changesetRunControl=new RunControl(
		`Fetch target elements`,
		`Abort fetching target elements`,
		`Fetch log`
	)

	const $changesetForm=makeElement('form')()(
		makeDiv('input-group')(
			makeLabel()(
				`OSM API url`, $apiInput
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
		changesetRunControl.$widget
	)

	const $expectedChangesCountOutput=makeElement('output')()()
	const $downloadedChangesCountOutput=makeElement('output')()()

	const $elementsToRedactTextarea=makeElement('textarea')()()
	$elementsToRedactTextarea.rows=10
	$elementsToRedactTextarea.name='osm-elements-to-redact'
	
	const elementsRunControl=new RunControl(
		`Redact target elements`,
		`Abort redacting target elements`,
		`Redact log`
	)

	const $elementsForm=makeElement('form')()(
		makeDiv('output-group')(
			`Expected changes count: `,$expectedChangesCountOutput
		),
		makeDiv('output-group')(
			`Downloaded changes count: `,$downloadedChangesCountOutput
		),
		makeDiv('input-group')(
			makeLabel()(
				`Elements to redact`, $elementsToRedactTextarea
			)
		),
		elementsRunControl.$widget
	)
	
	const osmApiManager=new OsmApiManager([changesetRunControl,elementsRunControl])

	$changesetForm.onsubmit=async(ev)=>{
		ev.preventDefault()
		clearResults()
		const osmApiAccessor=osmApiManager.enterForm($apiInput.value,$tokenInput.value,changesetRunControl)
		try {
			let expectedChangesCount: number
			{
				const response=await osmApiAccessor.get(
					`changeset/${encodeURIComponent($redactedChangesetInput.value)}.json`
				)
				if (!response.ok) throw new TypeError(`failed to fetch changeset metadata`)
				const json=await response.json()
				expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
			}
			$expectedChangesCountOutput.value=String(expectedChangesCount)

			let downloadedChangesCount=0
			const startingVersions=new OsmElementLowerVersionCollection
			{
				const response=await osmApiAccessor.get(
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
				$downloadedChangesCountOutput.value=String(downloadedChangesCount)
			}
			if (expectedChangesCount!=downloadedChangesCount) throw new TypeError(`got missing elements in changeset changes`)

			const topVersions=new OsmElementLowerVersionCollection
			{
				for (const query of startingVersions.listMultiFetchBatches()) {
					const response=await osmApiAccessor.get(
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
				$elementsToRedactTextarea.value+=`${type}/${id}/${version}\n`
			}
		} catch (ex) {
			console.log(ex)
		}
		osmApiManager.exitForm()
	}

	$elementsForm.onsubmit=async(ev)=>{
		ev.preventDefault()
		const osmApiAccessor=osmApiManager.enterForm($apiInput.value,$tokenInput.value,elementsRunControl)
		try {
		} catch (ex) {
			console.log(ex)
		}
		// TODO: redact
		// TODO: post-check if top versions match
		osmApiManager.exitForm()
	}

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		makeElement('section')()(
			makeElement('h2')()(`Enter initial information`),
			$changesetForm
		),
		makeElement('section')()(
			makeElement('h2')()(`See target elements`),
			$elementsForm
		)
	)

	function clearResults(): void {
		changesetRunControl.logger.clear()
		elementsRunControl.logger.clear()
		$expectedChangesCountOutput.value=''
		$downloadedChangesCountOutput.value=''
		$elementsToRedactTextarea.value=''
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

function isObject(value: unknown): value is object {
	return !!(value && typeof value == 'object')
}

function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value)
}

function toPositiveInteger(s: unknown): number {
	if (typeof s != 'string') throw new TypeError(`received invalid number`)
	const n=parseInt(s,10)
	if (!(n>0)) throw new TypeError(`received invalid number`)
	return n
}
