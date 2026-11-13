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
  '\nglobalThis.__test = {MODES, MINERALS, getEligibleForMode, getModeDailyId, getDailyId, getPlayableState};',
  ctx, {timeout: 30000});
const {MODES, MINERALS, getEligibleForMode, getModeDailyId, getDailyId, getPlayableState} = ctx.__test;

assert.deepEqual(Array.from(MODES, m => m.id), ['classic', 'photo', 'description'],
  'Clássico e Descrição devem ser preservados; Silhueta e Pixel dão lugar a Imagem');
assert.equal(MODES[0].name, 'Clássico');
assert.equal(MODES[2].name, 'Descrição');

const classic = getEligibleForMode(MINERALS, 'classic');
const photo = getEligibleForMode(MINERALS, 'photo');
const description = getEligibleForMode(MINERALS, 'description');
assert.equal(classic.length, MINERALS.filter(m => m.playable).length,
  'Clássico deve manter todos os minerais jogáveis');
assert.ok(photo.length >= 30, 'Modo Imagem deve incluir espécies com fotografia verificada');
assert.ok(photo.every(m => m.images.some(im =>
  im.verifiedForSpecies !== false && typeof im.src === 'string' && im.src.startsWith('data:image/'))),
  'Modo Imagem não pode sortear foto genérica de grupo nem espécie sem fotografia válida');
assert.ok(description.length > 0 && description.every(m =>
  m.playable && m.ppl && m.xpl && !m.ppl.startsWith('Sem descrição')),
  'Descrição deve conservar os critérios de elegibilidade');

const photoIds = new Set(photo.map(m => m.id));
for (let day = 1; day <= 365; day++) {
  const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
  assert.equal(getModeDailyId(MINERALS, date, 'classic'), getDailyId(MINERALS, date),
    'A escolha diária do Clássico não deve ser alterada');
  assert.ok(photoIds.has(getModeDailyId(MINERALS, date, 'photo')),
    'O mineral do modo Imagem deve ter uma foto válida');
  assert.ok(description.some(m => m.id === getModeDailyId(MINERALS, date, 'description')),
    'A resposta do modo Descrição precisa ter descrições PPL/XPL');
}
const wrong = Array.from({length: 12}, (_, i) => 'erro-' + i);
assert.equal(getPlayableState('classic', wrong, 'alvo').lost, false,
  'Clássico continua sem limite de tentativas');
assert.equal(getPlayableState('photo', wrong.slice(0, 8), 'alvo').lost, true,
  'Imagem mantém oito tentativas');
assert.equal(getPlayableState('description', wrong.slice(0, 8), 'alvo').lost, true,
  'Descrição mantém oito tentativas');

const photoStage = html.slice(html.indexOf('function challengeImage()'), html.indexOf('function challengeClues()'));
assert.match(photoStage, /<img class="challenge-photo"/,
  'Imagem exibe a fotografia original');
assert.doesNotMatch(photoStage, /grayscale\(|blur\(|pixel-canvas|<canvas|silhouette-frame/,
  'Imagem não pode ocultar a fotografia com os filtros antigos');
const descriptionStage = html.slice(html.indexOf('function challengeClues()'), html.indexOf('function otherBoard()'));
assert.match(descriptionStage, /state\.gameMode==='description'/,
  'A modalidade Descrição deve manter suas pistas');
const board = html.slice(html.indexOf('function mainGame()'), html.indexOf('function hintSection()'));
assert.match(board, /classicBoard\(\)/, 'Clássico mantém tabela de atributos');
assert.match(board, /otherBoard\(\)/, 'Imagem e Descrição mantêm lista de palpites');
assert.match(html, /state\.gameMode==='photo'\?challengeImage\(\):challengeClues\(\)/,
  'Imagem e Descrição não podem compartilhar incorretamente o mesmo desafio');
assert.match(html, /petrodle:v6:/, 'Armazenamento anterior deve ser preservado');
assert.doesNotMatch(html, /function paintPixel\(\)|id:'silhouette'|id:'pixel'/,
  'Os renderizadores e modos antigos devem desaparecer');
console.log('OK: três modos, Clássico e Descrição preservados, Imagem sem filtros e respostas com fotografia válida');
