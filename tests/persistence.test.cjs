const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getGame } = require('../scripts/load-game.cjs');

test('desafio arquivado conserva seu alvo quando o catálogo ganha um mineral', () => {
  const { MINERALS, getScheduledTarget, getModeDailyId } = getGame([
    'MINERALS', 'getScheduledTarget', 'getModeDailyId'
  ]);
  const day = '2026-11-15';
  const expected = getModeDailyId(MINERALS, day, 'classic', 'hard');
  const expanded = [{ ...MINERALS.find(m => m.playable), id: 'novo-mineral' }, ...MINERALS];
  assert.equal(getScheduledTarget(expanded, day, 'classic', 'hard').id, expected);
});

test('progresso legado mantém o alvo e os palpites válidos quando a edição difere', () => {
  const { reconcileProgress } = getGame(['reconcileProgress']);
  const allowed = new Set(['quartzo', 'calcita']);
  const progress = reconcileProgress(
    { targetId: 'calcita', guesses: ['quartzo', 'quartzo', 'inexistente', 'calcita'], hintCount: 4.8 },
    { id: 'quartzo', version: 'v1' }, allowed, allowed, 'classic'
  );
  assert.equal(progress.targetId, 'calcita');
  assert.deepEqual(Array.from(progress.guesses), ['quartzo', 'calcita']);
  assert.equal(progress.hintCount, 0);
  assert.equal(reconcileProgress(null, { id: 'quartzo', version: 'v1' }, allowed, allowed, 'classic').targetId, 'quartzo');
});

test('um alvo diário arquivado continua sendo aceito após sair da lista de treino', () => {
  const { MINERALS, getDailyGuessPool, getDifficultyGuesses, readDailyProgress, resolveGuess } = getGame([
    'MINERALS', 'getDailyGuessPool', 'getDifficultyGuesses', 'readDailyProgress', 'resolveGuess'
  ]);
  const updated = MINERALS.map(m => m.id === 'microclinio' ? { ...m, playable: false, guessable: false } : m);
  const progress = readDailyProgress(updated, '2026-11-16', 'classic', 'easy', {
    targetId: 'microclinio', guesses: ['quartzo']
  });
  assert.deepEqual(Array.from(progress.guesses), ['quartzo']);
  const daily = getDailyGuessPool(updated, 'classic', 'easy', progress.targetId);
  const training = getDifficultyGuesses(updated, 'classic', 'easy');
  assert.equal(resolveGuess(daily, 'Microclínio').id, 'microclinio');
  assert.equal(resolveGuess(training, 'Microclínio').status, 'choose');
});

test('o diário usa a curadoria nova na data marcada e mantém a lista histórica até então', () => {
  const { MINERALS, MODES, getScheduledTarget, getDailyGuessPool, getEligibleForMode } = getGame([
    'MINERALS', 'MODES', 'getScheduledTarget', 'getDailyGuessPool', 'getEligibleForMode'
  ]);
  const yesterday = getScheduledTarget(MINERALS, '2026-11-16', 'classic', 'easy');
  assert.equal(yesterday.id, 'microclinio');
  const archived = getDailyGuessPool(MINERALS, 'classic', 'easy', yesterday.id, '2026-11-16');
  assert.ok(archived.some(mineral => mineral.id === 'barita'));
  assert.ok(!archived.some(mineral => mineral.id === 'forsterita'));
  for (const { id: mode } of MODES) {
    for (const difficulty of ['easy', 'medium']) {
      const day = '2026-11-17';
      const revised = getScheduledTarget(MINERALS, day, mode, difficulty);
      assert.notEqual(revised.version, yesterday.version);
      const current = getEligibleForMode(MINERALS, mode, difficulty).map(m => m.id).sort();
      const daily = getDailyGuessPool(MINERALS, mode, difficulty, revised.id, day).map(m => m.id).sort();
      assert.ok(current.includes(revised.id));
      assert.deepEqual(daily, current);
    }
  }
});
