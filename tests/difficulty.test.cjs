const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf("'use strict'", html.indexOf('<script'));
const end = html.indexOf('const root =', start);
assert.ok(start >= 0 && end > start, 'Lógica da partida não localizada');
const ctx = {};
vm.runInNewContext(html.slice(start, end) +
  '\nglobalThis.__test = {MINERALS,DIFFICULTIES,getDifficultyMinerals,getDifficultyGuesses,getEligibleForMode,getPhotoImages,getModeDailyId,getDailyId,getDailyModeSummary,MODES};',
  ctx, {timeout:30000});
const {MINERALS,DIFFICULTIES,getDifficultyMinerals,getDifficultyGuesses,getEligibleForMode,getPhotoImages,getModeDailyId,getDailyId,getDailyModeSummary,MODES}=ctx.__test;
const ids = arr => new Set(arr.map(m => m.id));
const easy=getDifficultyMinerals(MINERALS,'easy');
const medium=getDifficultyMinerals(MINERALS,'medium');
const hard=getDifficultyMinerals(MINERALS,'hard');
assert.deepEqual(Array.from(DIFFICULTIES,d=>d.id),['easy','medium','hard']);
assert.equal(easy.length,15,'Fácil deve ter exatamente 15 espécies');
assert.equal(medium.length,45,'Médio deve ter exatamente 45 espécies');
assert.equal(hard.length,MINERALS.filter(m=>m.playable).length,'Difícil deve incluir todas as espécies jogáveis cadastradas');
for(const m of easy)assert.ok(ids(medium).has(m.id),'Médio contém Fácil: '+m.name);
for(const m of medium)assert.ok(ids(hard).has(m.id),'Difícil contém Médio: '+m.name);
for(const level of ['easy','medium','hard']){
  const classic=getEligibleForMode(MINERALS,'classic',level);
  const descriptions=getEligibleForMode(MINERALS,'description',level);
  const photos=getEligibleForMode(MINERALS,'photo',level);
  assert.ok(photos.every(m=>getPhotoImages(m)?.length===2),'Apenas espécies com 2 fotos válidas');
  assert.ok(descriptions.every(m=>m.ppl && m.xpl),'Descrição necessita de dados ópticos');
  assert.ok(classic.length>=photos.length,'Imagem não excede a base por dificuldade');
}
assert.equal(getEligibleForMode(MINERALS,'photo','easy').length,15,'Os 15 iniciais devem ter duas fotos');
assert.equal(getEligibleForMode(MINERALS,'photo','medium').length,45,'Os 45 intermediários devem ter duas fotos');
assert.ok(getEligibleForMode(MINERALS,'photo','hard').length>58,'Fotos sem pares ND/NC aumentam o número de respostas');
assert.ok(getEligibleForMode(MINERALS,'photo','hard').some(m=>m.id==='actinolita'));
assert.ok(getDifficultyGuesses(MINERALS,'classic','hard').some(m=>m.id==='biotita'),'Biotita mantém o palpite legado');
assert.ok(!getDifficultyGuesses(MINERALS,'classic','easy').some(m=>m.id==='biotita'),'O Fácil não exibe referências fora da sua lista');
assert.equal(getDifficultyGuesses(MINERALS,'photo','easy').length,15);

const image=(src,verifiedForSpecies=true)=>({src,verifiedForSpecies});
assert.equal(getPhotoImages({id:'teste',images:[image('data:image/png;base64,A')]}),null,'Uma imagem não basta');
assert.equal(getPhotoImages({id:'teste',images:[image('data:image/png;base64,A'),image('data:image/png;base64,A')]}),null,'Não duplicar a mesma imagem');
assert.equal(getPhotoImages({id:'teste',images:[image('data:image/png;base64,A'),image('data:image/png;base64,B',false)]}),null,'Foto genérica de grupo não serve');
assert.equal(getPhotoImages({id:'teste',images:[image('data:image/png;base64,A'),image('data:image/png;base64,B')]}).length,2,'Duas fotos verificadas bastam sem PPL/XPL');

for (const level of ['easy','medium','hard']) {
  for(const mode of MODES) {
    const subset=ids(getEligibleForMode(MINERALS,mode.id,level));
    for(let day=1;day<=90;day+=9) {
      const date=new Date(Date.UTC(2026,0,day)).toISOString().slice(0,10);
      const target=getModeDailyId(MINERALS,date,mode.id,level);
      assert.ok(subset.has(target),mode.id+' / '+level+': resposta fora da base');
      assert.equal(target,getModeDailyId(MINERALS,date,mode.id,level),'Resposta diária deve ser determinística');
    }
  }
}
assert.equal(getModeDailyId(MINERALS,'2026-11-15','classic','hard'),getDailyId(MINERALS,'2026-11-15'),'Clássico/Difícil mantém o desafio anterior');
for(const level of ['easy','medium']){
  const summaries=getDailyModeSummary(MINERALS,MODES,'2026-11-15',()=>({}),level);
  assert.equal(summaries.length,3);
  assert.ok(summaries.every(m=>m.status==='available'));
}
assert.match(html,/id="difficulty"/,'Seletor deve existir junto aos modos de partida');
assert.match(html,/data-run-mode="daily"/,'O modo Diário deve permanecer');
assert.match(html,/data-run-mode="training"/,'O modo Treino deve permanecer');
assert.match(html,/petrodle:difficulty/,'Dificuldade persistida');
assert.ok(html.includes("legacy+':'+difficulty"),'Chaves separadas entre níveis para não misturar progresso');
const stage=html.slice(html.indexOf('function challengeImage()'),html.indexOf('function challengeClues()'));
assert.doesNotMatch(stage,/photo-pair-label|pair\.ppl|pair\.xpl/,'As imagens não devem receber rótulos PPL/XPL');
console.log('OK: dificuldades 15 / 45 / base inteira, fotos sem par, progresso e desafios independentes');
