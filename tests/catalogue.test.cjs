const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { getGame } = require('../scripts/load-game.cjs');
const { exportPhotos } = require('../scripts/export-photos.cjs');

const root = path.join(__dirname, '..');
const { MINERALS, CATALOGUE, getPropertyProvenance, validateMinerals, getPhotoImages, DAILY_HISTORY,
  DAILY_VERSIONS, getScheduledTarget, MODES, DIFFICULTIES, getModeDailyId } = getGame([
  'MINERALS', 'CATALOGUE', 'getPropertyProvenance', 'validateMinerals', 'getPhotoImages', 'DAILY_HISTORY',
  'DAILY_VERSIONS', 'getScheduledTarget', 'MODES', 'DIFFICULTIES', 'getModeDailyId'
]);

test('cada verbete possui procedência válida para todas as propriedades auditadas', () => {
  assert.equal(validateMinerals(MINERALS).length, 0);
  const fields = Object.keys(CATALOGUE.provenanceProfiles[0]);
  for (const mineral of MINERALS) {
    const profile = CATALOGUE.provenanceProfiles[mineral.provenanceProfile];
    assert.deepEqual(Object.keys(profile), fields, mineral.id);
    for (const [field, [status, scope, origin, sourceIndex]] of Object.entries(profile)) {
      assert.ok(['present', 'variable', 'missing', 'inapplicable'].includes(status), mineral.id + ' ' + field);
      assert.ok(['species', 'group', 'range'].includes(scope));
      assert.ok(['guide', 'editorial'].includes(origin));
      assert.ok(sourceIndex === null || Object.hasOwn(mineral.sources, sourceIndex), mineral.id + ' ' + field);
    }
  }
  const stilbite = MINERALS.find(mineral => mineral.id === 'estilbita-na');
  assert.equal(getPropertyProvenance(stilbite, 'ppl').scope, 'group');
  assert.equal(getPropertyProvenance(stilbite, 'formula').scope, 'species');
  assert.equal(getPropertyProvenance(stilbite, 'ppl').source.page, 87);
});

test('arquivos WebP locais correspondem aos IDs e o inventário deriva do catálogo', () => {
  const pictures = new Map(MINERALS.flatMap(m => m.images.map(image => [image.id, image])));
  for (const [id, image] of pictures) {
    if (image.external) {
      assert.ok(image.author && image.license && image.metadataSource, image.src);
      continue;
    }
    assert.match(image.src, /^assets\/minerals\/[a-f0-9]{20}\.webp$/);
    const bytes = fs.readFileSync(path.join(root, image.src));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 20), id);
  }
  assert.equal(fs.readFileSync(path.join(root, 'data', 'acervo.csv'), 'utf8').replaceAll('\r\n', '\n'), exportPhotos());
});

test('versões e publicações arquivadas referenciam alvos reproduzíveis', () => {
  const byId = new Map(MINERALS.map(m => [m.id, m]));
  for (const [date, publication] of Object.entries(DAILY_HISTORY)) {
    for (const [mode, levels] of Object.entries(publication.targets)) {
      for (const [difficulty, id] of Object.entries(levels)) {
        assert.ok(byId.has(id), id);
        if (!MODES.some(m => m.id === mode)) continue;
        assert.equal(getScheduledTarget(MINERALS, date, mode, difficulty).id, id);
        assert.equal(getScheduledTarget(MINERALS, date, mode, difficulty).version, publication.sha.slice(0, 7));
      }
    }
  }
  for (const { pools } of DAILY_VERSIONS) {
    for (const mode of MODES) {
      for (const difficulty of DIFFICULTIES) {
        const ids = pools[mode.id][difficulty.id];
        assert.ok(ids.length && ids.length === new Set(ids).size);
        assert.ok(ids.every(id => byId.has(id)));
        if (mode.id === 'photo') assert.ok(ids.every(id => getPhotoImages(byId.get(id))?.length === 2));
      }
    }
  }
  const withoutQuartz = MINERALS.filter(m => m.id !== 'quartzo');
  const day = '2027-04-06';
  assert.notEqual(getModeDailyId(MINERALS, day, 'classic'), getModeDailyId(withoutQuartz, day, 'classic'));
  assert.equal(getScheduledTarget(MINERALS, day, 'classic').id, getScheduledTarget(withoutQuartz, day, 'classic').id);
});
