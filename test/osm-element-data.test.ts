import { getOsmElementVersionDataFromString } from '../src/osm-element-data'

describe(`getOsmElementVersionDataFromString`,()=>{
	const defaultServerUrls={
		webRoot: `https://www.example.com/`,
		apiRoot: `https://api.example.com/`
	}

	test(`fails on empty input`,()=>{
		expect(
			()=>getOsmElementVersionDataFromString(
				defaultServerUrls,
				``
			)
		).toThrow(TypeError)
	})
	test(`parses :type/:id/:version`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`node/23/12`
			)
		).toStrictEqual({
			type: 'node',
			id: 23,
			version: 12
		})
	})
	test(`parses :type/:id/history/:version`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`way/221/history/2`
			)
		).toStrictEqual({
			type: 'way',
			id: 221,
			version: 2
		})
	})
	test(`fails on unknown origin in web url`,()=>{
		expect(
			()=>getOsmElementVersionDataFromString(
				defaultServerUrls,
				`https://unknown.example.com/node/1/history/4`
			)
		).toThrow(TypeError)
	})
	test(`parses web url`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`https://www.example.com/node/1/history/4`
			)
		).toStrictEqual({
			type: 'node',
			id: 1,
			version: 4
		})
	})
	test(`parses web url with hash`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`https://www.example.com/node/1/history/4#map=17/59.912791/30.329046`
			)
		).toStrictEqual({
			type: 'node',
			id: 1,
			version: 4
		})
	})
})
