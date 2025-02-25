import AuthTypeSelectStage from './auth-type-select-stage'
import AuthSkipStage from './auth-skip-stage'
import AuthTokenStage from './auth-token-stage'
import AuthCodeStage from './auth-code-stage'
import ConnectionShowStage from './connection-show-stage'
import ChangesetStage from './changeset-stage'
import ElementsStage from './elements-stage'
import AbortManager from './abort-manager'
import { makeElement } from './html'

main()

function main(): void {
	const abortManager=new AbortManager

	const elementsStage=new ElementsStage(abortManager)
	const changesetStage=new ChangesetStage(abortManager,elementsStage)
	const connectionShowStage=new ConnectionShowStage(changesetStage)
	const authSkipStage=new AuthSkipStage(abortManager,connectionShowStage)
	const authTokenStage=new AuthTokenStage(abortManager,connectionShowStage)
	const authCodeStage=new AuthCodeStage(abortManager,connectionShowStage)
	const authTypeSelectStage=new AuthTypeSelectStage(authSkipStage,authTokenStage,authCodeStage)

	authTypeSelectStage.render()
	authSkipStage.render()
	authTokenStage.render()
	authCodeStage.render()
	connectionShowStage.render()
	changesetStage.render()
	elementsStage.render()

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		authTypeSelectStage.$section,
		authSkipStage.$section,
		authTokenStage.$section,
		authCodeStage.$section,
		connectionShowStage.$section,
		changesetStage.$section,
		elementsStage.$section
	)
}
