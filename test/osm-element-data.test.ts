import { getOsmElementVersionDataFromString } from '../src/osm-element-data'

test(`parses regular type/id/version`,()=>{
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
