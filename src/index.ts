import AuthorizeStage from './authorize-stage'
import ChangesetStage from './changeset-stage'
import ElementsStage from './elements-stage'
import AbortManager from './abort-manager'
import { makeElement } from './html'

main()

function main(): void {
	const abortManager=new AbortManager
	
	const authorizeStage=new AuthorizeStage(abortManager)
	const elementsStage=new ElementsStage(abortManager)
	const changesetStage=new ChangesetStage(abortManager, elementsStage)

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		authorizeStage.$section,
		changesetStage.$section,
		elementsStage.$section
	)
}
