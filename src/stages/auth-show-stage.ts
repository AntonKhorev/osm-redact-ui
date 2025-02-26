import CurrentOsmAuthManager from '../current-osm-auth-manager'
import OsmAuth from '../osm-auth'
import { makeElement, makeLink } from '../html'
import { bubbleEvent } from '../events'

export default class AuthShowStage {
	private $noCurrentAuthorizationMessage=makeElement('p')()(`No current authorization`)
	private $authTable=makeElement('table')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`Current server and authorization`)
	)

	constructor(currentOsmAuthManager: CurrentOsmAuthManager) {
		this.$authTable.hidden=true

		document.body.addEventListener('osmRedactUi:newAuth',ev=>{
			const osmAuthData=ev.detail

			this.$noCurrentAuthorizationMessage.hidden=true
			this.$authTable.hidden=false
	
			this.$authTable.replaceChildren(
				makeElement('tr')()(
					makeElement('th')()(`server`),
					makeElement('th')()(`user`),
					makeElement('th')()(`mod?`)
				),
				makeElement('tr')()(
					makeElement('td')()(
						makeLink(osmAuthData.webRoot,osmAuthData.webRoot)
					),
					makeElement('td')()(
						osmAuthData.user
							? makeLink(osmAuthData.user.name,`${osmAuthData.webRoot}/user/${encodeURIComponent(osmAuthData.user.name)}`)
							: makeElement('em')()(`unauthorized`)
					),
					makeElement('td')()(
						osmAuthData.user?.isModerator ? `★` : ``
					)
				)
			)

			currentOsmAuthManager.currentOsmAuth=new OsmAuth(osmAuthData)
			bubbleEvent(this.$section,'osmRedactUi:currentAuthUpdate')
		})
	}

	render() {
		this.$section.append(
			this.$noCurrentAuthorizationMessage,
			this.$authTable
		)
	}
}
