const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf("'use strict'", html.indexOf('<script'));
const end = html.indexOf('const root =', start);
assert.ok(start >= 0 && end > start, 'Lógica principal do jogo deve estar disponível');

const ctx = {};
vm.runInNewContext(html.slice(start, end) +
  '\nglobalThis.__test = {MINERALS, MODES, getPhotoPair, getEligibleForMode, getModeDailyId, getDailyModeSummary};',
  ctx, {timeout: 30000});
const {MINERALS, getPhotoPair, getEligibleForMode, getModeDailyId, getDailyModeSummary} = ctx.__test;
const byId = new Map(MINERALS.map(m => [m.id, m]));
const photo = getEligibleForMode(MINERALS, 'photo');

assert.ok(photo.length >= 40,
  'O modo Imagem deve preservar um conjunto relevante de minerais com pares PPL/XPL');
assert.ok(photo.every(m => m.playable && getPhotoPair(m)),
  'Toda resposta sorteável deve possuir um par validado');
for (const mineral of photo) {
  const pair = getPhotoPair(mineral);
  assert.ok(pair.ppl.src.startsWith('data:image/') && pair.xpl.src.startsWith('data:image/'),
    mineral.name + ': fotos devem estar disponíveis sem conexão');
  assert.ok(pair.ppl.verifiedForSpecies !== false && pair.xpl.verifiedForSpecies !== false,
    mineral.name + ': ambas as fotos devem identificar a espécie');
  assert.notEqual(pair.ppl.src, pair.xpl.src,
    mineral.name + ': PPL e XPL não podem reutilizar a mesma imagem');
}

assert.equal(getPhotoPair(byId.get('actinolita')), null,
  'Duas fotos em PPL não devem ser rotuladas como PPL/XPL');
assert.equal(getPhotoPair(byId.get('biotita')), null,
  'Fotos sem par NC verificado não devem ser classificadas como pares');
const andalusita = byId.get('andalusita');
assert.equal(getPhotoPair(andalusita).ppl.src, andalusita.images[0].src);
assert.equal(getPhotoPair(andalusita).xpl.src, andalusita.images[1].src);
const barita = byId.get('barita');
assert.equal(getPhotoPair(barita).ppl.src, barita.images[1].src,
  'A primeira foto de barita está em NC, logo a ordem deve ser invertida');
assert.equal(getPhotoPair(barita).xpl.src, barita.images[0].src);

// Regressão: pares adicionais conferidos nas legendas ND/NC do Guia Frank.
// A ordem das imagens no arquivo nem sempre corresponde a PPL → XPL.
const verifiedFromGuide = [
  ['anidrita', 1, 0, 16, 15],
  ['cloritoide', 0, 1, 61, 61],
  ['eudialita', 1, 0, 88, 88],
  ['glauconita', 0, 1, 100, 100],
  ['goethita', 0, 1, 101, 101],
  ['prehnita', 1, 0, 168, 167],
  ['rhodochrosita', 0, 1, 172, 172],
  ['titanita', 1, 0, 193, 193]
];
for (const [id, pplIndex, xplIndex, pplPage, xplPage] of verifiedFromGuide) {
  const mineral = byId.get(id);
  assert.ok(mineral?.playable, id + ': o mineral precisa ser uma resposta elegível');
  const pair = getPhotoPair(mineral);
  assert.ok(pair, id + ': o par PPL/XPL deve estar disponível');
  assert.equal(pair.ppl.src, mineral.images[pplIndex].src, id + ': imagem PPL incorreta');
  assert.equal(pair.xpl.src, mineral.images[xplIndex].src, id + ': imagem XPL incorreta');
  assert.equal(pair.ppl.page, pplPage, id + ': página da imagem PPL incorreta');
  assert.equal(pair.xpl.page, xplPage, id + ': página da imagem XPL incorreta');
}
assert.ok(photo.length >= 58, 'A curadoria deve disponibilizar pelo menos 58 espécies no modo Imagem');

// Uma partida antiga pode ter outro alvo após a curadoria de pares.
const day='2026-11-15';
const currentTarget=getModeDailyId(MINERALS,day,'photo');
const migrated=getDailyModeSummary(MINERALS,[{id:'photo'}],day,
  ()=>({targetId:'alvo-anterior',guesses:[currentTarget]}));
assert.equal(migrated[0].status,'available',
  'Um palpite antigo não pode vencer indevidamente o novo desafio');
assert.match(html, /const staleProgress=Boolean\(prior\.targetId&&prior\.targetId!==targetId\)/,
  'Partidas persistidas com outro alvo devem descartar palpites antigos');

const stage = html.slice(html.indexOf('function challengeImage()'), html.indexOf('function challengeClues()'));
assert.match(stage, /photo-pair/);
assert.match(stage, /pair\.ppl/);
assert.match(stage, /pair\.xpl/);
assert.match(stage, /<img class="challenge-photo"/);
assert.match(stage, /alt="Fotomicrografia do mineral secreto em/);
assert.doesNotMatch(stage, /grayscale\(|blur\(|pixel-canvas/,
  'Fotos devem continuar sem filtros');

const css = fs.readFileSync(path.join(__dirname, '..', 'game.css'), 'utf8');
assert.match(css, /\.photo-pair\s*\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,
  'O par deve ser exibido lado a lado sem restringir uma das fotos');
console.log('OK: ' + photo.length + ' minerais com pares PPL/XPL verificados e renderização responsiva');
