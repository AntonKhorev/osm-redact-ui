import CurrentOsmAuthManager from '../current-osm-auth-manager'
import AuthStorage from '../auth-storage'
import OsmAuth from '../osm-auth'
import { makeElement, makeLink } from '../html'
import { bubbleEvent } from '../events'

export default class AuthShowStage {
	private $noCurrentAuthorizationMessage=makeElement('p')()(`No current authorization`)
	private $authTable=makeElement('table')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`Current server and authorization`)
	)

	constructor(currentOsmAuthManager: CurrentOsmAuthManager, osmAuthStorage: AuthStorage) {
		this.$authTable.hidden=true

		const updateAuthTable=()=>{
			let isEmpty=true
			for (const osmAuthData of osmAuthStorage.list()) {
				console.log(osmAuthData)

				if (isEmpty) this.$authTable.replaceChildren(
					makeElement('tr')()(
						makeElement('th')()(),
						makeElement('th')()(`server`),
						makeElement('th')()(`user`),
						makeElement('th')()(`mod?`)
					)
				)
				isEmpty=false

				this.$authTable.append(
					makeElement('tr')()(
						makeElement('td')()(
							`()` // TODO
						),
						makeElement('td')()(
							makeLink(osmAuthData.webRoot,osmAuthData.webRoot)
						),
						makeElement('td')()(
							osmAuthData.user
								? makeLink(osmAuthData.user.name,`${osmAuthData.webRoot}user/${encodeURIComponent(osmAuthData.user.name)}`)
								: makeElement('em')()(`unauthorized`)
						),
						makeElement('td')()(
							osmAuthData.user?.isModerator ? `★` : ``
						)
					)
				)
			}

			this.$noCurrentAuthorizationMessage.hidden=!isEmpty
			this.$authTable.hidden=isEmpty
		}
		updateAuthTable()

		document.body.addEventListener('osmRedactUi:newAuth',ev=>{
			const osmAuthData=ev.detail

			osmAuthStorage.add(osmAuthData)
			currentOsmAuthManager.currentOsmAuth=new OsmAuth(osmAuthData)

			updateAuthTable()
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
