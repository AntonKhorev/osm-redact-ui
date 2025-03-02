import RunLogger from './run-logger'
import { OsmAuthData, OsmServerUrls } from './osm-auth-data'
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

	webUrl(path: string): string {
		return this.data.webRoot+path
	}

	get serverUrls(): OsmServerUrls {
		return {
			webRoot: this.data.webRoot,
			apiRoot: this.data.apiRoot
		}
	}
}
