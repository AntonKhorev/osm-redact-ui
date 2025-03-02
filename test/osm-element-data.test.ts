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
	test(`parses :types/:id/:version`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`nodes/23/13`
			)
		).toStrictEqual({
			type: 'node',
			id: 23,
			version: 13
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
	test(`parses short node format`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`r1234567v8`
			)
		).toStrictEqual({
			type: 'relation',
			id: 1234567,
			version: 8
		})
	})
	test(`parses short way format`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`r123456v7`
			)
		).toStrictEqual({
			type: 'relation',
			id: 123456,
			version: 7
		})
	})
	test(`parses short relation format`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`r12345v6`
			)
		).toStrictEqual({
			type: 'relation',
			id: 12345,
			version: 6
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
	test(`parses web url with extra slashes`,()=>{
		expect(
			getOsmElementVersionDataFromString(
				defaultServerUrls,
				`https://www.example.com//node////57352///history//1///`
			)
		).toStrictEqual({
			type: 'node',
			id: 57352,
			version: 1
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
