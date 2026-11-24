const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { getGame } = require('./load-game.cjs');

const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'docs', 'AUDITORIA_DO_CATALOGO.md');
const BASELINE = path.join(ROOT, 'data', 'audit-baseline.json');
const GAME_SYMBOLS = ['MINERALS', 'MODES', 'DIFFICULTIES', 'BOARD_KEYS', 'buildProgressiveClues',
  'getAvailableHintCount', 'getEligibleForMode', 'getDifficultyGuesses', 'getPhotoImages', 'getPhotoPair',
  'getPlayableState', 'getSuggestionImage'];
const GUIDE_FIELDS = ['formula', 'associations', 'habit', 'ppl', 'xpl', 'cleavageDescription'];
const PENDING_EVIDENCE = {
  Argilominerais: 'Evidência de estrutura cristalina que distinga os polimorfos, como um padrão de difração',
  Biotita: 'Composição das micas, em particular Fe/Mg e Al',
  Chabazita: 'Predominância de Ca ou Na em relação aos demais cátions extrarreticulares',
  Clorita: 'Predominância de Fe ou Mg na composição',
  'Turmalina (Grupo)': 'Composição e ocupação dos sítios por Mg, Fe, Li e Al',
  Estilbita: 'Predominância de Ca ou Na na posição extrarreticular',
  Olivina: 'Proporção Mg/Fe e posição na série composicional',
  'Hornblenda Verde': 'Composição e classificação da hornblenda, incluindo a relação Fe/Mg',
  Apatita: 'Informação capaz de distinguir a predominância de F ou OH',
  Apofilita: 'Informação capaz de distinguir a predominância de F ou OH',
  Heulandita: 'Predominância de Ca ou Na em relação aos demais cátions extrarreticulares',
  Escapolita: 'Composição da escapolita, incluindo a distinção Na/Cl e Ca/carbonato',
  Monazita: 'Elemento de terras raras predominante entre Ce, La e Nd',
  Opacos: 'Caracterização em luz refletida ou evidência composicional, como a presença de Ni',
  Lepidolita: 'Composição e proporção Li/Al nas micas',
  Pumpellyita: 'Composição Mg/Fe e estado de oxidação do ferro',
};

function readLegacyGame(html) {
  const start = html.indexOf("'use strict'", html.indexOf('<script'));
  const end = html.indexOf('const root =', start);
  if (start < 0 || end < start) throw new Error('Código da versão de referência não localizado.');
  return vm.runInNewContext(html.slice(start, end) + '\n;({' + GAME_SYMBOLS.join(',') + '})', {}, { timeout: 30000 });
}

function readGame() {
  return getGame([...GAME_SYMBOLS, 'getDiagnosticReview', 'getHintClues']);
}

function fold(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
    .replace(/[‐‑‒–—−]/g, '-').replace(/\s+/g, ' ').trim();
}

function identityMatch(value, identities) {
  const normalized = fold(value);
  return identities.find(identity => {
    const literal = fold(identity).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return literal.length >= 3 && new RegExp(`(?<![\\p{L}\\p{N}])${literal}(?![\\p{L}\\p{N}])`, 'u').test(normalized);
  });
}

function listPairs(items) {
  return items.flatMap((left, index) => items.slice(index + 1).map(right => [left, right]));
}

function availableClues(game, mode, mineral, guessCount) {
  const clues = game.buildProgressiveClues(mineral);
  const firstTerminalCount = Array.from({ length: 30 }, (_, count) => count)
    .find(count => game.getPlayableState(mode, Array(count).fill('não é o alvo'), mineral.id).ended);
  const optionalClues = game.getAvailableHintCount((firstTerminalCount ?? guessCount) - 1);
  if (game.getHintClues) return [
    ...(mode === 'description' ? clues.slice(0, 1) : []),
    ...game.getHintClues(mineral, mode).slice(0, optionalClues),
  ];
  if (mode === 'classic') return clues.slice(0, optionalClues);
  return clues.slice(0, optionalClues + Number(mode === 'description'));
}

function clueSignature(game, mode, mineral, clues) {
  const board = mode === 'classic' ? game.BOARD_KEYS.map(field => {
    const value = mineral[field];
    return Array.isArray(value) ? [...value].sort() : value;
  }) : null;
  const photos = mode === 'photo' ? (game.getPhotoImages(mineral) || []).map(image => image.src).sort() : null;
  return JSON.stringify({ board, photos, clues });
}

