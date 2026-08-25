// Ejecuta archivos .sql contra Neon usando el driver HTTP (útil cuando el puerto 5432 no es accesible).
// Uso: node scripts/sql-runner.mjs <archivo.sql> [...]
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');
const sql = neon(url);

function split(source) {
  const out = [];
  let buf = '';
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];
    if (inLineComment) {
      buf += c;
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (!inSingle && !inDouble && c === '-' && n === '-') {
      inLineComment = true;
      buf += c;
      continue;
    }
    if (!inDouble && c === "'") inSingle = !inSingle;
    else if (!inSingle && c === '"') inDouble = !inDouble;
    if (c === ';' && !inSingle && !inDouble) {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = '';
      continue;
    }
    buf += c;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out.filter((s) => s.replace(/--[^\n]*/g, '').trim().length > 0);
}

const files = process.argv.slice(2);
for (const file of files) {
  const statements = split(readFileSync(file, 'utf8'));
  console.log(`→ ${file}: ${statements.length} sentencias`);
  let i = 0;
  for (const stmt of statements) {
    i++;
    try {
      await sql.query(stmt);
    } catch (err) {
      console.error(`\n✗ Sentencia ${i} de ${file}:\n${stmt.slice(0, 400)}\n`);
      throw err;
    }
    if (i % 50 === 0) console.log(`   ${i}/${statements.length}`);
  }
  console.log(`✓ ${file}`);
}
console.log('Listo.');
