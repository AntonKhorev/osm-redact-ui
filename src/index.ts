import AuthLanding from './auth-landing'
import AuthTypeSelectStage from './auth-type-select-stage'
import AuthSkipStage from './auth-skip-stage'
import AuthTokenStage from './auth-token-stage'
import AuthCodeStage from './auth-code-stage'
import AuthAutoStage from './auth-auto-stage'
import ConnectionShowStage from './connection-show-stage'
import ChangesetStage from './changeset-stage'
import ElementsStage from './elements-stage'
import PopupWindowOpener from './popup-window-opener'
import AbortManager from './abort-manager'
import { makeElement } from './html'

main()

function main(): void {
	const authLanding=new AuthLanding
	if (authLanding.land()) return

	const popupWindowOpener=new PopupWindowOpener
	const abortManager=new AbortManager

	const elementsStage=new ElementsStage(abortManager)
	const changesetStage=new ChangesetStage(abortManager,elementsStage)
	const connectionShowStage=new ConnectionShowStage(changesetStage)
	const authSkipStage=new AuthSkipStage(abortManager,connectionShowStage)
	const authTokenStage=new AuthTokenStage(abortManager,connectionShowStage)
	const authCodeStage=new AuthCodeStage(abortManager,connectionShowStage,popupWindowOpener)
	const authAutoStage=new AuthAutoStage(abortManager,connectionShowStage,popupWindowOpener,authLanding)
	const authTypeSelectStage=new AuthTypeSelectStage(authSkipStage,authTokenStage,authCodeStage,authAutoStage)

	authTypeSelectStage.render()
	authSkipStage.render()
	authTokenStage.render()
	authCodeStage.render()
	authAutoStage.render()
	connectionShowStage.render()
	changesetStage.render()
	elementsStage.render()

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		authTypeSelectStage.$section,
		authSkipStage.$section,
		authTokenStage.$section,
		authCodeStage.$section,
		authAutoStage.$section,
		connectionShowStage.$section,
		changesetStage.$section,
		elementsStage.$section
	)
}
