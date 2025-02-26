import ChangesetStage from './changeset-stage'
import { OsmAuthData } from '../osm-auth-data'
import { makeElement, makeLink } from '../html'

export default class AuthShowStage {
	private $notConnectedMessage=makeElement('p')()(`No current authorization`)
	private $authTable=makeElement('table')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`See current server and authorization`)
	)

	constructor(
		private changesetStage: ChangesetStage
	) {
		this.$authTable.hidden=true
	}

	render() {
		this.$section.append(
			this.$notConnectedMessage,
			this.$authTable
		)
	}

	setReadyState(osmConnection: OsmAuthData) {
		this.$notConnectedMessage.hidden=true
		this.$authTable.hidden=false

		this.$authTable.replaceChildren(
			makeElement('tr')()(
				makeElement('th')()(`server`),
				makeElement('th')()(`user`),
				makeElement('th')()(`mod?`)
			),
			makeElement('tr')()(
				makeElement('td')()(
					makeLink(osmConnection.webRoot,osmConnection.webRoot)
				),
				makeElement('td')()(
					osmConnection.user
						? makeLink(osmConnection.user.name,`${osmConnection.webRoot}/user/${encodeURIComponent(osmConnection.user.name)}`)
						: makeElement('em')()(`unauthorized`)
				),
				makeElement('td')()(
					osmConnection.user?.isModerator ? `★` : ``
				)
			)
		)

		this.changesetStage.setReadyState(osmConnection)
	}
}
