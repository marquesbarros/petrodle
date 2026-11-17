const assert = require('node:assert/strict');
const test = require('node:test');
const { collect, findNewIssues, identityMatch, probeImages, readGame, render } = require('../scripts/audit.cjs');

test('a auditoria contabiliza nove combinações, identifica os casos ambíguos e protege a linha de base', () => {
  const report = collect(readGame());
  const hardDescription = report.rounds.find(round => round.mode === 'description' && round.difficulty === 'hard');
  const baseline = require('../data/audit-baseline.json').issues;
  const startingPairs = baseline.filter(issue => issue.startsWith('pistas-idênticas:description:hard:'))
    .flatMap(issue => issue.split(':').slice(3));
  assert.equal(report.rounds.length, 9);
  assert.equal(new Set(startingPairs).size, 34);
  assert.ok(startingPairs.includes('estilbita-ca') && startingPairs.includes('estilbita-na'));
  assert.ok(hardDescription.ambiguities.every(group => group.ids.length >= 2 && group.evidence));
  assert.ok(report.duplicates.some(duplicate => duplicate.scope === 'grupo'));
  assert.ok(report.gaps.some(gap => gap.kind === 'inaplicável'));
  assert.deepEqual(findNewIssues(report.issues, baseline), []);
  assert.equal(render(report), require('node:fs').readFileSync(require('node:path').join(__dirname, '../docs/AUDITORIA_DO_CATALOGO.md'), 'utf8').replaceAll('\r\n', '\n'));
});

test('a busca por vazamentos respeita acentos, palavra inteira e sufixo taxonômico', () => {
  assert.equal(identityMatch('a ESTILBITA–Na.', ['Estilbita-Na']), 'Estilbita-Na');
  assert.equal(identityMatch('Estilbita', ['Estilbita-Na']), undefined);
  assert.equal(identityMatch('Monazita-(Nd) e quartzo', ['Monazita-(Nd)']), 'Monazita-(Nd)');
  assert.equal(identityMatch('Quartzos e macroquartzo.', ['Quartzo']), undefined);
  assert.deepEqual(findNewIssues(['novo', 'conhecido'], ['conhecido', 'resolvido']), ['novo']);
});

test('falhas de rede e bloqueios não equivalem a imagens inexistentes', async () => {
  const sources = ['ok', 'ausente', 'bloqueado', 'rede', 'sem-head'].map(id => ({ src: `https://example.org/${id}` }));
  const fetch = async (url, request) => {
    if (url.endsWith('ok')) return new Response(null, { headers: { 'content-type': 'image/webp' } });
    if (url.endsWith('ausente')) return new Response(null, { status: 404 });
    if (url.endsWith('bloqueado')) return new Response(null, { status: 429 });
    if (url.endsWith('sem-head')) return request.method === 'HEAD'
      ? new Response(null, { status: 405 }) : new Response(null, { status: 206, headers: { 'content-type': 'image/jpeg' } });
    throw new Error('rede indisponível');
  };
  const results = await probeImages(sources, fetch);
  assert.deepEqual(results.map(result => result.status), ['disponível', 'indisponível', 'inconclusiva', 'inconclusiva', 'disponível']);
});
