import AuthStage from './stages/auth-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'

import PrefixedStorage from './prefixed-storage'
import AuthStorage from './auth-storage'

import AuthLanding from './auth-landing'
import OsmAuthManager from './osm-auth-manager'
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

	const authStage=new AuthStage(osmAuthManager,abortManager,popupWindowOpener,authLanding)
	const elementsStage=new ElementsStage(abortManager,osmAuthManager.currentProvider)
	const changesetStage=new ChangesetStage(abortManager,osmAuthManager.currentProvider,elementsStage)

	document.body.append(
		makeElement('main')()(
			makeElement('h1')()(`Changeset redaction UI`),
			authStage.$section,
			changesetStage.$section,
			elementsStage.$section
		)
	)

	authStage.start()
	changesetStage.start()
	elementsStage.start()
}
