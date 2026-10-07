import { readFile, writeFile } from 'node:fs/promises'
import { schemaFiles } from './schema-files.mjs'
const chunks = await Promise.all(schemaFiles.map(async (file) =>
  `-- Source: ${file}\n${await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8')}`))
const text = '-- GENERATED FRESH-DATABASE SETUP ONLY. Do not run on an existing production database.\n' +
  '-- Source order: scripts/schema-files.mjs. Regenerate with node scripts/build-schema.mjs.\n' +
  '-- Optional demo seed 0005 is deliberately excluded. Review security policies before applying.\n\n' + chunks.join('\n\n')
await writeFile(new URL('../supabase/apply-all.sql', import.meta.url), text)
