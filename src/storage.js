'use strict';

function stored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The current game remains playable when storage is disabled or full.
  }
}

function stateKey(gameMode, playMode, difficulty, day) {
  const legacy = `petrodle:v6:${playMode}:${gameMode}${playMode === 'daily' ? ':' + day : ''}`;
  return difficulty === 'hard' ? legacy : legacy + ':' + difficulty;
}

function reconcileProgress(raw, scheduled, validTargets, validGuesses, mode) {
  const prior = raw && typeof raw === 'object' ? raw : {};
  const hasPriorTarget = validTargets.has(prior.targetId);
  const targetId = hasPriorTarget ? prior.targetId : scheduled.id;
  const dailyVersion = targetId === scheduled.id ? scheduled.version : 'legacy-v6';
  const guesses = hasPriorTarget && Array.isArray(prior.guesses)
    ? [...new Set(prior.guesses.filter(id => id === targetId || validGuesses.has(id)))]
    : [];
  if (mode !== 'classic') guesses.splice(8);
  const winIndex = guesses.indexOf(targetId);
  if (winIndex >= 0) guesses.splice(winIndex + 1);
  const hintCount = Number.isInteger(prior.hintCount)
    ? Math.max(0, Math.min(prior.hintCount, getAvailableHintCount(guesses.length), mode === 'description' ? 5 : 6))
    : 0;
  return {targetId, dailyVersion, guesses, hintCount};
}

function readDailyProgress(minerals, day, mode, difficulty, prior) {
  const scheduled = getScheduledTarget(minerals, day, mode, difficulty);
  const eligible = getEligibleForMode(minerals, mode, difficulty);
  const known = new Set(minerals.map(m => m.id));
  const historic = DAILY_VERSIONS.flatMap(version => version.pools[mode][difficulty]);
  const targets = new Set([scheduled.id, ...historic.filter(id => known.has(id)), ...eligible.map(m => m.id)]);
  const guesses = new Set([...targets, ...getDifficultyGuesses(minerals, mode, difficulty).map(m => m.id)]);
  return reconcileProgress(prior, scheduled, targets, guesses, mode);
}

function chooseTraining(gameMode, previous, difficulty) {
  const eligible = getEligibleForMode(MINERALS, gameMode, difficulty);
  const options = eligible.length === 1 ? eligible : eligible.filter(m => m.id !== previous);
  return options[Math.floor(Math.random() * options.length)]?.id ?? null;
}

function load(gameMode, playMode, difficulty, day) {
  const prior = stored(stateKey(gameMode, playMode, difficulty, day), null);
  let progress;
  if (playMode === 'daily') {
    progress = readDailyProgress(MINERALS, day, gameMode, difficulty, prior);
  } else {
    const targets = new Set(getEligibleForMode(MINERALS, gameMode, difficulty).map(m => m.id));
    const guesses = new Set(getDifficultyGuesses(MINERALS, gameMode, difficulty).map(m => m.id));
    progress = reconcileProgress(prior, {id: chooseTraining(gameMode, null, difficulty), version: null}, targets, guesses, gameMode);
    progress.dailyVersion = null;
  }
  return {gameMode, playMode, difficulty, ...progress, message: ''};
}

function writeProgress(state, day) {
  const {gameMode, playMode, difficulty, dailyVersion, targetId, guesses, hintCount} = state;
  save(stateKey(gameMode, playMode, difficulty, day), {targetId, dailyVersion, guesses, hintCount});
  save('petrodle:gameMode', gameMode);
  save('petrodle:runMode', playMode);
  save('petrodle:difficulty', difficulty);
}
