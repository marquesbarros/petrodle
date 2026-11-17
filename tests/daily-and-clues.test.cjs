const assert = require('node:assert/strict');
const path = require('node:path');
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const { readGame, getGame } = require('../scripts/load-game.cjs');
const { html } = readGame(file);
const { getLocalDateKey, redactMineralName, buildProgressiveClues, MINERALS } = getGame(["getLocalDateKey","redactMineralName","buildProgressiveClues","MINERALS"], file);

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
assert.equal(redactMineralName('A rinkita-(Ce) ocorre em rochas alcalinas.', rinkita), 'A [mineral] ocorre em rochas alcalinas.');
const synthetic = {name: 'A+B (Ce)', aliases: ['X.Y']};
assert.equal(redactMineralName('A+B (Ce) e X.Y; não AAB (Ce) nem XqY', synthetic), '[mineral] e [mineral]; não AAB (Ce) nem XqY');
for (const m of MINERALS.filter(x => x.playable)) {
  assert.equal(buildProgressiveClues(m).length, 6, `${m.name}: seis níveis de pistas`);
}
const corindon = MINERALS.find(m => m.id === 'corindon');
const espodumenio = MINERALS.find(m => m.id === 'espodumenio');
assert.ok(buildProgressiveClues(corindon)[0].value.startsWith('[mineral]'), 'Corindon sem acento não deve revelar a resposta');
assert.ok(buildProgressiveClues(espodumenio)[0].value.includes('[mineral]'), 'Erro de transcrição de espodumênio deve ser ocultado');
assert.ok(html.includes('data-retry-photo'), 'Falha na foto precisa de ação de recuperação');
assert.match(html,/if\(m\.id===state\.targetId\)discover\(m\.id\)/, 'Acerto deve registrar o mineral na coleção');
assert.doesNotMatch(html,/function celebrateWin|function startReveal/, 'Resultado e tabela devem aparecer sem espera');
assert.ok(html.includes("${catalogDetail(m,'result')}</section>"), 'Ficha final deve reutilizar a ficha completa do catálogo');
console.log('OK: pistas sem vazamentos, recuperação da foto, coleção e ficha completa');
