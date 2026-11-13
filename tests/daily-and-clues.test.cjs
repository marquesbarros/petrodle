const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf("'use strict'", html.indexOf('<script'));
const end = html.indexOf('const root =', start);
assert.ok(start !== -1 && end > start, 'A estrutura do script não foi encontrada');
const script = html.slice(start, end);
const ctx = {};
vm.runInNewContext(script + '\nglobalThis.__test = {getLocalDateKey, redactMineralName, buildProgressiveClues, MINERALS};', ctx, {timeout: 30000});
const {getLocalDateKey, redactMineralName, buildProgressiveClues, MINERALS} = ctx.__test;

const originalTZ = process.env.TZ;
try {
  process.env.TZ = 'America/Sao_Paulo';
  assert.equal(getLocalDateKey(new Date('2026-11-13T00:30:00Z')), '2026-11-12', 'O dia não deve mudar às 21h em São Paulo');
  assert.equal(getLocalDateKey(new Date('2026-11-13T02:59:59Z')), '2026-11-12');
  assert.equal(getLocalDateKey(new Date('2026-11-13T03:00:00Z')), '2026-11-13', 'O dia deve mudar à meia-noite local');
  process.env.TZ = 'Asia/Tokyo';
  assert.equal(getLocalDateKey(new Date('2026-11-12T15:00:00Z')), '2026-11-13');
} finally {
  if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ;
}

const rinkita = MINERALS.find(m => m.name === 'Rinkita-(Ce)');
assert.ok(rinkita, 'A Rinkita-(Ce) deve estar no catálogo');
assert.equal(redactMineralName('A Rinkita-(Ce) ocorre em rochas alcalinas.', rinkita), 'A [mineral] ocorre em rochas alcalinas.');
const synthetic = {name: 'A+B (Ce)', aliases: ['X.Y']};
assert.equal(redactMineralName('A+B (Ce) e X.Y; não AAB (Ce) nem XqY', synthetic), '[mineral] e [mineral]; não AAB (Ce) nem XqY');
for (const m of MINERALS.filter(x => x.playable)) {
  assert.equal(buildProgressiveClues(m).length, 6, `${m.name}: seis níveis de pistas`);
}
const corindon = MINERALS.find(m => m.id === 'corindon');
const espodumenio = MINERALS.find(m => m.id === 'espodumenio');
assert.ok(buildProgressiveClues(corindon)[0].value.startsWith('[mineral]'), 'Corindon sem acento não deve revelar a resposta');
assert.ok(buildProgressiveClues(espodumenio)[0].value.includes('[mineral]'), 'Erro de transcrição de espodumênio deve ser ocultado');
assert.ok(html.includes('data-thumb-fallback'), 'Palpites sem imagem precisam de ícone substituto');
assert.ok(html.includes('celebrationPending=true'), 'Acerto deve ativar a comemoração');
assert.ok(html.includes('prefers-reduced-motion'), 'Comemoração deve respeitar movimento reduzido');
assert.ok(html.includes('${catalogDetail(m)}</section>'), 'Ficha final deve reutilizar a ficha completa do catálogo');
console.log('OK: pistas sem vazamentos, ícones substitutos, comemoração e ficha completa');
