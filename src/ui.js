'use strict';

(()=>{
const root = document.getElementById('app');
let today = getLocalDateKey();
const byId = new Map(MINERALS.map(m=>[m.id,m]));
const playable = MINERALS.filter(m => m.playable);
const labels=Object.fromEntries(BOARD_COLUMNS.map(c=>[c.key,c.label]));
const colors={correct:'Igual',partial:'Parcial',absent:'Diferente',unknown:'Sem comparação'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name,size=17)=>{
 const drawings={search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',book:'<path d="M5 20V4h14v16H5Zm0-3h14"/>',calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',shuffle:'<path d="M3 7h3c5 0 6 10 12 10h3m-4-4 4 4-4 4M3 17h3c5 0 6-10 12-10h3m-4-4 4 4-4 4"/>',right:'<path d="M5 12h14m-6-6 6 6-6 6"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 5m0 4h.01"/>',sliders:'<path d="M4 20v-9M4 7V4M12 20v-4M12 12V4M20 20v-8M20 8V4M2 11h4m4 5h4m4-8h4"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',volume:'<path d="M4 9v6h4l5 4V5L8 9H4Zm12-2a7 7 0 0 1 0 10M19 4a11 11 0 0 1 0 16"/>',file:'<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8m-8 4h8"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',trophy:'<path d="M8 21h8m-4-4v4M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4"/>',light:'<path d="M9 18h6m-5 4h4M9 16a6 6 0 1 1 6 0v2H9z"/>'};
 return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[name]||drawings.grid}</svg>`;
};
const logo='<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m8 3 8 0 5 7-9 11-9-11 5-7Z"/><path d="m8 3-2 7 6 11 6-11-2-7M3 10h18"/></svg>';
const initialGame=MODES.some(m=>m.id===stored('petrodle:gameMode','classic'))?stored('petrodle:gameMode','classic'):'classic';
const initialDifficulty=DIFFICULTIES.some(d=>d.id===stored('petrodle:difficulty','easy'))?stored('petrodle:difficulty','easy'):'easy';
let state=load(initialGame,stored('petrodle:runMode','daily')==='training'?'training':'daily',initialDifficulty,today);
function refreshDailyDate() {
 const currentDay = getLocalDateKey();
 if (currentDay === today) return false;
 today = currentDay;
 if (state.playMode === 'daily') state = load(state.gameMode, 'daily',state.difficulty,today);
 return true;
}
let view='home';
let suggestionItems=[],selection=-1;
let toastTimer;
function status(){return getPlayableState(state.gameMode,state.guesses,state.targetId);}
function persist(){writeProgress(state,today);}
function discoveries(){const ids=stored('petrodle:discovered',[]);return Array.isArray(ids)?[...new Set(ids.filter(id=>byId.get(id)?.playable))]:[];}
function discover(id){save('petrodle:discovered',[...new Set([...discoveries(),id])]);}
function displayValue(m,key){
 if(key==='colorPPL')return COLOR_LABELS[m.colorPPL]||'—';
 if(key==='cations')return m.cations.join(' · ')||'—';
 if(['anionGroup','silicateStructure','family','system'].includes(key))return m[key]||'—';
 if(key==='relief')return RELIEF_LABELS[m.relief]||'—';
 if(key==='pleochroism')return PLEO_LABELS[m.pleochroism]||'—';
 if(key==='birefringence')return BIREF_LABELS[m.birefringence]||'—';
 if(key==='cleavage')return CLEAVAGE[m.cleavage]?.label||'—';
 return m[key]||'—';
}
function cell(m,key,grading){
 const marks={correct:'✓',partial:'≈',absent:'×',unknown:'—'};
 const arr=grading.direction==='up'?'↑':grading.direction==='down'?'↓':'';
 const description=arr?(arr==='↑'?'O valor buscado é maior.':'O valor buscado é menor.'):'';
 const tip=`${labels[key]}. ${displayValue(m,key)}. ${colors[grading.status]}. ${description}`;
 return `<td class="cell ${grading.status}" aria-label="${esc(tip)}" title="${esc(tip)}">
   <span class="cell-content">${esc(displayValue(m,key))} <b class="direction">${arr}</b></span>
   <span class="cell-flag" aria-hidden="true">${marks[grading.status]}</span>
 </td>`;
}
function mineralThumbnail(mineral){
 const photo=getSuggestionImage(mineral);
 const fallback=photo?.external?getOfflineFallback(mineral):null;
 return `<span class="mineral-thumbnail">
   <span class="thumbnail-placeholder">${logo}</span>
   ${photo?`<img data-thumbnail loading="lazy" decoding="async" src="${esc(photo.src)}" alt="" ${fallback?`data-group-fallback="${esc(fallback.src)}"`:''}>
     <span class="thumbnail-scope" title="Imagem ilustrativa do grupo" ${photo.verifiedForSpecies===false?'':'hidden'}>Grupo</span>`:''}
 </span>`;
}
function bindThumbnails(scope){
 for(const image of scope.querySelectorAll('[data-thumbnail]')){
   const scopeLabel=image.parentElement.querySelector('.thumbnail-scope');
   function recover(){
     const fallback=image.dataset.groupFallback;
     if(fallback){
       delete image.dataset.groupFallback;
       scopeLabel.hidden=false;
       image.src=fallback;
     }else{
       image.hidden=true;
       scopeLabel.hidden=true;
     }
   }
   image.addEventListener('error',recover);
   if(image.complete&&!image.naturalWidth)recover();
 }
}
function classicBoard(){
 if(!state.guesses.length)return `<p class="board-empty">Seu primeiro palpite revela a comparação das propriedades.</p>`;
 const target=byId.get(state.targetId);
 const rows=[...state.guesses].reverse().map((id,i)=>{
   const m=byId.get(id), {properties}=gradeGuess(m,target);
   return `<tr><th scope="row" class="name-col"><span class="guess-mineral-wrap">${mineralThumbnail(m)}<span><span class="mineral-name">${esc(m.name)}</span><span class="mineral-index">#${state.guesses.length-i}</span></span></span></th>
     ${BOARD_KEYS.map(key=>cell(m,key,properties[key])).join('')}</tr>`;
 }).join('');
 return `${legend()}<p class="board-scroll-help">Deslize a tabela na horizontal para ver todas as propriedades.</p>
   <div class="board-scroll" role="region" tabindex="0" aria-label="Tabela química e óptica dos palpites">
     <table class="guess-board"><thead><tr><th scope="col">Mineral</th>${BOARD_COLUMNS.map(col=>`<th scope="col" class="head-${col.group}">${esc(col.label)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
   </div>`;
}
function photoLighting(image){
 switch(image.lighting){
   case 'PPL': return 'Luz polarizada plana (PPL)';
   case 'XPL': return 'Luz polarizada cruzada (XPL)';
   case 'reflected': return 'Luz refletida';
   default: return 'Iluminação sem confirmação';
 }
}
function challengeImage(){
 const images=getPhotoImages(byId.get(state.targetId));
 if(!images)return `<p class="photo-fallback">As fotomicrografias deste desafio estão indisponíveis.</p>`;
 return `<div class="image-stage"><div class="photo-pair" role="group" aria-label="Duas fotomicrografias do mineral secreto">
   ${images.map((im,i)=>`<figure class="photo-pair-item">
     <div class="challenge-photo-frame">
       <img class="challenge-photo" data-image-fallback src="${esc(im.src)}" alt="Fotomicrografia ${i+1} do mineral secreto" hidden>
       <span class="photo-loading" role="status">Carregando foto…</span>
       <div class="photo-fallback" hidden><p>Foto indisponível.</p><button type="button" data-retry-photo>Tentar novamente</button></div>
     </div>
     <figcaption><span class="photo-lighting">${esc(photoLighting(im))}</span><button type="button" class="photo-preview-button" data-photo-preview="${i}" disabled>Ampliar foto ${i+1}</button></figcaption>
   </figure>`).join('')}
   </div><p class="image-stage-caption">As fotos podem mostrar campos diferentes. Frank (2018).</p></div>`;
}
function formatClue(value){
 return value.length===440&&!/[.!?…]$/.test(value)?value.replace(/\s+\S+$/,'')+'…':value;
}
function challengeClues(){
 const [clue]=buildProgressiveClues(byId.get(state.targetId));
 return `<div class="description-stage"><section class="clue-row"><div><b>${esc(clue.title)}</b><p>${esc(formatClue(clue.value))}</p></div></section></div>`;
}
function otherBoard(){
 if(!state.guesses.length)return '';
 return `<div class="attempt-list">${state.guesses.map((id,i)=>`<div class="attempt-item ${id===state.targetId?'hit':''}">
   <span class="attempt-number">${i+1}</span><span class="guess-mineral-wrap">${mineralThumbnail(byId.get(id))}<b>${esc(byId.get(id).name)}</b></span><span class="attempt-status">${id===state.targetId?'Resposta do desafio':'Palpite incorreto'}</span>
 </div>`).join('')}</div>`;
}
function gallery(m){
 if(!m.images.length)return `<p class="photo-missing">Sem imagem atribuível a uma espécie específica neste verbete.</p>`;
 return `<div class="photo-gallery">${m.images.map(im=>`<figure><img loading="lazy" ${im.external?'data-external="1"':''} src="${esc(im.src)}" alt="${esc(im.external?`${im.imageType}; ${m.name}`:im.verifiedForSpecies===false?`Imagem ilustrativa de ${m.parentGroup||m.name} sem confirmação de espécie`:`Fotomicrografia do guia para ${m.name}`)}"><span class="photo-fallback" hidden>Não foi possível carregar a imagem externa.</span><figcaption>${im.external?`<a href="${esc(im.url)}" target="_blank" rel="noopener noreferrer">${esc(im.imageType||'Fotografia')} · Wikimedia Commons</a><small>${esc(im.author)} · ${esc(im.license)}</small>`:`${im.verifiedForSpecies===false?'Imagem ilustrativa do grupo, sem identificação individual':'Fotomicrografia do guia'} · p. ${im.page}`}</figcaption></figure>`).join('')}</div>`;
}
function profile(){
 if(!status().ended)return '';
 const m=byId.get(state.targetId);
 return `<section class="aside-card result-profile" id="answer-profile" tabindex="-1" aria-label="Ficha mineralógica completa após a partida">${catalogDetail(m,'result')}</section>`;
}
function getCatalogMinerals(minerals,difficulty='hard'){
 if(difficulty==='hard')return minerals;
 const selectedIds=new Set(getDifficultyMinerals(minerals,difficulty).map(m=>m.id));
 return minerals.filter(m=>selectedIds.has(m.id));
}
function catalogDialog(){
 const available=getCatalogMinerals(MINERALS,state.difficulty);
 const speciesCount=available.filter(m=>m.taxonRank==='species').length;
 const referencesCount=available.length-speciesCount;
 const level=DIFFICULTIES.find(d=>d.id===state.difficulty).name;
 return `<dialog id="catalog-dialog" class="catalog-dialog" aria-labelledby="catalog-title"><div class="catalog-head"><div><h2 id="catalog-title">Catálogo de minerais</h2><p>${speciesCount} espécies${referencesCount?` e ${referencesCount} referências taxonômicas`:''} · ${esc(level)}</p></div><button id="close-catalog" class="dialog-close" aria-label="Fechar catálogo">×</button></div><div class="catalog-body"><label class="sr-only" for="catalog-search">Buscar no catálogo</label><input id="catalog-search" class="catalog-search" type="search" placeholder="Nome, fórmula, classe, cor em PPL, cátion..."><div id="catalog-list" class="catalog-list"></div><div id="catalog-detail" class="catalog-detail"></div><p class="catalog-copyright">Fotomicrografias de Heinrich T. Frank (2018), para uso não comercial; imagens externas têm autores, licenças e links próprios. Os campos comparativos são didáticos e permanecem sujeitos a revisão.</p></div></dialog>`;
}
function showCatalog(query=''){
 const q=normalizeText(query);
 const matches=getCatalogMinerals(MINERALS,state.difficulty).filter(m=>[m.name,m.formula,m.anionGroup,m.family,m.system,displayValue(m,'colorPPL'),...m.cations,...m.aliases].some(v=>normalizeText(v).includes(q))).sort((a,b)=>Number(b.taxonRank==='species')-Number(a.taxonRank==='species')||a.name.localeCompare(b.name,'pt-BR'));
 const list=document.getElementById('catalog-list');
 list.innerHTML=matches.length?matches.map(m=>`<button class="catalog-item" data-catalog-id="${esc(m.id)}">${mineralThumbnail(m)}<span class="catalog-name"><b>${esc(m.name)}</b><small>${esc(m.formula||'Composição variável')} · ${esc(displayValue(m,'colorPPL'))}</small></span><span class="catalog-page">${m.taxonRank==='species'?'Espécie':'Referência'}</span></button>`).join(''):'<p class="catalog-empty">Nenhum mineral encontrado.</p>';
 bindThumbnails(list);
 document.getElementById('catalog-detail').innerHTML=`<p class="catalog-select">${matches.length} fichas. Selecione um mineral para consultar a ficha completa.</p>`;
}
function diagnosticReview(mineral, context){
 const review=getDiagnosticReview(mineral.id);
 if(!review)return '';
 const sources=review.sources.map(source=>`<span><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a></span>`).join('');
 const headingId=esc(`diagnostic-${context}-${mineral.id}`);
 return `<section class="diagnostic-review" aria-labelledby="${headingId}"><h4 id="${headingId}">Evidência para distinguir as espécies</h4><p class="photo-scope">${esc(review.evidence)}</p><div class="catalog-source-list">${sources}</div></section>`;
}
function catalogDetail(m, context='catalog'){
 return `<div class="catalog-detail-header"><h3 tabindex="-1">${esc(m.name)}</h3><p>${esc(m.kind)} · ${m.playable?'Resposta possível':isGuessable(m)?'Palpite permitido (não sorteado)':'Consulta apenas'}</p>${m.parentGroup?`<p class="photo-scope">Grupo de origem: ${esc(m.parentGroup)}. ${esc(m.opticalDataScope)}</p>`:''}</div><div class="chem-profile"><strong>${esc(m.formula||'Fórmula não individualizada')}</strong><span>${esc(m.anionGroup||'Não informada')} · ${esc(m.silicateStructure||'')} · Cátions: ${esc(m.cations.join(', ')||'Não individualizados')}</span><span>Família: ${esc(m.family)} · Sistema: ${esc(m.system)} · PPL: ${esc(displayValue(m,'colorPPL'))}</span></div>${gallery(m)}<div class="catalog-properties"><section><b>PPL</b><p>${esc(m.ppl)}</p></section><section><b>XPL</b><p>${esc(m.xpl)}</p></section><section><b>Clivagem</b><p>${esc(m.cleavageDescription||'Não informada')}</p></section><section><b>Extinção</b><p>${esc(m.extinction||'Não informada')}</p></section><section><b>Maclas</b><p>${esc(m.twinningDescription||'Não informadas')}</p></section><section><b>Associações</b><p>${esc(m.associations||'Não informadas')}</p></section></div>${diagnosticReview(m, context)}<div class="catalog-source-list"><b>Fontes</b>${m.sources.map(v=>`<span>${v.url?`<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.label)}</a>`:esc(v.label)}${v.page?' · p. '+v.page:''}</span>`).join('')}</div><p class="catalog-copyright">${esc(m.opticalDataScope||'')} · ${esc(m.speciesPhotoStatus||'')}.</p>`;
}
function header(){
 return `<header class="topbar"><div class="topbar-inner"><button class="brand" type="button" data-home aria-label="Página inicial Petrodle"><span class="brand-icon">${logo}</span><span>Petro<em>dle</em></span></button><nav class="header-nav"><button id="catalog-link" class="nav-link">${icon('book',15)} Catálogo</button></nav><button class="help-button" id="help" aria-label="Como jogar">${icon('help',17)} <span>Como jogar</span></button></div></header><main class="page">`;
}
function home(){
 const count=discoveries().length;
 const summaries=getDailyModeSummary(MINERALS,MODES,today,mode=>stored(stateKey(mode,'daily',state.difficulty,today),{}),state.difficulty);
 const cover=getMenuCoverImage(MINERALS,today,'classic');
 return `<div class="hub">
   <div class="hub-hero"><h1 id="home-title" tabindex="-1">Qual é o <span>mineral?</span></h1>${cover?`<div class="hero-decor"><img src="${esc(cover.src)}" alt=""></div>`:''}</div>
   <section class="hub-bottom" aria-labelledby="collection-label">
     <div class="collection-summary"><h2 id="collection-label">Sua coleção mineralógica</h2><span id="collection-count">${count} de ${playable.length} identificados</span></div>
     <progress id="collection-progress" aria-labelledby="collection-label" aria-describedby="collection-count" value="${count}" max="${playable.length}"></progress>
   </section>
   <div class="hub-difficulty">
     <label class="difficulty-control" for="difficulty">Dificuldade
       <select id="difficulty" class="difficulty-select" aria-describedby="difficulty-scope">${DIFFICULTIES.map(d=>`<option value="${d.id}" ${state.difficulty===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select>
     </label>
     <span class="hub-difficulty-note" id="difficulty-scope">${getDifficultyMinerals(MINERALS,state.difficulty).length} espécies no catálogo deste nível</span>
   </div>
   <section class="hub-choices" aria-labelledby="home-games">
     <div class="hub-section-heading"><h2 id="home-games">Escolha sua partida</h2><span>Desafio #${getPuzzleNumber(today)}</span></div>
     <div class="hub-mode-grid">${summaries.map(mode=>{
       const coverImage=getMenuCoverImage(MINERALS,today,mode.id);
       const instructions={classic:'Compare propriedades',photo:'Observe duas fotomicrografias',description:'Interprete pistas textuais'};
       const action=mode.status==='won'?'Consultar acerto':mode.status==='lost'?'Consultar resposta':
         mode.status==='playing'?`Continuar · ${attemptLabel(mode.attempts)}`:'Jogar o desafio';
       return `<button class="hub-card hub-${mode.id}" type="button" data-game-mode="${mode.id}">
         <span class="hub-card-art" aria-hidden="true">${coverImage?`<img src="${esc(coverImage.src)}" alt="" loading="lazy">`:''}<span class="hub-card-art-icon">${icon(mode.icon,29)}</span></span>
         <span class="hub-card-copy"><span class="hub-card-topline"><b>${esc(mode.name)}</b></span>
           <span class="hub-card-sub">${instructions[mode.id]}</span>
           <span class="hub-card-foot">${action} ${icon('right',16)}</span>
         </span>
       </button>`;
     }).join('')}</div>
   </section>
 </div>`;
}
function legend(){
 return `<div class="legend-compact" aria-label="Legenda da tabela">
   <span class="legend-pill"><span class="legend-symbol correct" aria-hidden="true">✓</span> Igual</span>
   <span class="legend-pill"><span class="legend-symbol partial" aria-hidden="true">≈</span> Parcial</span>
   <span class="legend-pill"><span class="legend-symbol absent" aria-hidden="true">×</span> Diferente</span>
   <span class="legend-pill"><span class="legend-symbol unknown" aria-hidden="true">—</span> Sem comparação</span>
   <span class="arrow-note">↑ maior · ↓ menor no mineral secreto</span>
 </div>`;
}
function gameShell(){
 const game=MODES.find(m=>m.id===state.gameMode);
 return `<div class="game-shell">
   <div class="game-heading"><button type="button" class="back-home" data-home>← Início</button>
     <h1 id="game-title" tabindex="-1">${esc(game.name)}</h1>
   </div>
   <nav class="mini-mode-nav" aria-label="Modalidades">${MODES.map(m=>`<button type="button" data-game-mode="${m.id}" class="mini-mode ${state.gameMode===m.id?'active':''}" aria-pressed="${state.gameMode===m.id}">${icon(m.icon,15)} ${esc(m.name)}</button>`).join('')}</nav>
   <div class="layout">${mainGame()}</div>
 </div>`;
}
function footer(){return `<footer class="sources"><div class="source-links">
  <span>Petrodle é um projeto de acesso livre com foco educativo. Sinta-se à vontade para colaborar! <a href="https://github.com/marquesbarros/petrodle/issues/new">Abra uma issue no GitHub</a> ou <a href="https://github.com/marquesbarros">entre em contato comigo</a>.</span>
  <span>Referência mineralógica: <a href="${GUIDE_URL}" target="_blank" rel="noopener noreferrer">FRANK, H. T. <i>Guia de Minerais Transparentes ao Microscópio Petrográfico</i>. UFRGS, 2018.</a> Fotografias para uso não comercial.</span>
</div></footer>`;}
function attemptLabel(count){return `${count} ${count===1?'palpite':'palpites'}`;}
function mainGame(){
 const game=MODES.find(m=>m.id===state.gameMode);
 const result=status(), isDaily=state.playMode==='daily', isClassic=state.gameMode==='classic';
 const remaining=8-state.guesses.length;
 const inputNote=isClassic?'Palpites ilimitados':`${remaining} ${remaining===1?'tentativa restante':'tentativas restantes'}`;
 return `<section class="main-card" aria-label="Jogo ${esc(game.name)}">
   <div class="game-top"><div class="game-top-row">
     <span class="game-count">${isDaily?'Desafio #'+getPuzzleNumber(today):'Treino'} · ${esc(DIFFICULTIES.find(d=>d.id===state.difficulty).name)}</span>
     <div class="game-controls"><div class="mode-switch" role="group" aria-label="Tipo de partida">
       <button type="button" class="mode ${isDaily?'active':''}" data-run-mode="daily" aria-pressed="${isDaily}">Diário</button>
       <button type="button" class="mode ${!isDaily?'active':''}" data-run-mode="training" aria-pressed="${!isDaily}">Treino</button>
     </div></div>
   </div></div>
   ${!isClassic?`<section class="challenge-stage" aria-label="Pista do mineral secreto">${state.gameMode==='photo'?challengeImage():challengeClues()}</section>`:''}
   ${result.ended?resultBanner():`<div class="prompt-zone">
     <div class="field-label"><label for="guess-input">Seu palpite</label><small>${inputNote}</small></div>
     <div class="guess-form"><div class="suggestion-wrap">
       <input class="guess-input" id="guess-input" type="text" placeholder="Nome do mineral" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="suggestions" aria-expanded="false">
       <div class="suggestions" id="suggestions" role="listbox" aria-label="Minerais disponíveis"></div>
     </div><button type="button" class="submit" id="submit">Tentar</button></div>
     <div class="message" id="message" role="status">${esc(state.message)}</div>
   </div>`}
   ${state.guesses.length?`<div class="board-intro"><h2>Seus palpites</h2><span>${attemptLabel(state.guesses.length)}</span></div>`:''}
   ${isClassic?classicBoard():otherBoard()}
   ${!result.ended?hintSection():''}
   ${!isDaily&&!result.ended?`<div class="board-footer"><button type="button" id="next" class="text-action">Trocar mineral</button>${state.guesses.length?'<span class="small-note">Inicia outro treino.</span>':''}</div>`:''}
 </section>${profile()}`;
}
function hintSection(){
 const count=state.guesses.length;
 const clues=buildProgressiveClues(byId.get(state.targetId)).slice(state.gameMode==='description'?1:0);
 const earned=Math.min(getAvailableHintCount(count),clues.length);
 const used=Math.min(state.hintCount||0,earned);
 const remaining=earned-used;
 const next=getNextHintRequirement(count);
 const shown=getHintStages(count,clues,used);
 return `<section class="hints-section" aria-label="Dicas progressivas">
   <div class="hints-heading"><h2>Dicas</h2></div>
   ${shown.length?`<div class="hints-revealed">${shown.map(c=>`<div class="hint-entry" tabindex="-1"><p><b>${esc(c.title)}</b>${esc(formatClue(c.value))}</p></div>`).join('')}</div>`:''}
   <div class="hints-footer">${remaining?`<button type="button" id="hint" class="hint-claim">Revelar dica${remaining>1?` (${remaining} disponíveis)`:''}</button>`:
     earned>=clues.length?'<span>Todas as dicas foram reveladas.</span>':`<span>${next} ${next===1?'palpite para a próxima dica':'palpites para a próxima dica'}.</span>`}</div>
 </section>`;
}
function resultEvidence(target){
 const parts=[];
 if(state.gameMode==='description'){
   const key=m=>JSON.stringify(buildProgressiveClues(m).slice(0,3).map(c=>c.value));
   const given=key(target);
   const alternatives=getEligibleForMode(MINERALS,'description',state.difficulty)
    .filter(m=>m.id!==target.id && key(m)===given);
   if(alternatives.length){
     const names=new Intl.ListFormat('pt-BR').format(alternatives.map(m=>m.name));
     parts.push(`As pistas disponíveis também são compatíveis com ${names}. Distinguir essas espécies exige evidência adicional.`);
   }
 }
 const lastId=state.guesses.findLast(id=>id!==target.id);
 if(lastId){
   const previous=byId.get(lastId);
   const {properties}=gradeGuess(previous,target);
   const compared=BOARD_COLUMNS.filter(({key})=>properties[key].status==='absent').slice(0,3);
   if(compared.length){
     const differences=compared.map(({key,label})=>`${label}: ${displayValue(previous,key)} / ${displayValue(target,key)}`);
     parts.push(`Compare ${previous.name} e ${target.name} no catálogo. ${differences.join(' · ')}. Os valores são referências didáticas.`);
   }
 }
 return parts.map(part=>`<p class="result-evidence">${esc(part)}</p>`).join('');
}
function resultBanner(){
 const result=status(), target=byId.get(state.targetId);
 return `<section class="result" aria-labelledby="result-title">
   <div class="result-head"><div><h2 id="result-title" tabindex="-1">${result.won?'Você acertou':'Fim das tentativas'}. ${esc(target.name)}</h2>
   <p>${attemptLabel(state.guesses.length)}${result.won?' · Registrado na coleção':''}</p></div></div>
   ${resultEvidence(target)}
   <div class="result-actions">
     ${state.playMode==='training'?'<button type="button" id="next" class="solid-small">Próximo mineral</button>':''}
     <a class="outline-small" href="#answer-profile" id="review-answer">Ver ficha</a>
     <button type="button" class="outline-small" id="share">Compartilhar resultado</button>
   </div>
 </section>`;
}
function dialogs(){
 return `<dialog class="dialog" id="help-dialog" aria-labelledby="help-title">
   <div class="dialog-top"><h2 id="help-title">Como jogar</h2><button type="button" id="close-help" class="dialog-close" aria-label="Fechar ajuda">×</button></div>
   <div class="dialog-body">
     <p>Escolha a dificuldade no início. Cada modo tem um desafio por dia. Use o Treino para jogar outros minerais.</p>
     <ul>
       <li><b>Clássico.</b> Compare 11 propriedades. Os símbolos indicam a correspondência e as setas mostram se o valor buscado é maior ou menor.</li>
       <li><b>Imagem.</b> Observe as duas fotomicrografias. PPL é luz polarizada plana. XPL é luz polarizada cruzada, em que podem aparecer cores de interferência.</li>
       <li><b>Descrição.</b> Interprete as pistas e mantenha abertas as hipóteses que a evidência ainda não distingue.</li>
     </ul>
     <p>Digite um nome para buscar. Selecione uma sugestão para enviar o palpite. No teclado, use ↑/↓, Enter e Esc. Repetições não contam. A cada três palpites você pode revelar uma dica, enquanto houver dicas disponíveis.</p>
     <p class="dialog-note">As propriedades variam entre amostras. Alguns dados descrevem o grupo, e a espécie pode exigir análise adicional.</p>
   </div>
 </dialog>${catalogDialog()}<dialog id="photo-dialog" class="dialog photo-dialog" aria-labelledby="preview-title">
   <div class="dialog-top"><h2 id="preview-title"></h2><button type="button" class="dialog-close" data-close-dialog aria-label="Fechar imagem">×</button></div>
   <figure class="photo-dialog-content"><img id="preview-image" alt=""><figcaption id="preview-light"></figcaption></figure>
 </dialog><dialog id="share-dialog" class="dialog" aria-labelledby="share-title">
   <div class="dialog-top"><h2 id="share-title">Compartilhar resultado</h2><button type="button" class="dialog-close" data-close-dialog aria-label="Fechar resultado para copiar">×</button></div>
   <div class="dialog-body"><label for="share-text">Copie o texto selecionado.</label><textarea id="share-text" rows="5" readonly></textarea></div>
 </dialog><div id="toast" class="toast" role="status"></div>`;
}
function render(focus){
 refreshDailyDate();
 suggestionItems=[];
 selection=-1;
 root.innerHTML=header()+(view==='home'?home():gameShell())+'</main>'+footer()+dialogs();
 bind();
 if(focus){
   const element=document.querySelector(focus);
   element?.focus({preventScroll:true});
   if(focus==='#result-title')element?.scrollIntoView({block:'nearest'});
 }
}
function msg(s){
 state.message=s;
 document.getElementById('message').textContent=s;
}
function guessPool(){
 return state.playMode==='daily'
  ?getDailyGuessPool(MINERALS,state.gameMode,state.difficulty,state.targetId,today)
  :getDifficultyGuesses(MINERALS,state.gameMode,state.difficulty);
}
function updateActiveSuggestion(){
 const input=document.getElementById('guess-input'), menu=document.getElementById('suggestions');
 const options=[...menu.children];
 options.forEach((option,i)=>{
   option.classList.toggle('active',i===selection);
   option.setAttribute('aria-selected',String(i===selection));
 });
 const active=options[selection];
 if(!active){input.removeAttribute('aria-activedescendant');return;}
 input.setAttribute('aria-activedescendant',active.id);
 if(active.offsetTop<menu.scrollTop)menu.scrollTop=active.offsetTop;
 if(active.offsetTop+active.offsetHeight>menu.scrollTop+menu.clientHeight)
   menu.scrollTop=active.offsetTop+active.offsetHeight-menu.clientHeight;
}
function showSuggestions(){
 const input=document.getElementById('guess-input'),menu=document.getElementById('suggestions');
 if(!input)return;
 const query=input.value.trim();
 const available=guessPool().filter(m=>!state.guesses.includes(m.id));
 suggestionItems=query?searchMinerals(available,query,9):[];
 selection=-1;
 menu.innerHTML=suggestionItems.map((m,i)=>`<button type="button" data-id="${esc(m.id)}" tabindex="-1" id="suggestion-${i}" class="suggestion" role="option" aria-selected="false">${mineralThumbnail(m)}<span class="suggestion-copy"><b>${esc(m.name)}</b><small>${esc(m.family)}</small></span></button>`).join('');
 bindThumbnails(menu);
 menu.classList.toggle('visible',Boolean(suggestionItems.length));
 input.setAttribute('aria-expanded',String(Boolean(suggestionItems.length)));
 input.removeAttribute('aria-activedescendant');
}
function hideSuggestions(){
 document.getElementById('suggestions')?.classList.remove('visible');
 const input=document.getElementById('guess-input');
 input?.setAttribute('aria-expanded','false');
 input?.removeAttribute('aria-activedescendant');
 selection=-1;
}
function guess(selectedId){
 const input=document.getElementById('guess-input');
 if(!input)return;
 if(checkDay())return;
 const selected=selectedId&&byId.get(selectedId);
 const result=resolveGuess(guessPool(),selected?.name??input.value,state.guesses);
 if(result.status==='empty'){msg('Digite o nome de um mineral.');input.focus();return;}
 if(result.status==='duplicate'){msg('Você já tentou esse mineral. O palpite não foi contado.');input.focus();return;}
 if(result.status==='choose'){
   input.focus();
   showSuggestions();
   msg(suggestionItems.length?'Escolha uma das sugestões para enviar o palpite.':'Nenhum mineral disponível com esse nome. Revise a busca.');
   return;
 }
 const m=byId.get(result.id);
 state.guesses.push(m.id);
 if(m.id===state.targetId)discover(m.id);
 const resultState=status();
 state.message=resultState.ended?'':state.gameMode==='classic'?`${m.name} adicionado à comparação.`:`Não é ${m.name}.`;
 persist();
 render(resultState.ended?'#result-title':'#guess-input');
}
function changeGame(mode){
 if(!MODES.some(m=>m.id===mode))return;
 const run=view==='home'?'daily':state.playMode;
 if(state.gameMode!==mode||state.playMode!==run)state=load(mode,run,state.difficulty,today);
 view='game';
 persist();
 render(status().ended?'#result-title':'#game-title');
 if(!status().ended)window.scrollTo({top:0,behavior:'instant'});
}
function changeRun(mode){
 if(state.playMode===mode)return;
 state=load(state.gameMode,mode,state.difficulty,today);
 persist();
 render(`[data-run-mode="${mode}"]`);
}
function changeDifficulty(difficulty){
 if(!DIFFICULTIES.some(d=>d.id===difficulty)||state.difficulty===difficulty)return;
 state=load(state.gameMode,state.playMode,difficulty,today);
 persist();
 render('#difficulty');
}
function nextTraining(){
 state.targetId=chooseTraining(state.gameMode,state.targetId,state.difficulty);
 state.guesses=[];
 state.hintCount=0;
 state.message='';
 persist();
 render('#guess-input');
 document.getElementById('guess-input')?.scrollIntoView({block:'nearest'});
}
function toast(s){
 const t=document.getElementById('toast');
 t.textContent=s;
 t.classList.add('visible');
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>t.classList.remove('visible'),3000);
}
async function share(){
 const result=status(), title=MODES.find(m=>m.id===state.gameMode).name;
 const edition=state.playMode==='daily'?'#'+getPuzzleNumber(today):'Treino';
 const difficulty=DIFFICULTIES.find(d=>d.id===state.difficulty).name;
 const text=`Petrodle ${title} · ${difficulty} ${edition}\n${result.won?'✅':'⬜'} ${attemptLabel(state.guesses.length)}\n${state.guesses.map(id=>id===state.targetId?'🟩':'⬛').join('')}\n#Petrodle`;
 const trigger=document.getElementById('share');
 try{
   await navigator.clipboard.writeText(text);
   if(trigger.isConnected)toast('Resultado copiado.');
 }catch{
   if(!trigger.isConnected)return;
   const input=document.getElementById('share-text');
   input.value=text;
   document.getElementById('share-dialog').showModal();
   input.focus();
   input.select();
 }
}
function previewPhoto(button){
 const image=button.closest('figure').querySelector('.challenge-photo');
 const title=button.textContent.replace('Ampliar foto','Fotomicrografia');
 const preview=document.getElementById('preview-image');
 preview.src=image.currentSrc||image.src;
 preview.alt=image.alt;
 document.getElementById('preview-title').textContent=title;
 document.getElementById('preview-light').textContent=button.parentElement.querySelector('.photo-lighting').textContent;
 document.getElementById('photo-dialog').showModal();
}
function bind(){
 document.querySelectorAll('[data-home]').forEach(button=>button.addEventListener('click',()=>{
   const focus=view==='game'?`.hub-card[data-game-mode="${state.gameMode}"]`:'#home-title';
   view='home';
   render(focus);
   document.querySelector(focus)?.scrollIntoView({block:'nearest'});
 }));
 document.querySelectorAll('[data-game-mode]').forEach(el=>el.addEventListener('click',()=>changeGame(el.dataset.gameMode)));
 document.querySelectorAll('[data-run-mode]').forEach(el=>el.addEventListener('click',()=>changeRun(el.dataset.runMode)));
 document.getElementById('difficulty')?.addEventListener('change',e=>changeDifficulty(e.target.value));
 document.getElementById('catalog-link').addEventListener('click',()=>{
   document.getElementById('catalog-dialog').showModal();
   showCatalog();
   document.getElementById('catalog-search').focus();
 });
 document.getElementById('close-catalog').addEventListener('click',()=>document.getElementById('catalog-dialog').close());
 document.getElementById('catalog-search').addEventListener('input',e=>showCatalog(e.target.value));
 document.getElementById('catalog-list').addEventListener('click',e=>{
   const item=e.target.closest('[data-catalog-id]');
   if(!item)return;
   const detail=document.getElementById('catalog-detail');
   detail.innerHTML=catalogDetail(byId.get(item.dataset.catalogId));
   bindExternalImages(detail);
   detail.querySelector('h3').focus();
 });
 document.getElementById('help').addEventListener('click',()=>document.getElementById('help-dialog').showModal());
 document.getElementById('close-help').addEventListener('click',()=>document.getElementById('help-dialog').close());
 document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 bindThumbnails(root);
 bindExternalImages();
 document.querySelectorAll('[data-photo-preview]').forEach(button=>button.addEventListener('click',()=>previewPhoto(button)));
 document.getElementById('next')?.addEventListener('click',nextTraining);
 document.getElementById('share')?.addEventListener('click',share);
 document.getElementById('review-answer')?.addEventListener('click',event=>{
   event.preventDefault();
   const profile=document.getElementById('answer-profile');
   profile.focus({preventScroll:true});
   profile.scrollIntoView({block:'start'});
 });
 const input=document.getElementById('guess-input');
 if(!input)return;
 input.addEventListener('focus',showSuggestions);
 input.addEventListener('input',()=>{msg('');showSuggestions();});
 input.addEventListener('keydown',e=>{
   if(e.isComposing)return;
   if(e.key==='Escape'){if(input.getAttribute('aria-expanded')==='true'){e.preventDefault();hideSuggestions();}return;}
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
     if(!suggestionItems.length)return;
     e.preventDefault();
     if(input.getAttribute('aria-expanded')==='false')showSuggestions();
     if(!suggestionItems.length)return;
     selection=selection<0?(e.key==='ArrowDown'?0:suggestionItems.length-1):(selection+(e.key==='ArrowDown'?1:-1)+suggestionItems.length)%suggestionItems.length;
     updateActiveSuggestion();
   }
   if(e.key==='Enter'){
     e.preventDefault();
     const selectedId=selection>=0?suggestionItems[selection]?.id:undefined;
     guess(selectedId);
   }
 });
 const menu=document.getElementById('suggestions');
 menu.addEventListener('mousedown',e=>{if(e.target.closest('[data-id]'))e.preventDefault();});
 menu.addEventListener('click',e=>{const item=e.target.closest('[data-id]');if(item)guess(item.dataset.id);});
 input.addEventListener('blur',()=>setTimeout(()=>{if(input.isConnected&&document.activeElement!==input)hideSuggestions();},140));
 document.getElementById('submit').addEventListener('click',()=>guess());
 document.getElementById('hint')?.addEventListener('click',()=>{
   state.hintCount++;
   persist();
   render('.hints-revealed .hint-entry:last-child');
 });
}
function bindExternalImages(scope=document){
 for(const image of scope.querySelectorAll('img[data-image-fallback]')){
   const frame=image.parentElement, loading=frame.querySelector('.photo-loading'), fallback=frame.querySelector('.photo-fallback');
   const retry=frame.querySelector('[data-retry-photo]'), preview=frame.closest('figure').querySelector('[data-photo-preview]');
   const complete=()=>{
     loading.hidden=true;
     image.hidden=!image.naturalWidth;
     fallback.hidden=Boolean(image.naturalWidth);
     preview.disabled=!image.naturalWidth;
     if(preview.disabled&&frame.dataset.retrying)retry.focus();
     if(!preview.disabled&&frame.dataset.retrying)preview.focus();
     delete frame.dataset.retrying;
   };
   if(image.complete)complete();
   image.addEventListener('load',complete);
   image.addEventListener('error',complete);
   retry.addEventListener('click',()=>{
     frame.dataset.retrying='true';
     fallback.hidden=true;
     loading.hidden=false;
     loading.tabIndex=-1;
     loading.focus();
     const url=new URL(image.src);
     url.searchParams.set('tentativa',Date.now());
     image.src=url.href;
   });
 }
 for(const image of scope.querySelectorAll('img[data-external]')){
   const show=()=>{image.hidden=true;image.nextElementSibling.hidden=false;};
   if(image.complete&&!image.naturalWidth)show();
   else image.addEventListener('error',show,{once:true});
 }
}
function checkDay(){
 if(!refreshDailyDate())return false;
 if(view==='game'&&state.playMode==='training')return false;
 const current=document.activeElement;
 const focus=current?.id==='guess-input'?'#guess-input':undefined;
 if(view==='game')state.message='O desafio diário mudou. Você já pode jogar o de hoje.';
 render(focus);
 return true;
}
render();
setInterval(checkDay,30000);
window.addEventListener('focus',checkDay);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDay();});
})();
