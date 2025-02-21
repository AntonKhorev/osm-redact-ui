import ChangesetStage from './changeset-stage'
import ElementsStage from './elements-stage'
import { OsmApiManager } from './osm-api'
import { makeElement } from './html'

main()

function main(): void {
	const osmApiManager=new OsmApiManager
	
	const elementsStage=new ElementsStage(osmApiManager)
	const changesetStage=new ChangesetStage(osmApiManager, elementsStage)

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		changesetStage.$section,
		elementsStage.$section
	)
}
