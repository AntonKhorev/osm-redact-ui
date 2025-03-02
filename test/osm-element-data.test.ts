import { getOsmElementVersionDataFromString } from '../src/osm-element-data'

describe(`getOsmElementVersionDataFromString`,()=>{
	test(`fails on empty input`,()=>{
		expect(
			()=>getOsmElementVersionDataFromString(
				``
			)
		).toThrow(TypeError)
	})
	test(`parses :type/:id/:version`,()=>{
		expect(
			getOsmElementVersionDataFromString(
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
				`way/221/history/2`
			)
		).toStrictEqual({
			type: 'way',
			id: 221,
			version: 2
		})
	})
})
