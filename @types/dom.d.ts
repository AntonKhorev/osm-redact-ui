import type { OsmAuthData } from '../src/osm-auth-data'

declare global {
	interface HTMLElementEventMap {
		'osmRedactUi:newAuth': CustomEvent<OsmAuthData>
		'osmRedactUi:currentAuthUpdate': Event
	}
}
export {}
