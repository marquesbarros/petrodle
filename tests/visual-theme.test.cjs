const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const css = readFileSync(path.join(root, 'game.css'), 'utf8');

assert.match(html, /<link rel="stylesheet" href="game\.css\?v=1">/,
  'O tema publicado deve ser carregado pelo jogo');
assert.match(html, /const MODES = Object\.freeze\(\[/,
  'As modalidades de jogo devem permanecer na interface');
for (const id of ['classic', 'photo', 'description'])
  assert.match(html, new RegExp("id:'" + id + "'"));
assert.match(html, /Três modos de jogar/);
assert.match(html, /Escolha sua partida/);
assert.match(html, /function classicBoard\(/);
assert.match(html, /function challengeImage\(/);
assert.match(html, /function challengeClues\(/);
assert.match(html, /petrodle:v6:/,
  'As chaves de progresso salvas anteriormente devem permanecer estáveis');

for (const selector of [
  '.hub-hero', '.hub-card', '.hub-mode-grid', '.game-heading', '.mini-mode-nav',
  '.main-card', '.guess-input', '.submit', '.guess-board td.cell.correct',
  '.guess-board td.cell.partial', '.guess-board td.cell.absent',
  '.challenge-stage', '.description-stage', '.result'
]) assert.ok(css.includes(selector), 'Estilo essencial ausente: ' + selector);
assert.match(css, /@media\(max-width:680px\)/, 'Layout móvel requerido');
assert.match(css, /prefers-reduced-motion:reduce/, 'Respeitar movimento reduzido');
assert.ok(!css.includes('url(http'), 'O tema não deve carregar imagens de terceiros');

let open = 0;
for (const char of css) {
  if (char === '{') open++;
  if (char === '}') {
    open--;
    assert.ok(open >= 0, 'Há uma chave CSS extra');
  }
}
assert.equal(open, 0, 'Blocos de estilos devem estar fechados');
console.log('OK: menu de jogo, tela de partida, estados, responsividade e JS preservados');
