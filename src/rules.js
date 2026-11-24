'use strict';

const RELIEF_LABELS = ['—','Baixo','Médio','Alto'];
const PLEO_LABELS = ['Ausente','Discreto','Moderado','Forte'];
const BIREF_LABELS = ['Isotrópico','Muito baixa','Baixa','Moderada','Alta'];
const CLEAVAGE = {
  none: {label:'Ausente',n:0}, poor: {label:'Pobre',n:0},
  one: {label:'1 direção',n:1}, two90:{label:'2 ~90°',n:2},
  two120:{label:'2 ~60°/120°',n:2}, threeRh:{label:'3 romboédricas',n:3}, three90:{label:'3 ~90°',n:3},
  unknown:{label:'Não informada',n:null}
};

const COLOR_LABELS = {incolor:'Incolor',colorido:'Colorido',variável:'Variável'};



function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
}
function formatChemicalFormula(value) {
 const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹';
 const subscripts='₀₁₂₃₄₅₆₇₈₉';
 return String(value??'').split(/( · An.*)/).map((part,index)=>{
   if(index%2)return part;
   return part
     .replace(/\.(?=\d+H2O\b)/g,'·')
     .replace(/([A-Z][a-z]?)(?:(\d+)(\+|[−-](?!\d))|([+−-])(\d+))/g,
       (_,element,number,sign,leadingSign,followingNumber)=>
         element+(number||followingNumber).replace(/\d/g,digit=>superscripts[digit])+
         ((sign||leadingSign)==='+'?'⁺':'⁻'))
     .replace(/(?<=[A-Za-z)\]⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹])\d+(?:[.,]\d+)?(?:[-–]\d+(?:[.,]\d+)?)?/g,
       number=>number.replace(/\d/g,digit=>subscripts[digit]));
 }).join('');
}
function isGuessable(m) {return Boolean(m&&(m.guessable??m.playable));}
function searchMinerals(minerals, query, max=8) {
  const q = normalizeText(query);
  if (!q) return minerals.filter(isGuessable).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).slice(0,max);
  return minerals.filter(m=>isGuessable(m)&&[m.name,...m.aliases].some(s=>normalizeText(s).includes(q)))
    .sort((a,b)=>Number(normalizeText(b.name).startsWith(q))-Number(normalizeText(a.name).startsWith(q)) || a.name.localeCompare(b.name,'pt-BR'))
    .slice(0,max);
}
function resolveGuess(minerals, rawName, previousGuesses=[]) {
 const query=normalizeText(rawName);
 if(!query)return {status:'empty'};
 const direct=minerals.find(m=>isGuessable(m)&&(normalizeText(m.name)===query||(m.aliases||[]).some(a=>normalizeText(a)===query)));
 const found=searchMinerals(minerals,query,2);
 const mineral=direct||(found.length===1?found[0]:null);
 if(!mineral)return {status:'choose'};
 if(previousGuesses.includes(mineral.id))return {status:'duplicate'};
 return {status:'ready',id:mineral.id};
}
const isUnknown = v=>v===null||v===undefined||v===''||v==='—'||v==='Variável/não informado'||v==='Não informado'||v==='unknown';
const unknown = {status:'unknown',direction:null};
function compareCrystalSystem(a,b) {
 if(isUnknown(a)||isUnknown(b)||a==='Polimórfico'||b==='Polimórfico')return unknown;
 if(a===b)return {status:'correct',direction:null};
 const choices=str=>str.toLocaleLowerCase('pt-BR').split(/\s+ou\s+/).map(x=>x.trim());
 const A=choices(a),B=choices(b);
 return {status:A.some(x=>B.includes(x))?'partial':'absent',direction:null};
}
const exact=(a,b)=>isUnknown(a)||isUnknown(b)?unknown:{status:a===b?'correct':'absent',direction:null};
const ordinal=(a,b)=>isUnknown(a)||isUnknown(b)?unknown:{status:a===b?'correct':Math.abs(a-b)===1?'partial':'absent',direction:a<b?'up':a>b?'down':null};
function compareCations(a,b) {
  if(!Array.isArray(a)||!Array.isArray(b)||!a.length||!b.length)return unknown;
  const A=new Set(a),B=new Set(b);
  if(A.size===B.size&&[...A].every(x=>B.has(x)))return {status:'correct',direction:null};
  return {status:[...A].some(x=>B.has(x))?'partial':'absent',direction:null};
}
function gradeGuess(guess,target) {
  if(!guess||!target)throw new Error('Mineral inválido');
  const g= CLEAVAGE[guess.cleavage]; const t=CLEAVAGE[target.cleavage];
  const cleavage=(!g||!t||g.n===null||t.n===null)?unknown:{status:guess.cleavage===target.cleavage?'correct':g.n===t.n?'partial':'absent',direction:null};
  return {win:guess.id===target.id,properties:{
    family:exact(guess.family,target.family),system:compareCrystalSystem(guess.system,target.system),
    colorPPL:(guess.colorPPL===null||target.colorPPL===null?unknown:guess.colorPPL===target.colorPPL?{status:'correct',direction:null}:guess.colorPPL==='variável'||target.colorPPL==='variável'?{status:'partial',direction:null}:{status:'absent',direction:null}),
    relief:ordinal(guess.relief,target.relief),pleochroism:ordinal(guess.pleochroism,target.pleochroism),
    cleavage,twinning:exact(guess.twinning,target.twinning),
    birefringence:ordinal(guess.birefringence,target.birefringence),
    anionGroup:exact(guess.anionGroup,target.anionGroup),
    silicateStructure:exact(guess.silicateStructure,target.silicateStructure),
    cations:compareCations(guess.cations,target.cations)
  }};
}
function shuffleIndices(length,seed) {
 const result=Array.from({length},(_,i)=>i);let x=seed>>>0;
 for(let i=length-1;i>0;i--) { x=(Math.imul(x,1664525)+1013904223)>>>0; const j=x%(i+1);[result[i],result[j]]=[result[j],result[i]]; }
 return result;
}
function getPuzzleNumber(dayString) {
 const date=Date.parse(`${dayString}T00:00:00Z`); const start=Date.parse('2026-01-01T00:00:00Z');
 if(!Number.isFinite(date))throw new Error('Data inválida');return Math.floor((date-start)/86400000)+1;
}
function getDailyId(minerals, dayString) {
  return selectDailyId(minerals.filter(m => m.playable).map(m => m.id), dayString, 'classic', 'hard');
}
function validateMinerals(minerals) {
 const errors=[],ids=new Set();
 for(const m of minerals) {
  if(!m.id||!m.name||ids.has(m.id))errors.push(`ID incorreto ou duplicado: ${m.name}`);
  ids.add(m.id);
  if(typeof m.playable!=='boolean'||!m.sourcePage||!Array.isArray(m.images)||!Array.isArray(m.aliases)) errors.push(`Origem incompleta: ${m.name}`);
  if(!Array.isArray(m.cations))errors.push(`Cátions inválidos: ${m.name}`);
  if(m.playable && (!m.anionGroup||!m.formula||!m.ppl||!m.xpl))errors.push(`Sem dados suficientes para jogar: ${m.name}`);
  if(m.relief!==null&&![1,2,3].includes(m.relief))errors.push(`Relevo inválido: ${m.name}`);
  if(m.pleochroism!==null&&![0,1,2,3].includes(m.pleochroism))errors.push(`Pleocroísmo inválido: ${m.name}`);
  if(m.birefringence!==null&&![0,1,2,3,4].includes(m.birefringence))errors.push(`Birrefringência inválida: ${m.name}`);
  if(![null,'incolor','colorido','variável'].includes(m.colorPPL))errors.push(`Cor em PPL inválida: ${m.name}`);
  if(!CLEAVAGE[m.cleavage])errors.push(`Clivagem inválida: ${m.name}`);
 }
 return errors;
}
function buildShareText({mode,date,guesses,won,targetId}) {
 const label=mode==='daily'?`#${getPuzzleNumber(date)}`:'Treinamento';
 const finalTargetId=mode==='daily'?getDailyId(MINERALS,date):targetId;
 const target=MINERALS.find(m=>m.id===finalTargetId);
 const emoji={correct:'🟩',partial:'🟨',absent:'⬜',unknown:'◻️'};
 const keys=BOARD_KEYS;
 const grid=guesses.map(id=>{const guess=MINERALS.find(m=>m.id===id);
   if(!guess||!target)return '';
   const props=gradeGuess(guess,target).properties;
   return keys.map(k=>emoji[props[k].status]).join('');
 }).filter(Boolean).join('\n');
 return `Petrodle ${label} ${won?'✅':'🔬'}\n${guesses.length} ${guesses.length===1?'palpite':'palpites'}\n\n${grid}\n\n#Petrodle`;
}

