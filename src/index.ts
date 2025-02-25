import AuthStage from './stages/auth-stage'
import AuthTypeSelectStage from './stages/auth-type-select-stage'
import AuthSkipStage from './stages/auth-skip-stage'
import AuthTokenStage from './stages/auth-token-stage'
import AuthManualGrantStage from './stages/auth-manual-grant-stage'
import AuthAutoGrantStage from './stages/auth-auto-grant-stage'
import ConnectionShowStage from './stages/connection-show-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'

import AuthLanding from './auth-landing'
import InputOsmUrlProvider from './input-osm-url-provider'
import FixedOsmUrlProvider from './fixed-osm-url-provider'
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

	const authStageSpecs: [text: string, value: string, stage: AuthStage][] = []
	const isFileProtocol=location.protocol=='file:'
	authStageSpecs.push([
		`dev server`,'dev',new (isFileProtocol?AuthManualGrantStage:AuthAutoGrantStage)(
			new FixedOsmUrlProvider('https://master.apis.dev.openstreetmap.org/'),
			abortManager,connectionShowStage,popupWindowOpener,authLanding
		)
	])
	if (!isFileProtocol) authStageSpecs.push([
		`automatic`,'auto',new AuthAutoGrantStage(
			new InputOsmUrlProvider,
			abortManager,connectionShowStage,popupWindowOpener,authLanding
		)
	])
	authStageSpecs.push([
		`by manually copying a code`,'code',new AuthManualGrantStage(
			new InputOsmUrlProvider,
			abortManager,connectionShowStage,popupWindowOpener
		)
	],[
		`by entering an existing token`,'token',new AuthTokenStage(
			new InputOsmUrlProvider,
			abortManager,connectionShowStage
		)
	],[
		`skipped`,'skip',new AuthSkipStage(
			new InputOsmUrlProvider,
			abortManager,connectionShowStage
		)
	])
	const authTypeSelectStage=new AuthTypeSelectStage(authStageSpecs)

	authTypeSelectStage.render()
	for (const [text,value,stage] of authStageSpecs) {
		stage.render()
	}
	connectionShowStage.render()
	changesetStage.render()
	elementsStage.render()

	document.body.append(
		makeElement('h1')()(`Redact changeset`),
		authTypeSelectStage.$section,
		...authStageSpecs.map(([text,value,stage])=>stage.$section),
		connectionShowStage.$section,
		changesetStage.$section,
		elementsStage.$section
	)
}
