import RunLogger from './run-logger'
import { OsmAuthData } from './osm-auth-data'
import OsmApi from './osm-api';

export default class OsmAuth {
	constructor(
		private readonly data: OsmAuthData
	) {}

	connectToOsmApi(runLogger: RunLogger, signal: AbortSignal): OsmApi {
		return new OsmApi(
			this.data.apiRoot,
			this.data.user?.token ?? '',
			runLogger,
			signal
		)
	}
}