// Campos exibidos em uma única tabela comparativa.
const BOARD_COLUMNS = Object.freeze([
  {key:'anionGroup', label:'Classe aniônica', group:'chemical'},
  {key:'silicateStructure', label:'Estrutura', group:'chemical'},
  {key:'cations', label:'Cátions', group:'chemical'},
  {key:'family', label:'Família', group:'classification'},
  {key:'system', label:'Sistema', group:'classification'},
  {key:'colorPPL', label:'Cor em PPL', group:'optical'},
  {key:'relief', label:'Relevo', group:'optical'},
  {key:'pleochroism', label:'Pleocroísmo', group:'optical'},
  {key:'cleavage', label:'Clivagem', group:'optical'},
  {key:'twinning', label:'Geminação', group:'optical'},
  {key:'birefringence', label:'Birrefringência', group:'optical'},
]);
const BOARD_KEYS = Object.freeze(BOARD_COLUMNS.map(({key})=>key));


const MODES = Object.freeze([
 {id:'classic', name:'Clássico',subtitle:'Propriedades mineralógicas',icon:'sliders'},
 {id:'photo',name:'Imagem',subtitle:'Mineralogia em imagens',icon:'eye'},
 {id:'description',name:'Descrição',subtitle:'Características ópticas',icon:'file'},
]);
const DIFFICULTIES=Object.freeze([{id:'easy',name:'Fácil'},{id:'medium',name:'Médio'},{id:'hard',name:'Difícil'}]);
// Curadoria petrográfica e referências em docs/DIFICULDADES.md.
const EASY_MINERAL_IDS = new Set([
  'quartzo', 'albita', 'ortoclasio', 'microclinio', 'muscovita',
  'augita', 'diopsidio', 'enstatita', 'forsterita', 'gipso',
  'calcita', 'dolomita', 'epidoto', 'magnetita', 'hematita'
]);
const MEDIUM_MINERAL_IDS = new Set([
  ...EASY_MINERAL_IDS,
  'almandina', 'andalusita', 'cianita', 'sillimanita', 'estaurolita', 'cordierita',
  'actinolita', 'tremolita', 'clinocloro', 'talco', 'magnesio-hornblenda', 'clinozoisita',
  'zoisita', 'anortita', 'antigorita', 'zircao', 'titanita', 'ilmenita',
  'fluorapatita', 'rutilo', 'pirita', 'caulinita', 'barita', 'anidrita',
  'aragonita', 'goethita', 'siderita', 'nefelina', 'sanidina', 'flogopita'
]);
function getDifficultyMinerals(minerals,difficulty='hard'){
 const species=minerals.filter(m=>m.playable);
 if(difficulty==='easy')return species.filter(m=>EASY_MINERAL_IDS.has(m.id));
 if(difficulty==='medium')return species.filter(m=>MEDIUM_MINERAL_IDS.has(m.id));
 return species;
}
function getDifficultyGuesses(minerals,mode,difficulty='hard'){
 return difficulty==='hard'?minerals.filter(isGuessable):getEligibleForMode(minerals,mode,difficulty);
}

