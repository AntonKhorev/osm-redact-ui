import AuthStage from './stages/auth/auth-stage'
import AuthTypeSelectStage from './stages/auth/auth-type-select-stage'
import AuthAnonymousStage from './stages/auth/auth-anonymous-stage'
import AuthTokenStage from './stages/auth/auth-token-stage'
import AuthManualGrantStage from './stages/auth/auth-manual-grant-stage'
import AuthAutoGrantStage from './stages/auth/auth-auto-grant-stage'
import AuthShowStage from './stages/auth/auth-show-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'

import PrefixedStorage from './prefixed-storage'
import AuthStorage from './auth-storage'

import AuthLanding from './auth-landing'
import OsmAuthManager from './osm-auth-manager'
import InputOsmUrlProvider from './input-osm-url-provider'
import FixedOsmUrlProvider from './fixed-osm-url-provider'
import InputOsmClientIdProvider from './input-osm-client-id-provider'
import FixedOsmClientIdProvider from './fixed-osm-client-id-provider'
import PopupWindowOpener from './popup-window-opener'
import AbortManager from './abort-manager'
import { makeElement } from './html'

main()

function main(): void {
	const authLanding=new AuthLanding
	if (authLanding.land()) return

	const prefixedStorage=new PrefixedStorage(localStorage,'osmRedactUi:')

	const osmAuthManager=new OsmAuthManager(new AuthStorage(prefixedStorage))
	const popupWindowOpener=new PopupWindowOpener
	const abortManager=new AbortManager

	const elementsStage=new ElementsStage(abortManager,osmAuthManager.currentProvider)
	const changesetStage=new ChangesetStage(abortManager,osmAuthManager.currentProvider,elementsStage)
	const connectionShowStage=new AuthShowStage(osmAuthManager)

	const authStages: AuthStage[] = []
	const isFileProtocol=location.protocol=='file:'
	authStages.push(
		new (isFileProtocol?AuthManualGrantStage:AuthAutoGrantStage)(
			`Authorization on dev server`,'https://master.apis.dev.openstreetmap.org/',
			new FixedOsmUrlProvider('https://master.apis.dev.openstreetmap.org/'),
			(authLanding.url=='https://antonkhorev.github.io/osm-redact-ui/'
				? new FixedOsmClientIdProvider('2pHyb08qEaiSM4x4qUmaAkoJg5v6QL-VMLfrFofNoJY')
				: new InputOsmClientIdProvider
			),
			abortManager,popupWindowOpener,authLanding
		)
	)
	if (!isFileProtocol) authStages.push(
		new AuthAutoGrantStage(
			`Automatic authorization`,'auto',
			new InputOsmUrlProvider,
			new InputOsmClientIdProvider,
			abortManager,popupWindowOpener,authLanding
		)
	)
	authStages.push(
		new AuthManualGrantStage(
			`Authorization by manually copying a code`,'code',
			new InputOsmUrlProvider,
			new InputOsmClientIdProvider,
			abortManager,popupWindowOpener
		),new AuthTokenStage(
			`Authorization by entering an existing token`,'token',
			new InputOsmUrlProvider,
			abortManager
		),
		new AuthAnonymousStage(
			`Anonymous authorization`,'anonymous',
			new InputOsmUrlProvider,
			abortManager
		)
	)
	const authTypeSelectStage=new AuthTypeSelectStage(authStages)

	document.body.append(
		makeElement('main')()(
			makeElement('h1')()(`Changeset redaction UI`),
			authTypeSelectStage.$section,
			...authStages.map(stage=>stage.$section),
			connectionShowStage.$section,
			changesetStage.$section,
			elementsStage.$section
		)
	)

	authTypeSelectStage.start()
	for (const stage of authStages) {
		stage.start()
	}
	connectionShowStage.start()
	changesetStage.start()
	elementsStage.start()
}
