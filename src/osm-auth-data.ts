import { isObject, isArrayOfStrings } from './types'

export type OsmAuthUserData = {
	token: string
	id: number
	name: string
	isModerator: boolean
}

export type OsmAuthData = {
	webRoot: string
	apiRoot: string
	user?: OsmAuthUserData
}

export function convertOsmUserDetailsJsonToOsmAuthUserData(json: unknown, token: string): OsmAuthUserData {
	if (!(
		isObject(json) && 'user' in json && isObject(json.user) &&
		'id' in json.user && typeof json.user.id == 'number' &&
		'display_name' in json.user &&typeof json.user.display_name == 'string'
	)) {
		throw new TypeError(`received invalid user details`)
	}
	return {
		token,
		id: json.user.id,
		name: json.user.display_name,
		isModerator: 'roles' in json.user && isArrayOfStrings(json.user.roles) && json.user.roles.includes('moderator')
	}
}