function getDailyGuessPool(minerals, mode, difficulty, targetId, day) {
  const ids = day && difficulty !== 'hard' ? getDailyVersion(day).pools[mode][difficulty] : null;
  const allowed = ids
    ? minerals.filter(m => ids.includes(m.id)).map(m => isGuessable(m) ? m : {...m, guessable: true})
    : getDifficultyGuesses(minerals, mode, difficulty);
  if (allowed.some(m => m.id === targetId)) return allowed;
  const archived = minerals.find(m => m.id === targetId);
  return archived ? [...allowed, {...archived, guessable: true}] : allowed;
}
function isLocalMineralPhoto(image) {
  return typeof image?.src === 'string' && /^(assets\/minerals\/|data:image\/)/.test(image.src);
}

function getPhotoPair(mineral) {
  const verified = (mineral?.images ?? []).filter(im => im.verifiedForSpecies !== false && isLocalMineralPhoto(im));
  const ppl = verified.find(im => im.lighting === 'PPL');
  const xpl = verified.find(im => im.lighting === 'XPL' && im.src !== ppl?.src);
  return ppl && xpl ? {ppl, xpl} : null;
}

function getPhotoImages(mineral) {
  const pair = getPhotoPair(mineral);
  if (pair) return [pair.ppl, pair.xpl];
  const verified = (mineral?.images ?? []).filter(im => im.verifiedForSpecies !== false && isLocalMineralPhoto(im));
  const distinct = [...new Map(verified.map(im => [im.src, im])).values()];
  return distinct.length >= 2 ? distinct.slice(0, 2) : null;
}

