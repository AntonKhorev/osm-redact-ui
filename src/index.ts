import AuthLanding from './auth-landing'
import AuthTypeSelectStage from './stages/auth-type-select-stage'
import AuthSkipStage from './stages/auth-skip-stage'
import AuthTokenStage from './stages/auth-token-stage'
import AuthManualGrantStage from './stages/auth-manual-grant-stage'
import AuthAutoGrantStage from './stages/auth-auto-grant-stage'
import ConnectionShowStage from './stages/connection-show-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'
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
	const authManualGrantStage=new AuthManualGrantStage(abortManager,connectionShowStage,popupWindowOpener)
	const authAutoGrantStage=new AuthAutoGrantStage(abortManager,connectionShowStage,popupWindowOpener,authLanding)

	const authTypeSelectStage=new AuthTypeSelectStage([
		[`skipped`,'skip',authSkipStage],
		[`by entering an existing token`,'token',authTokenStage],
		[`by manually copying a code`,'code',authManualGrantStage],
		[`automatic`,'auto',authAutoGrantStage]
	])

	authTypeSelectStage.render()
	authSkipStage.render()
	authTokenStage.render()
	authManualGrantStage.render()
	authAutoGrantStage.render()
	connectionShowStage.render()
	changesetStage.render()
	elementsStage.render()

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		authTypeSelectStage.$section,
		authSkipStage.$section,
		authTokenStage.$section,
		authManualGrantStage.$section,
		authAutoGrantStage.$section,
		connectionShowStage.$section,
		changesetStage.$section,
		elementsStage.$section
	)
}
