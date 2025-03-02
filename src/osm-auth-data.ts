import { OsmServerUrls } from './osm-server-urls'
import { isObject, isArrayOfStrings } from './types'

export type OsmAuthOauthData = {
	clientId?: string
	token: string
}

export type OsmAuthUserData = OsmAuthOauthData & {
	id: number
	name: string
	isModerator: boolean
}
export function isOsmAuthUserData(json: unknown): json is OsmAuthUserData {
	return (
		isObject(json) &&
		(!('clientId' in json) || typeof json.clientId == 'string') &&
		'token' in json && typeof json.token == 'string' &&
		'id' in json && typeof json.id == 'number' &&
		'name' in json && typeof json.name == 'string' &&
		'isModerator' in json && typeof json.isModerator == 'boolean'
	)
}

export type OsmAuthData = OsmServerUrls & {
	user?: OsmAuthUserData
}
export function isOsmAuthData(json: unknown): json is OsmAuthData {
	return (
		isObject(json) &&
		'webRoot' in json && typeof json.webRoot == 'string' &&
		'apiRoot' in json && typeof json.apiRoot == 'string' &&
		(!('user' in json) || isOsmAuthUserData(json.user))
	)
}

export function isOsmAuthDataWithSameToken(data1: Readonly<OsmAuthData>, data2: Readonly<OsmAuthData>): boolean {
	return (
		data1.webRoot==data2.webRoot &&
		data1.apiRoot==data2.apiRoot &&
		(
			(
				data1.user==null && data2.user==null
			) || (
				data1.user!=null && data2.user!=null &&
				data1.user.token==data2.user.token
			)
		)
	)
}

export function convertOsmUserDetailsJsonToOsmAuthUserData(json: unknown, oauth: OsmAuthOauthData): OsmAuthUserData {
	if (!(
		isObject(json) && 'user' in json && isObject(json.user) &&
		'id' in json.user && typeof json.user.id == 'number' &&
		'display_name' in json.user &&typeof json.user.display_name == 'string'
	)) {
		throw new TypeError(`received invalid user details`)
	}
	return {
		...oauth,
		id: json.user.id,
		name: json.user.display_name,
		isModerator: 'roles' in json.user && isArrayOfStrings(json.user.roles) && json.user.roles.includes('moderator')
	}
}