function getEligibleForMode(minerals,mode,difficulty='hard'){
 const eligible=getDifficultyMinerals(minerals,difficulty);
 if(mode==='photo')return eligible.filter(m=>Boolean(getPhotoImages(m)));
 if(mode==='description')return eligible.filter(m=>m.ppl&&m.xpl&&!m.ppl.startsWith('Sem descrição'));
 return eligible;
}
function hash32(str){let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function selectDailyId(ids, date, mode, difficulty) {
  if (!ids.length) throw new Error('Não há minerais elegíveis para este desafio');
  if (mode === 'classic' && difficulty === 'hard') {
    const offset = getPuzzleNumber(date) - 1;
    const cycle = Math.floor(offset / ids.length);
    const order = shuffleIndices(ids.length, (0x657a2e03 ^ (cycle * 4294967291)) >>> 0);
    return ids[order[((offset % ids.length) + ids.length) % ids.length]];
  }
  const dayIndex = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  if (!Number.isFinite(dayIndex)) throw new Error('Data inválida');
  const order = [...ids].sort();
  const key = difficulty === 'hard' ? mode : mode + ':' + difficulty;
  return order[(hash32(key + ':' + Math.floor(dayIndex / order.length)) + ((dayIndex % order.length) + order.length) % order.length) % order.length];
}

function getModeDailyId(minerals, date, mode, difficulty = 'hard') {
  return selectDailyId(getEligibleForMode(minerals, mode, difficulty).map(m => m.id), date, mode, difficulty);
}

function getDailyVersion(date) {
  return DAILY_VERSIONS.findLast(version => version.from <= date) ?? DAILY_VERSIONS[0];
}

function getScheduledTarget(minerals, date, mode, difficulty = 'hard') {
  const version = getDailyVersion(date);
  const history = DAILY_HISTORY[date];
  const historicId = history?.targets[mode]?.[difficulty];
  const id = historicId ?? selectDailyId(version.pools[mode][difficulty], date, mode, difficulty);
  if (!minerals.some(m => m.id === id)) throw new Error('Alvo arquivado ausente do catálogo: ' + id);
  return {id, version: historicId ? history.sha.slice(0, 7) : version.id};
}

function redactMineralName(text,mineral) {
 const source=String(text??'').replace(/\s+/g,' ').trim();
 const names=[mineral.name,...(mineral.aliases||[])].filter(n=>typeof n==='string'&&n.length>=3);
 const normalized=names.map(n=>normalizeText(n));
 const editDistance=(a,b)=>{
  if(Math.abs(a.length-b.length)>2)return 3;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const next=[i];
   for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   prev=next;
  }
  return prev[b.length];
 };
 let complete=source;
  for (const name of names) {
    const literal = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wholeName = new RegExp(`(?<![\\p{L}\\p{N}])${literal}(?![\\p{L}\\p{N}])`, 'giu');
    complete = complete.replace(wholeName, '[mineral]');
  }
 let result=complete.replace(/\p{L}[\p{L}\p{M}]*/gu,word=>{
  const token=normalizeText(word);
  return normalized.some(name=>!name.includes(' ')&&(token===name||
   (name.length>=7&&token.length>=6&&editDistance(token,name)<=(name.length>=10?2:1))))
   ?'[mineral]':word;
 });
 return result;
}
function buildProgressiveClues(mineral){
 const raw=[
 ['Contexto geológico',mineral.associations || `Classe mineralógica: ${mineral.anionGroup}`],
 ['Hábito cristalino',mineral.habit || 'Hábito não indicado no guia.'],
 ['Em PPL',mineral.ppl],
 ['Em XPL',mineral.xpl],
 ['Clivagem',mineral.cleavageDescription || 'Não indicada.'],
 ['Química',`Classe: ${mineral.anionGroup||'não informada'}. Fórmula: ${mineral.formula||'não individualizada'}. Principais cátions: ${mineral.cations.join(', ')||'não informados'}.`]
 ];
 return raw.map(([title,value])=>({title,value:redactMineralName(value||'Não informado no guia.',mineral).slice(0,440)}));
}
const HINT_INTERVAL=3;
const MAX_ATTEMPTS=10;
function getHintClues(mineral,mode){
 const clues=buildProgressiveClues(mineral).slice(mode==='description'?1:0,-1);
 clues.splice(2,0,{
   title:'Fórmula química',
   value:redactMineralName(mineral.formula||'Fórmula não individualizada.',mineral)
 });
 return clues;
}
function getAvailableHintCount(guesses){return Math.max(0,Math.floor(guesses/HINT_INTERVAL));}
function getNextHintRequirement(guesses){return HINT_INTERVAL-(guesses%HINT_INTERVAL);}
function getHintStages(_guesses,clues,requested=0){return clues.slice(0,Math.min(clues.length,Math.max(0,requested)));}
function getPlayableState(mode,guesses,targetId){
 const won=guesses.includes(targetId);
 const lost=!won&&mode!=='classic'&&guesses.length>=MAX_ATTEMPTS;
 return {won,lost,ended:won||lost};
}