function dataGaps(minerals, fields) {
  return minerals.flatMap(mineral => fields.flatMap(field => {
    const value = mineral[field];
    const label = fold(value);
    if (label === 'variavel/nao informado') return [{ id: mineral.id, field, kind: 'variável ou ausente na fonte' }];
    if (value != null && !['', '-', 'nao informado', 'unknown', 'sem descricao optica nesta ficha.'].includes(label)
        && (!Array.isArray(value) || value.length)) return [];
    const notSilicate = field === 'silicateStructure' && Boolean(mineral.anionGroup) && fold(mineral.anionGroup) !== 'silicato';
    const isOpaque = mineral.parentGroup === 'Opacos' && ['colorPPL', 'relief', 'pleochroism', 'birefringence'].includes(field);
    return [{ id: mineral.id, field, kind: notSilicate || isOpaque ? 'inaplicável' : 'ausente' }];
  }));
}

function imageRecords(minerals) {
  const bySource = new Map();
  for (const mineral of minerals) {
    mineral.images.forEach((image, index) => {
      const { src } = image;
      const embedded = typeof src === 'string' && /^data:image\/[^;]+;base64,/.test(src);
      const remote = typeof src === 'string' && src.startsWith('https://');
      const asset = typeof src === 'string' && src.startsWith('assets/');
      const location = asset ? path.resolve(ROOT, src) : null;
      const localAvailable = Boolean(location?.startsWith(path.join(ROOT, 'assets') + path.sep) && existsSync(location));
      const identity = embedded ? createHash('sha256').update(Buffer.from(src.split(',')[1], 'base64')).digest('hex')
        : localAvailable ? createHash('sha256').update(readFileSync(location)).digest('hex') : src;
      const key = identity || 'sem origem';
      const record = bySource.get(key) || {
        src, remote, available: remote ? null : embedded || localAvailable, uses: [],
      };
      record.uses.push({
        id: mineral.id, index: index + 1, reference: mineral.parentGroup || mineral.referenceName || mineral.name,
        illustrative: image.illustrative === true || image.verifiedForSpecies === false,
      });
      bySource.set(key, record);
    });
  }
  return [...bySource.values()];
}

function collect(game) {
  const { MINERALS: minerals } = game;
  const issues = new Set();
  const rounds = game.MODES.flatMap(mode => game.DIFFICULTIES.map(difficulty => {
    const targets = game.getEligibleForMode(minerals, mode.id, difficulty.id);
    const guessCount = game.getDifficultyGuesses(minerals, mode.id, difficulty.id).length;
    const sameClues = new Map();
    const leaks = [];
    const groupMentions = [];
    for (const mineral of targets) {
      const clues = availableClues(game, mode.id, mineral, guessCount);
      const key = clueSignature(game, mode.id, mineral, clues);
      const group = sameClues.get(key) || [];
      group.push(mineral);
      sameClues.set(key, group);
      for (const clue of clues) {
        const name = identityMatch(clue.value, [mineral.name, ...mineral.aliases]);
        if (name) {
          leaks.push({ id: mineral.id, stage: clue.title, name });
          issues.add(`nome-visível:${mode.id}:${difficulty.id}:${mineral.id}:${clue.title}`);
        }
        const groupName = mineral.parentGroup?.replace(/ \(Grupo\)$/, '');
        if (groupName && identityMatch(clue.value, [groupName])) {
          groupMentions.push({ id: mineral.id, stage: clue.title, name: groupName });
        }
      }
    }
    const ambiguities = [...sameClues.values()].filter(group => group.length > 1).map(group => {
      const ids = group.map(mineral => mineral.id).sort();
      for (const [left, right] of listPairs(ids)) issues.add(`pistas-idênticas:${mode.id}:${difficulty.id}:${left}:${right}`);
      const sharedGroup = group.every(mineral => mineral.parentGroup === group[0].parentGroup) ? group[0].parentGroup : null;
      const review = game.getDiagnosticReview?.(ids[0]);
      const reviewedEvidence = ids.every(id => review?.alternatives.includes(id)) ? review.evidence : null;
      return {
        ids, group: sharedGroup, page: group[0].sourcePage,
        evidence: reviewedEvidence || PENDING_EVIDENCE[sharedGroup] || 'Observação ou resultado analítico capaz de distinguir as alternativas',
      };
    });
    return {
      mode: mode.id, modeName: mode.name, difficulty: difficulty.id, difficultyName: difficulty.name,
      targets: targets.map(mineral => mineral.id), ambiguities, leaks, groupMentions,
      photoPairs: mode.id === 'photo' ? targets.filter(game.getPhotoPair).length : 0,
    };
  }));

  const playable = minerals.filter(mineral => mineral.playable);
  const gaps = dataGaps(playable, [...game.BOARD_KEYS, ...GUIDE_FIELDS]);
  for (const gap of gaps.filter(item => item.kind !== 'inaplicável')) issues.add(`lacuna:${gap.id}:${gap.field}`);
  for (const mineral of playable.filter(item => !game.getSuggestionImage(item))) issues.add(`sem-foto:${mineral.id}`);
  const images = imageRecords(minerals);
  const missing = images.filter(image => image.available === false);
  for (const image of missing) {
    for (const use of image.uses) issues.add(`imagem-local-indisponível:${use.id}:${use.index}`);
  }
  const duplicates = images.filter(image => image.uses.length > 1).flatMap(image => {
    const ids = [...new Set(image.uses.map(use => use.id))].sort();
    const entries = [];
    for (const id of ids) {
      const uses = image.uses.filter(use => use.id === id);
      if (uses.length < 2) continue;
      issues.add(`imagem-repetida:${id}`);
      entries.push({ ...image, uses, scope: 'mesmo verbete' });
    }
    if (ids.length > 1) {
      const sharedReference = new Set(image.uses.map(use => use.reference)).size === 1;
      const nominalIds = new Set(image.uses.filter(use => !use.illustrative).map(use => use.id));
      const scope = sharedReference && nominalIds.size <= 1 ? 'grupo' : 'entre verbetes';
      if (scope !== 'grupo') {
        for (const [left, right] of listPairs(ids)) issues.add(`imagem-compartilhada:${left}:${right}`);
      }
      entries.push({ ...image, scope });
    }
    return entries;
  });
  return { minerals, rounds, gaps, images, missing, duplicates, formulaHint: Boolean(game.getHintClues), issues: [...issues].sort() };
}

