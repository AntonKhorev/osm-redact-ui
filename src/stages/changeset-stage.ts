import ElementsStage from './elements-stage'
import RunControl from '../run-control'
import CurrentOsmAuthProvider from '../current-osm-auth-provider'
import { getOsmChangesetIdFromString } from '../osm-changeset-data'
import { OsmElementVersionData, isOsmElementVersionData, getOsmElementVersionDataFromDomElement } from '../osm-element-data'
import { OsmElementLowerVersionCollection } from '../osm-element-collection'
import { makeElement, makeDiv, makeLabel, makeLink } from '../html'
import { isObject, isArray } from '../types'

export default class ChangesetStage {
	protected readonly runControl=new RunControl

	private readonly $targetChangesetsTextarea=makeElement('textarea')()()
	protected readonly $runButton=makeElement('button')()(`Fetch target elements`)

	protected readonly $form=makeElement('form')('formatted')()

	private readonly $changesetSummaryTbody=makeElement('tbody')()()
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
		this.$targetChangesetsTextarea.name='target-changesets'
		this.$targetChangesetsTextarea.required=true
		this.$targetChangesetsTextarea.rows=5
	
		this.$section.hidden=true
	
		document.body.addEventListener('osmRedactUi:currentAuthUpdate',()=>{
			this.$section.hidden=!currentOsmAuthProvider.currentOsmAuth
		})

		this.$form.onsubmit=async(ev)=>{
			ev.preventDefault()
			const osmAuth=currentOsmAuthProvider.currentOsmAuth
			if (!osmAuth) return
			this.clear()
			elementsStage.clear()
			const abortSignal=this.runControl.enter(this.$runButton)
			const osmApi=osmAuth.connectToOsmApi(this.runControl.logger,abortSignal)
			try {
				const startingVersions=new OsmElementLowerVersionCollection
				for (const untrimmedLine of this.$targetChangesetsTextarea.value.split('\n')) {
					const line=untrimmedLine.trim()
					if (line=='') continue
					const changesetId=getOsmChangesetIdFromString(osmAuth.serverUrls,line)

					let expectedChangesCount: number
					let username: string|undefined
					let comment: string|undefined
					{
						const response=await osmApi.get(
							`changeset/${encodeURIComponent(changesetId)}.json`
						)
						if (!response.ok) throw new TypeError(`Failed to fetch metadata of changeset #${changesetId}`)
						const json=await response.json()
						expectedChangesCount=getChangesCountFromChangesetMetadataResponseJson(json)
						username=getUsernameFromChangesetMetadataResponseJson(json)
						comment=getCommentFromChangesetMetadataResponseJson(json)
					}

					let downloadedChangesCount=0
					{
						const response=await osmApi.get(
							`changeset/${encodeURIComponent(changesetId)}/download?show_redactions=true`
						)
						if (!response.ok) throw new TypeError(`Failed to fetch changeset changes`)
						const text=await response.text()
						const doc=new DOMParser().parseFromString(text,`text/xml`)
						for (const $element of doc.querySelectorAll('node, way, relation')) {
							downloadedChangesCount++
							const ev=getOsmElementVersionDataFromDomElement($element)
							startingVersions.add(ev)
						}
					}

					this.$changesetSummaryTbody.append(
						makeElement('tr')()(
							makeElement('td')('number')(
								makeLink(`#${changesetId}`,osmAuth.webUrl(`changeset/${encodeURIComponent(changesetId)}`))
							),
							makeElement('td')('number')(
								String(expectedChangesCount)
							),
							makeElement('td')('number')(
								String(downloadedChangesCount)
							),
							makeElement('td')()(
								username ? makeLink(username,osmAuth.webUrl(`user/${encodeURIComponent(username)}`)) : ''
							),
							makeElement('td')()(
								comment ? makeElement('q')()(comment) : ''
							)
						)
					)

					if (expectedChangesCount!=downloadedChangesCount) throw new TypeError(`Got missing elements in changeset #${changesetId} data`)
				}

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
				let targetElements=''
				let evCount=0
				for (const ev of startingVersions.listElementVersionsBefore(topVersions)) {
					targetElements+=`${ev.type}/${ev.id}/${ev.version}\n`
					evCount++
				}
				elementsStage.$targetTextarea.value=targetElements
				elementsStage.updateElements()
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
					`Changeset ids or URLs to redact `, this.$targetChangesetsTextarea
				),
				makeElement('small')()(
					`One id/URL per line`
				)
			),
			makeDiv('input-group')(
				this.$runButton
			)
		)

		const alter=<T>($e:T,fn:($e:T)=>void)=>{
			fn($e)
			return $e
		}
		const colSpan2=($e:HTMLTableCellElement)=>alter($e,($e)=>$e.colSpan=2)
		const rowSpan2=($e:HTMLTableCellElement)=>alter($e,($e)=>$e.rowSpan=2)

		this.$section.append(
			this.$form,
			this.runControl.$widget,
			makeElement('table')()(
				makeElement('caption')()(`Scanned changesets`),
				makeElement('thead')()(
					makeElement('tr')()(
						rowSpan2(makeElement('th')()(`changeset`)),
						colSpan2(makeElement('th')()(`changes`)),
						rowSpan2(makeElement('th')()(`user`)),
						rowSpan2(makeElement('th')()(`comment`))
					),
					makeElement('tr')()(
						makeElement('th')()(`expected`),
						makeElement('th')()(`downloaded`),
					)
				),
				this.$changesetSummaryTbody
			),
			makeDiv('output-group')(
				`Number of element versions to redact: `,this.$elementVersionsToRedactCountOutput
			)
		)
	}

	clear() {
		this.$changesetSummaryTbody.replaceChildren()
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
