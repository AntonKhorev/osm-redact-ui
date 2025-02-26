import type { OsmAuthData } from '../src/osm-auth-data'

declare global {
	interface HTMLElementEventMap {
		'osmRedactUi:newAuth': CustomEvent<OsmAuthData>
	}
}
export {}