function probeResult(response) {
  if (response.ok && response.headers.get('content-type')?.startsWith('image/')) return 'disponível';
  if ([404, 410].includes(response.status)) return 'indisponível';
  return 'inconclusiva';
}

async function probeImages(sources, fetcher = fetch) {
  async function probe({ src }) {
    try {
      const options = { redirect: 'follow', signal: AbortSignal.timeout(6000) };
      let response = await fetcher(src, { ...options, method: 'HEAD' });
      if ([405, 501].includes(response.status)) {
        response = await fetcher(src, { ...options, method: 'GET', headers: { Range: 'bytes=0-255' } });
      }
      const status = probeResult(response);
      await response.body?.cancel();
      return { src, status, detail: `HTTP ${response.status}` };
    } catch {
      return { src, status: 'inconclusiva', detail: 'falha de rede ou tempo limite' };
    }
  }

  const results = [];
  for (let index = 0; index < sources.length; index += 4) {
    results.push(...await Promise.all(sources.slice(index, index + 4).map(probe)));
  }
  return results;
}

function findNewIssues(issues, baseline) {
  const known = new Set(baseline);
  return issues.filter(issue => !known.has(issue));
}

function render(report, results = null) {
  const names = new Map(report.minerals.map(mineral => [mineral.id, mineral.name]));
  const hard = report.rounds.find(round => round.mode === 'description' && round.difficulty === 'hard');
  const remote = report.images.filter(image => image.remote);
  const lines = [
    '# Auditoria do catálogo',
    '',
    'Relatório gerado por `node scripts/audit.cjs --write`. `node scripts/audit.cjs --check` compara problemas por identificador com a [linha de base](../data/audit-baseline.json) e verifica se o relatório está atualizado. `node scripts/audit.cjs --reference` repete a análise com o catálogo e as regras do commit de referência, quando disponível no histórico local.',
    '',
    '## Cobertura por modo e dificuldade',
    '',
    '| Modo | Dificuldade | Alvos | Alvos com todas as pistas iguais | Menções ao nome ou sinônimo | Alvos com par PPL/XPL |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const round of report.rounds) {
    lines.push(`| ${round.modeName} | ${round.difficultyName} | ${round.targets.length} | ${round.ambiguities.reduce((count, group) => count + group.ids.length, 0)} | ${round.leaks.length} | ${round.mode === 'photo' ? round.photoPairs : '—'} |`);
  }
  lines.push('', 'A coluna de pistas iguais compara as dicas disponíveis antes do fim da partida. Inclui também a pista inicial do Descrição, as duas fotos do Imagem e os campos de comparação do Clássico. A busca por nomes verifica a denominação completa ou sinônimos com pelo menos três caracteres, aceitando variações de acento e de hífen. Menções ao grupo são registradas à parte.',
    '', '### Lacunas e imagens dos alvos elegíveis', '',
    '| Modo | Dificuldade | Alvos com lacuna | Alvos com imagem reutilizada | Alvos com imagem local ausente | Alvos com imagem externa | Alvos com imagem externa indisponível |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |');
  const gaps = new Set(report.gaps.filter(gap => gap.kind !== 'inaplicável').map(gap => gap.id));
  const useIds = images => new Set(images.flatMap(image => image.uses.map(use => use.id)));
  const duplicates = useIds(report.duplicates);
  const missing = useIds(report.missing);
  const external = useIds(remote);
  const unavailableUrls = new Set(results?.filter(result => result.status === 'indisponível').map(result => result.src));
  const brokenExternal = useIds(remote.filter(image => unavailableUrls.has(image.src)));
  for (const round of report.rounds) {
    const count = ids => round.targets.filter(id => ids.has(id)).length;
    lines.push(`| ${round.modeName} | ${round.difficultyName} | ${count(gaps)} | ${count(duplicates)} | ${count(missing)} | ${count(external)} | ${results ? count(brokenExternal) : '—'} |`);
  }
  lines.push('', 'As colunas contam verbetes elegíveis com pelo menos uma ocorrência no catálogo. O reuso inclui figuras de grupo documentadas. A disponibilidade externa é medida apenas com `--network`.',
    '', '### Alvos elegíveis', '');
  for (const round of report.rounds) {
    lines.push(`<details><summary>${round.modeName} · ${round.difficultyName}</summary>`, '',
      round.targets.map(id => names.get(id)).join(', ') + '.', '', '</details>', '');
  }
  lines.push('## Conjuntos indistinguíveis', '', '### Descrição · Difícil', '',
    'A revisão de referência `77bdd56` tinha 34 alvos do nível Difícil distribuídos em 15 conjuntos. '
      + `O catálogo desta auditoria tem ${hard.ambiguities.flatMap(group => group.ids).length} alvos em ${hard.ambiguities.length} conjuntos no mesmo nível.`,
    ...(report.formulaHint ? ['', 'A fórmula de referência passou a ser a terceira dica, disponível após nove palpites. A auditoria compara todas as dicas que podem ser reveladas antes do limite de dez tentativas. Os 15 conjuntos históricos e as evidências analíticas necessárias continuam documentados na [revisão científica](REVISAO_CIENTIFICA.md). A fórmula ideal fornecida pelo jogo identifica a resposta cadastrada e deve ser interpretada no escopo indicado na ficha.'] : []),
    '', '| Alternativas no Difícil | Verbete compartilhado no guia | Evidência a rever |',
    '| --- | --- | --- |');
  for (const group of hard.ambiguities) {
    const alternatives = group.ids.map(id => names.get(id)).join(', ');
    lines.push(`| ${alternatives} | ${group.group ? `${group.group}, p. ${group.page}` : 'Sem verbete único'} | ${group.evidence} |`);
  }
  lines.push('', 'A coluna de evidência indica o que precisaria ser documentado para separar as respostas. A [revisão científica](REVISAO_CIENTIFICA.md) registra as fontes e a justificativa. Os casos podem ser discutidos como hipóteses de grupo. A escolha da regra de aceitação continua pendente.');
  for (const round of report.rounds.filter(round => round !== hard && round.ambiguities.length)) {
    lines.push('', `### ${round.modeName} · ${round.difficultyName}`, '');
    for (const group of round.ambiguities) {
      const source = group.group === 'Argilominerais' ? ' [Manual de difração do USGS](https://pubs.usgs.gov/of/2001/of01-041/htmldocs/clays/kaogr.htm)' : '';
      lines.push(`- ${group.ids.map(id => names.get(id)).join(', ')}. ${group.evidence}.${source}`);
    }
  }
  lines.push('', '## Nomes e grupos nas pistas', '');
  for (const round of report.rounds) {
    const leaks = round.leaks.map(leak => `${names.get(leak.id)} (${leak.stage}, “${leak.name}”)`);
    lines.push(`- **${round.modeName} · ${round.difficultyName}** — ${leaks.length ? leaks.join('; ') : 'nenhum nome completo detectado'}. ${round.groupMentions.length} menções ao grupo.`);
  }
  lines.push('', '## Campos ausentes ou inaplicáveis nos alvos', '',
    '| Campo | Ausentes | Variável ou ausente na fonte | Inaplicáveis |',
    '| --- | --- | --- | --- |');
  for (const field of new Set(report.gaps.map(gap => gap.field))) {
    const taxa = ['ausente', 'variável ou ausente na fonte', 'inaplicável'].map(kind => report.gaps
      .filter(gap => gap.field === field && gap.kind === kind).map(gap => names.get(gap.id)));
    lines.push(`| ${field} | ${taxa.map(items => items.join(', ') || '—').join(' | ')} |`);
  }
  lines.push('', 'A estrutura silicática é inaplicável aos não silicatos. Para os verbetes derivados de Opacos, as propriedades ópticas que exigem transmissão são inaplicáveis. Nos demais campos, lacunas e classificações variáveis ou ausentes exigem revisão da referência.',
    '', '## Imagens', '',
    `- ${report.images.length} origens únicas por hash do arquivo local ou URL externa, com ${remote.length} URLs externas.`,
    `- ${report.missing.length} origens locais ausentes ou inválidas${report.missing.length ? `: ${report.missing.map(image => image.src || 'sem URL').join(', ')}.` : '.'}`,
    `- ${new Set(report.duplicates.map(image => image.src)).size} origens repetidas. A ocorrência é identificada pelo nome do verbete e a posição da imagem na ficha.`);
  for (const scope of ['mesmo verbete', 'grupo', 'entre verbetes']) {
    lines.push('', `### Reuso em ${scope}`, '');
    const duplicates = report.duplicates.filter(duplicate => duplicate.scope === scope);
    if (!duplicates.length) lines.push('Nenhuma ocorrência.');
    for (const duplicate of duplicates) {
      lines.push(`- ${duplicate.uses.map(use => `${names.get(use.id)} #${use.index}${use.illustrative ? ' (ilustrativa)' : ''}`).join(', ')}`);
    }
  }
  lines.push('', '### Disponibilidade remota', '');
  if (!results) lines.push('As URLs externas ficam com estado desconhecido neste relatório. Consulte a [sondagem registrada](AUDITORIA_REDE.md) ou execute `node scripts/audit.cjs --network` para uma nova consulta. HTTP 404/410 indica indisponibilidade na consulta. Bloqueios, limites, falhas de conexão e respostas de tipo inesperado são inconclusivos.');
  else {
    for (const status of ['disponível', 'indisponível', 'inconclusiva']) {
      const rows = results.filter(result => result.status === status);
      lines.push(`- **${status}** — ${rows.length}.`);
      if (status !== 'disponível') for (const result of rows) lines.push(`  - <${result.src}> (${result.detail}).`);
    }
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const option = process.argv[2];
  if (process.argv.length > 3 || (option && !['--write', '--check', '--network', '--reference'].includes(option))) {
    throw new Error('Uso: node scripts/audit.cjs [--write | --check | --network | --reference]');
  }
  if (option === '--reference') {
    const { reference } = JSON.parse(readFileSync(BASELINE, 'utf8'));
    if (!/^[0-9a-f]{7,40}$/i.test(reference)) throw new Error('Referência histórica inválida.');
    const html = execFileSync('git', ['show', `${reference}:index.html`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8_000_000 });
    process.stdout.write(render(collect(readLegacyGame(html))));
    return;
  }
  const report = collect(readGame());
  const results = option === '--network' ? await probeImages(report.images.filter(image => image.remote)) : null;
  const markdown = render(report, results);
  if (option === '--write') writeFileSync(REPORT, markdown);
  else if (option === '--check') {
    const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
    const newIssues = findNewIssues(report.issues, baseline.issues);
    if (newIssues.length) throw new Error(`Novas pendências:\n${newIssues.join('\n')}`);
    if (readFileSync(REPORT, 'utf8').replaceAll('\r\n', '\n') !== markdown) {
      throw new Error('Relatório desatualizado. Reexecute node scripts/audit.cjs --write.');
    }
    console.log(`Auditoria atualizada, com ${report.issues.length} pendências conhecidas.`);
  } else process.stdout.write(markdown);
}

if (require.main === module) main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { collect, findNewIssues, identityMatch, probeImages, readGame, readLegacyGame, render };
