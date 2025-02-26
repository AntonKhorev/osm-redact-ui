import ChangesetStage from './changeset-stage'
import { makeElement, makeLink } from '../html'

export default class AuthShowStage {
	private $noCurrentAuthorizationMessage=makeElement('p')()(`No current authorization`)
	private $authTable=makeElement('table')()()

	$section=makeElement('section')()(
		makeElement('h2')()(`See current server and authorization`)
	)

	constructor(changesetStage: ChangesetStage) {
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
	
			changesetStage.setReadyState(osmAuthData)
		})
	}

	render() {
		this.$section.append(
			this.$noCurrentAuthorizationMessage,
			this.$authTable
		)
	}
}
