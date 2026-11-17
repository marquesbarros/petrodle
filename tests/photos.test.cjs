const assert = require('node:assert/strict');
const path = require('node:path');
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const { getGame } = require('../scripts/load-game.cjs');
const { MINERALS, getSuggestionImage } = getGame(["MINERALS","getSuggestionImage"], file);
const playable = MINERALS.filter(x => x.playable);
assert.equal(playable.length, 152, 'O catálogo jogável não deve perder espécies nesta atualização');
const noPhoto = playable.filter(x => !getSuggestionImage(x));
assert.deepEqual(Array.from(noPhoto, x=>x.name), [], 'Toda sugestão precisa exibir uma fotografia, identificada ou ilustrativa');
const verified = playable.filter(x => x.images.some(im => im.verifiedForSpecies!==false));
assert.ok(verified.length >= 145, `Esperadas pelo menos 145 espécies com foto nominalmente identificada, obtidas: ${verified.length}`);
for(const m of playable){
  const picked=getSuggestionImage(m);
  assert.ok(/^assets\/minerals\/|^https:\/\//.test(picked.src), `${m.name} imagem inválida`);
  if(picked.external){assert.ok(picked.url?.startsWith('https://commons.wikimedia.org/wiki/File:'), `${m.name} sem URL da ficha no Commons`)}
}
console.log(`OK: ${playable.length} respostas exibem uma foto; ${verified.length} têm foto nominalmente identificada`);
