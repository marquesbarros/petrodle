const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getGame } = require('../scripts/load-game.cjs');

const { MINERALS, CATALOGUE, getPropertyProvenance, getDiagnosticReview } = getGame([
  'MINERALS', 'CATALOGUE', 'getPropertyProvenance', 'getDiagnosticReview'
]);
const mineral = id => MINERALS.find(record => record.id === id);

test('fórmulas revisadas distinguem extremos e mantêm procedência específica', () => {
  assert.equal(mineral('apatita').formula, 'Ca5(PO4)3(F,OH,Cl)');
  assert.equal(getPropertyProvenance(mineral('apatita'), 'formula').scope, 'group');
  assert.equal(mineral('chabazita-ca').formula, 'Ca2[Al4Si8O24]·13H2O');
  assert.equal(mineral('chabazita-na').formula, '(Na3K)[Al4Si8O24]·11H2O');
  assert.deepEqual(Array.from(mineral('chabazita-ca').cations), ['Ca', 'Al']);
  assert.equal(getPropertyProvenance(mineral('chabazita-na'), 'formula').source.page, 40);
  assert.equal(mineral('polilitionita').formula, 'KLi2AlSi4O10F2');
  assert.equal(mineral('pirrotita').formula, 'Fe7S8');
  assert.equal(mineral('chamosita').birefringence, 1);
  assert.equal(getPropertyProvenance(mineral('clinocloro'), 'birefringence').scope, 'group');
  assert.equal(mineral('meionita').birefringence, 4);
  assert.equal(getPropertyProvenance(mineral('marialita'), 'birefringence').scope, 'species');
});

test('notas diagnósticas cobrem os conjuntos auditados sem alterar IDs ou a origem da óptica', () => {
  assert.equal(CATALOGUE.diagnosticReviews.length, 16);
  const cases = CATALOGUE.diagnosticReviews.flatMap(review => Array.from(review.alternatives));
  assert.equal(new Set(cases).size, 36);
  for (const id of cases) {
    assert.ok(mineral(id)?.playable, id);
    assert.ok(getDiagnosticReview(id).evidence);
    assert.ok(getDiagnosticReview(id).sources.every(source => source.label && source.url));
  }
  assert.equal(getPropertyProvenance(mineral('estilbita-ca'), 'ppl').scope, 'group');
  assert.equal(getPropertyProvenance(mineral('estilbita-ca'), 'ppl').source.page, 87);
  assert.equal(getDiagnosticReview('quartzo'), null);
});
