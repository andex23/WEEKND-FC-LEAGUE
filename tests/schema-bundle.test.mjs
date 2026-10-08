import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { schemaFiles } from '../scripts/schema-files.mjs'
test('fresh schema bundle includes current policies in dependency order without demo accounts',async()=>{
 const bundle=await readFile(new URL('../supabase/apply-all.sql',import.meta.url),'utf8')
 assert.ok(schemaFiles.indexOf('0010_player_avatars.sql') < schemaFiles.indexOf('0009_player_permissions.sql'))
 assert.equal(schemaFiles.includes('0005_seed.sql'),false)
 let previous=-1
 for(const file of schemaFiles){const position=bundle.indexOf('-- Source: '+file);assert.ok(position>previous,`Missing or misplaced ${file}`);previous=position;assert.ok(bundle.includes(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')),`Stale ${file}`)}
})
