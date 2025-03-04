import AuthStage from './stages/auth-stage'
import ChangesetStage from './stages/changeset-stage'
import ElementsStage from './stages/elements-stage'

import PrefixedStorage from './prefixed-storage'
import AuthStorage from './auth-storage'

import AuthLanding from './auth-landing'
import OsmAuthManager from './osm-auth-manager'
import PopupWindowOpener from './popup-window-opener'

import { makeElement, makeDiv, makeLink } from './html'

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

	const em=makeElement('em')()

	document.body.append(
		makeElement('main')()(
			makeElement('h1')()(`Changeset redaction UI`),
			makeDiv('source-code')(
				makeElement('small')()(
					makeLink(`source code`,`https://github.com/AntonKhorev/osm-redact-ui`)
				)
			),
			makeElement('details')()(
				makeElement('summary')()(
					`How to use`
				),
				makeElement('ol')()(
					makeElement('li')()(
						`Find changesets with offending data`
					),
					makeElement('li')()(
						`Before using this tool, revert the changesets or delete the offending data by any other means`
					),
					makeElement('li')()(
						`In this tool, enter the changesets into `,em(`Changeset ids or URLs to redact`)
					),
					makeElement('li')()(
						`Click `,em(`Fetch target elements`)
					),
					makeElement('li')()(
						`If there are no errors, review the changesets in the `,em(`Scanned changesets`),` table`
					),
					makeElement('li')()(
						`Review the element versions to be redacted in the `,em(`Target elements`),` section`
					),
					makeElement('li')()(
						`Enter `,em(`Redaction id or URL`),`, possibly by visiting the redactions page using the link below the input`
					),
					makeElement('li')()(
						`Click `,em(`Redact targets`)
					)
				),
				makeElement('p')()(
					`This workflow redacts every target element version up to (but not including) the current version and may not be suitable for elements that had the offending data removed long ago. `+
					`Such elements are likely to have clean versions after the removal. `+
					`These versions don't need to be redacted, but this tool doesn't have the capabilities to detect that at the moment. `+
					`You can try removing clean versions from `,em(`Element versions to redact`),` manually.`
				)
			),
			authStage.$section,
			changesetStage.$section,
			elementsStage.$section
		)
	)

	authStage.start()
	changesetStage.start()
	elementsStage.start()
}
