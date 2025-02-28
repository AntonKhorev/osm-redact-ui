import AuthStage from './stages/auth-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'

import PrefixedStorage from './prefixed-storage'
import AuthStorage from './auth-storage'

import AuthLanding from './auth-landing'
import OsmAuthManager from './osm-auth-manager'
import PopupWindowOpener from './popup-window-opener'

import { makeElement } from './html'

main()

function main(): void {
	const authLanding=new AuthLanding
	if (authLanding.land()) return

	const prefixedStorage=new PrefixedStorage(localStorage,'osmRedactUi:')

	const osmAuthManager=new OsmAuthManager(new AuthStorage(prefixedStorage))
	const popupWindowOpener=new PopupWindowOpener

	const authStage=new AuthStage(osmAuthManager,popupWindowOpener,authLanding)
	const elementsStage=new ElementsStage(osmAuthManager.currentProvider)
	const changesetStage=new ChangesetStage(osmAuthManager.currentProvider,elementsStage)

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
