import AuthTypeSelectStage from './auth/auth-type-select-stage'

import AuthNewStage from './auth/new/auth-new-stage'
import AuthNewAnonymousStage from './auth/new/auth-new-anonymous-stage'
import AuthNewTokenStage from './auth/new/auth-new-token-stage'
import AuthNewManualGrantStage from './auth/new/auth-new-manual-grant-stage'
import AuthNewAutoGrantStage from './auth/new/auth-new-auto-grant-stage'
import InputOsmUrlProvider from './auth/new/input-osm-url-provider'
import FixedOsmUrlProvider from './auth/new/fixed-osm-url-provider'
import InputOsmClientIdProvider from './auth/new/input-osm-client-id-provider'
import FixedOsmClientIdProvider from './auth/new/fixed-osm-client-id-provider'

import AuthShowStage from './auth/auth-show-stage'

import OsmAuthManager from '../osm-auth-manager'
import AbortManager from '../abort-manager'
import PopupWindowOpener from '../popup-window-opener'
import AuthLanding from '../auth-landing'
import { makeElement, makeLink } from '../html'

export default class AuthStage {
	private readonly authShowStage: AuthShowStage
	private readonly authNewStages: AuthNewStage[] = []
	private readonly authTypeSelectStage: AuthTypeSelectStage

	private $summary=makeElement('summary')()()
	private readonly $details=makeElement('details')()(
		this.$summary
	)

	readonly $section=makeElement('section')()(
		makeElement('h2')()(`Authorization`),
		this.$details
	)

	constructor(osmAuthManager: OsmAuthManager, abortManager: AbortManager, popupWindowOpener: PopupWindowOpener, authLanding: AuthLanding) {
		this.authShowStage=new AuthShowStage(osmAuthManager)

		const isFileProtocol=location.protocol=='file:'
		this.authNewStages.push(
			new (isFileProtocol?AuthNewManualGrantStage:AuthNewAutoGrantStage)(
				`Authorization on dev server`,'https://master.apis.dev.openstreetmap.org/',
				new FixedOsmUrlProvider('https://master.apis.dev.openstreetmap.org/'),
				(authLanding.url=='https://antonkhorev.github.io/osm-redact-ui/'
					? new FixedOsmClientIdProvider('2pHyb08qEaiSM4x4qUmaAkoJg5v6QL-VMLfrFofNoJY')
					: new InputOsmClientIdProvider
				),
				abortManager,popupWindowOpener,authLanding
			)
		)
		if (!isFileProtocol) this.authNewStages.push(
			new AuthNewAutoGrantStage(
				`Automatic authorization`,'auto',
				new InputOsmUrlProvider,
				new InputOsmClientIdProvider,
				abortManager,popupWindowOpener,authLanding
			)
		)
		this.authNewStages.push(
			new AuthNewManualGrantStage(
				`Authorization by manually copying a code`,'code',
				new InputOsmUrlProvider,
				new InputOsmClientIdProvider,
				abortManager,popupWindowOpener
			),new AuthNewTokenStage(
				`Authorization by entering an existing token`,'token',
				new InputOsmUrlProvider,
				abortManager
			),
			new AuthNewAnonymousStage(
				`Anonymous authorization`,'anonymous',
				new InputOsmUrlProvider,
				abortManager
			)
		)

		this.authTypeSelectStage=new AuthTypeSelectStage(this.authNewStages)

		this.$details.open=!osmAuthManager.currentData
		const updateSummary=()=>{
			const osmAuthData=osmAuthManager.currentData
			if (osmAuthData && osmAuthData.user) {
				this.$summary.replaceChildren(
					`Currently authorized on `,
					makeLink(osmAuthData.webRoot,osmAuthData.webRoot),
					` as `,
					makeLink(osmAuthData.user.name,`${osmAuthData.webRoot}user/${encodeURIComponent(osmAuthData.user.name)}`),
				)
			} else if (osmAuthData) {
				this.$summary.replaceChildren(
					`Currently accessing `,
					makeLink(osmAuthData.webRoot,osmAuthData.webRoot),
					`anonymously`
				)
			} else {
				this.$summary.replaceChildren(
					`Currently not accessing any server`
				)
			}
		}
		updateSummary()
		document.body.addEventListener('osmRedactUi:currentAuthUpdate',updateSummary)
	}

	start(): void {
		this.$details.append(
			this.authTypeSelectStage.$section,
			...this.authNewStages.map(stage=>stage.$section),
			this.authShowStage.$section,
		)

		this.authTypeSelectStage.start()
		for (const stage of this.authNewStages) {
			stage.start()
		}
		this.authShowStage.start()
	}
}