function getDailyModeSummary(minerals, modes, date, readProgress, difficulty = 'hard') {
  return modes.map(mode => {
    const {guesses, targetId} = readDailyProgress(minerals, date, mode.id, difficulty, readProgress(mode.id));
    const {won, lost} = getPlayableState(mode.id, guesses, targetId);
    return {...mode, attempts: guesses.length, status: won ? 'won' : lost ? 'lost' : guesses.length ? 'playing' : 'available'};
  });
}

function getMenuCoverImage(minerals,date,mode) {
 const secret=getScheduledTarget(minerals,date,mode).id;
 const photoMinerals=minerals.filter(m=>m.id!==secret && m.playable && m.images?.some(im=>im.verifiedForSpecies!==false&&isLocalMineralPhoto(im)));
 if(!photoMinerals.length)return null;
 const modeIdx={classic:8,photo:13,description:50}[mode]||0;
 const mineral=photoMinerals[modeIdx%photoMinerals.length];
 return {mineralId:mineral.id,src:mineral.images.find(im=>im.verifiedForSpecies!==false&&isLocalMineralPhoto(im)).src};
}

/** Interaction-only helpers; never substitute a group photograph for a species identification. */
function getSuggestionImage(mineral) {
 const pictures=Array.isArray(mineral?.images)?mineral.images.filter(im=>isLocalMineralPhoto(im) || /^https:\/\//i.test(im.src)):[];
 // Prefer imagens com identificação de espécie; na ausência, usar fotografia ilustrativa
 // do grupo, sempre sinalizada. Não utilizar ícone como substituto de fotografia.
 const verified=pictures.filter(im=>im.verifiedForSpecies!==false);
 return verified.find(isLocalMineralPhoto) || verified[0] || pictures[0] || null;
}
function getOfflineFallback(mineral) {
 return (mineral?.images||[]).find(im=>isLocalMineralPhoto(im) && im.verifiedForSpecies===false) || null;
}

function getRevealSchedule(count, interval = 180) {
  if (!Number.isSafeInteger(count) || count <= 0) return [];
  const step = Number.isFinite(interval) && interval > 0 ? interval : 180;
  return Array.from({length:count},(_,i)=>i*step);
}







function getLocalDateKey(date = new Date()) {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 return `${year}-${month}-${day}`;
}
