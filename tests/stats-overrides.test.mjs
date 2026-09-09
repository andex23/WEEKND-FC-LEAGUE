import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeStatsRows, csvCell } from '../lib/stats-overrides.ts'
test('manual changes preserve calculated fields and support added and removed rows', () => {
 const rows = mergeStatsRows([{id:'a',name:'Player A',team:'Arsenal',Pts:3,GF:5}], {a:{Pts:7},b:{name:'Player B',team:'Chelsea',Pts:1}}, 'standings')
 assert.equal(rows[0].Pts,7);assert.equal(rows[0].GF,5);assert.equal(rows[1].P,0)
 assert.deepEqual(mergeStatsRows(rows,{a:{deleted:true}},'standings').map(r=>r.id),['b'])
})
test('CSV escapes commas, quotes, and spreadsheet formulas', () => {
 assert.equal(csvCell('A, "B"'),'"A, ""B"""')
 assert.equal(csvCell('=1+1'),'"\'=1+1"')
})
