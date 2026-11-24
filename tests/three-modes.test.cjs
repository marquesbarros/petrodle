const assert = require('node:assert/strict');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const { readGame, getGame } = require('../scripts/load-game.cjs');
const { html } = readGame(file);
const { MODES, MINERALS, searchMinerals, isGuessable, getEligibleForMode, getModeDailyId, getDailyId, getPlayableState, resolveGuess } = getGame(["MODES","MINERALS","searchMinerals","isGuessable","getEligibleForMode","getModeDailyId","getDailyId","getPlayableState","resolveGuess"], file);

// A busca só registra nomes válidos e palpites inéditos, sem surpresas ao confirmar.
const sample = [
  {id:'albita', name:'Albita', aliases:['Ab'], playable:true},
  {id:'almandina', name:'Almandina', aliases:[], playable:true},
  {id:'feldspato', name:'Feldspato (grupo)', aliases:['Feldspato'], playable:false}
];
assert.equal(resolveGuess(sample, '  ', []).status, 'empty',
  'Enter com o campo vazio não pode consumir uma tentativa');
assert.equal(resolveGuess(sample, 'al', []).status, 'choose',
  'Busca ambígua deve exigir seleção');
assert.equal(resolveGuess(sample, 'Ab', []).id, 'albita',
  'Sinônimos válidos devem ser aceitos');
assert.equal(resolveGuess(sample, 'albita', ['albita']).status, 'duplicate',
  'Palpite repetido não consome tentativa');
assert.equal(resolveGuess(sample, 'feldspato', []).status, 'choose',
  'Grupos mineralógicos não podem virar resposta');
assert.equal(resolveGuess(sample, 'alman', []).id, 'almandina',
  'Correspondência única pode ser confirmada pelo teclado');


// Biotita é um nome petrográfico coletivo: palpite válido, não espécie sorteável.
const biotita = MINERALS.find(m => m.id === 'biotita');
assert.ok(biotita, 'Biotita deve existir no catálogo');
assert.equal(biotita.taxonRank, 'reference', 'Biotita não deve ser rotulada como espécie IMA');
assert.equal(biotita.playable, false, 'Biotita não altera os alvos diários existentes');
assert.equal(isGuessable(biotita), true, 'Biotita deve ser aceita como palpite');
assert.ok(searchMinerals(MINERALS, 'biot').some(m => m.id === 'biotita'),
  'A busca deve sugerir biotita');
assert.equal(resolveGuess(MINERALS, 'Biotita').id, 'biotita',
  'O palpite biotita deve ser confirmado');
assert.equal(resolveGuess(MINERALS, 'Biotita', ['biotita']).status, 'duplicate',
  'Biotita não deve consumir uma segunda tentativa');
assert.equal(resolveGuess(MINERALS, 'Granada').status, 'choose',
  'Outros grupos não devem tornar-se palpites por acidente');

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
  im.verifiedForSpecies !== false && typeof im.src === 'string' && im.src.startsWith('assets/minerals/'))),
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
for (const mode of ['photo', 'description']) {
  assert.equal(getPlayableState(mode, wrong.slice(0, 9), 'alvo').ended, false,
    'Nove erros ainda permitem o último palpite');
  assert.equal(getPlayableState(mode, wrong.slice(0, 10), 'alvo').lost, true,
    'O décimo erro encerra a partida');
  assert.equal(getPlayableState(mode, [...wrong.slice(0, 9), 'alvo'], 'alvo').won, true,
    'Acertar na décima tentativa conta como vitória');
}

const photoStage = html.slice(html.indexOf('function challengeImage()'), html.indexOf('function challengeClues()'));
assert.match(photoStage, /<img class="challenge-photo"/,
  'Imagem exibe a fotografia original');
assert.doesNotMatch(photoStage, /grayscale\(|blur\(|pixel-canvas|<canvas|silhouette-frame/,
  'Imagem não pode ocultar a fotografia com os filtros antigos');
const descriptionStage = html.slice(html.indexOf('function challengeClues()'), html.indexOf('function otherBoard()'));
assert.match(descriptionStage, /buildProgressiveClues/,
  'A modalidade Descrição deve manter suas pistas');
const board = html.slice(html.indexOf('function mainGame()'), html.indexOf('function hintSection()'));
assert.match(board, /classicBoard\(\)/, 'Clássico mantém tabela de atributos');
assert.match(board, /otherBoard\(\)/, 'Imagem e Descrição mantêm lista de palpites');
assert.match(html, /state\.gameMode==='photo'\?challengeImage\(\):challengeClues\(\)/,
  'Imagem e Descrição não podem compartilhar incorretamente o mesmo desafio');
assert.match(html, /petrodle:v6:/, 'Armazenamento anterior deve ser preservado');
assert.doesNotMatch(html, /function paintPixel\(\)|id:'silhouette'|id:'pixel'/,
  'Os renderizadores e modos antigos devem desaparecer');
assert.match(html, /e\.key==='Enter'[\s\S]*?selection>=0[\s\S]*?guess\(selectedId\)/,
  'Enter deve permitir confirmar a opção destacada');
assert.match(html, /N\u00e3o \u00e9 \$\{m\.name\}/,
  'O palpite incorreto precisa dar retorno claro sem revelar a resposta');
console.log('OK: três modos, Clássico e Descrição preservados, Imagem sem filtros e respostas com fotografia válida');
