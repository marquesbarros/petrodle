const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf("'use strict'", html.indexOf('<script'));
const end = html.indexOf('const root =', start);
assert.ok(start !== -1 && end > start, 'Script do jogo não localizado');

const ctx = {};
vm.runInNewContext(html.slice(start, end) +
  '\nglobalThis.__test = {MODES, MINERALS, getEligibleForMode, getModeDailyId, getDailyId, getSuggestionImage, getPlayableState};',
  ctx, {timeout: 30000});
const {MODES, MINERALS, getEligibleForMode, getModeDailyId, getDailyId, getSuggestionImage, getPlayableState} = ctx.__test;

// Um único jogo: imagem sem efeito, palpites e dicas opcionais.
assert.deepEqual(Array.from(MODES, m => m.id), ['classic'], 'Somente a modalidade visual deve continuar ativa');
const eligible = getEligibleForMode(MINERALS, 'classic');
assert.ok(eligible.length >= 140, 'A modalidade deve manter uma seleção representativa de minerais');
assert.ok(eligible.every(m => getSuggestionImage(m)?.verifiedForSpecies !== false),
  'O desafio deve exibir fotografia atribuída à espécie, nunca foto apenas ilustrativa do grupo');
assert.ok(eligible.every(m => m.images.some(im =>
  im.verifiedForSpecies !== false && /^(data:image\/|https:\/\/)/.test(im.src))),
  'Todos os minerais sorteados devem ter fotografia identificada disponível');
const valid = new Set(eligible.map(m => m.id));
for (let day = 1; day <= 365; day++) {
  const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
  const daily = getModeDailyId(MINERALS, date, 'classic');
  assert.ok(valid.has(daily), `Resposta do dia ${date} não tem foto identificada`);
  const previous = getDailyId(MINERALS, date);
  if (valid.has(previous)) assert.equal(daily, previous,
    `Não alterar o mineral de ${date} quando ele já possui fotografia identificada`);
}
assert.deepEqual(
  Array.from(Object.values(getPlayableState('classic', Array.from({length: 12}, (_, i) => 'test' + i), 'other'))),
  [false, false, false], 'Sem limite artificial de tentativas'
);

const challenge = html.slice(html.indexOf('function challengeImage()'), html.indexOf('function attemptBoard()'));
assert.match(challenge, /<img /, 'Deve renderizar a imagem completa');
assert.doesNotMatch(challenge, /pixel-canvas|grayscale\(|blur\(|silhouette-frame|<canvas/,
  'Não pode ocultar a imagem com filtros de silhueta ou pixels');
const board = html.slice(html.indexOf('function mainGame()'), html.indexOf('function hintSection()'));
assert.match(board, /\$\{challengeImage\(\)\}/, 'Imagem deve permanecer no jogo, antes dos palpites');
assert.doesNotMatch(board, /classicBoard\(\)|otherBoard\(\)/,
  'Não devem persistir os quadros de modalidades antigas');
const shell = html.slice(html.indexOf('function gameShell()'), html.indexOf('function footer()'));
assert.doesNotMatch(shell, /mini-mode-nav|Voltar aos modos/, 'Não deve haver seleção de modalidades');
const home = html.slice(html.indexOf('function home()'), html.indexOf('function legend()'));
assert.doesNotMatch(home, /getMenuCoverImage|const cover=/,
  'A fotografia decorativa da página inicial não deve parecer a resposta do desafio');
assert.doesNotMatch(home, /QUATRO MODOS|Escolha seu desafio|hub-mode-grid/,
  'Página inicial deve apresentar um só desafio');
assert.doesNotMatch(html, /function paintPixel\(\)/, 'Remover renderizador de pixels não utilizado');
console.log(`OK: modalidade única com ${eligible.length} respostas fotografadas, imagem integral e palpites livres`);
