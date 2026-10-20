/* OpeningLab Focus UI v9 — progressive enhancement.
   Never changes chess state or replaces source explanations. */
(()=>{'use strict';
 const page=document.body?.dataset?.olPage || 'unknown';
 const prefersReduce=window.matchMedia?.('(prefers-reduced-motion:reduce)').matches||false;
 const $=id=>document.getElementById(id);
 function details(label,bodyNodes,container,before,opts={}){
  if(!container||!bodyNodes.length)return null;
  const shell=document.createElement('details');shell.className='ol-insights';
  shell.dataset.role=opts.role||'explanation';
  const summary=document.createElement('summary');summary.textContent=label;
  const affordance=document.createElement('span');affordance.className='ol-more';affordance.textContent='Tap to open';
  summary.append(affordance);
  const inside=document.createElement('div');inside.className='ol-insight-body';
  bodyNodes.forEach(node=>{if(node)inside.append(node)});
  shell.append(summary,inside);
  if(before&&before.parentNode===container)container.insertBefore(shell,before);
  else container.append(shell);
  shell.addEventListener('toggle',()=>{affordance.textContent=shell.open?'Tap to close':'Tap to open'});
  return shell;
 }
 function short(text,max=54){
  return String(text||'').replace(/\s+/g,' ').trim().slice(0,max);
 }
 function attachToast(watchId){
  const watched=$(watchId);
  if(!watched)return;
  let current=watched.textContent.trim(),lastTime=0;
  const observer=new MutationObserver(()=>{
   const next=watched.textContent.trim();
   if(next===current)return;
   current=next;
   if(!/^(?:✓|✔)|\b(?:correct|completed|tactic found|great|solid move|interesting improvement)\b/i.test(next))return;
   if(prefersReduce||Date.now()-lastTime<900)return;
   lastTime=Date.now();
   const node=document.createElement('div');node.className='ol-pop';
   node.textContent=/completed|mastered/i.test(next)?'♛ LEVEL COMPLETE!':'✓ NICE MOVE!';
   node.setAttribute('aria-hidden','true');
   document.body.append(node);
   setTimeout(()=>node.remove(),1100);
  });
  observer.observe(watched,{subtree:true,characterData:true,childList:true});
 }
 function attachPieceMotion(){
  const board=$('board');if(!board||prefersReduce)return;
  let prev='';
  const obs=new MutationObserver(()=>{
   const target=board.querySelector('.sq.last .piece, .sq.move .piece, .square.move .piece, .square.last .piece');
   const last=target?.closest('[aria-label]')?.getAttribute('aria-label')||'';
   if(!last||last===prev)return;prev=last;
   target.classList.remove('ol-move-piece');void target.offsetWidth;target.classList.add('ol-move-piece');
  });
  obs.observe(board,{childList:true});
 }
 function enhanceAcademy(){
  const right=document.querySelector('.right-panel'),card=right?.querySelector('.card:first-child');
  if(!card)return;
  const nodes=[$('taskInfo'),$('yourCard'),$('oppCard'),$('wrongCard')].filter(Boolean);
  details('♟ Why that move?',nodes,card,card.querySelector('.action-row')?.nextElementSibling,{role:'move-feedback'});
  const coach=right.querySelectorAll('.card')[1];
  if(coach){
   const blocks=[...coach.children].filter(x=>x.classList?.contains('coach-buttons')||x.classList?.contains('coach-response'));
   // Leave the three short question buttons visible; only the essay-style response is folded.
   const answer=$('coachReply');
   if(answer)details('✦ Coach insights',[answer],coach,null,{role:'coach'});
  }
  const current=$('miniFeedback');if(current)current.style.display='flex';
  attachToast('yourTitle');attachPieceMotion();
 }
 function enhanceTraining(){
  const answer=$('answerCard'),explain=$('coachCard');
  const right=answer?.closest('section.card');
  if(!right)return;
  const buttons=right.querySelectorAll('.slim-controls');
  const firstButtons=buttons[0];
  const archive=details('♟ See the explanation',[answer,explain],right,firstButtons?.nextSibling||null,{role:'move-feedback'});
  const focus=right.querySelector('.chess-focus');
  const buttons2=buttons[1];
  if(focus)details('◎ My training insights',[focus],right,buttons2||null,{role:'weakness'});
  const mini=$('mini');if(mini)mini.style.display='block';
  attachToast('answerHeading');attachPieceMotion();
 }
 function enhanceCoach(){
  const feedback=$('whiteFeedback');
  const card=feedback?.parentElement;
  if(!card)return;
  const info=card.querySelector('.info'),black=$('blackFeedback'),plan=$('planBox');
  details('♟ Move explanations',[info,feedback,black,plan].filter(Boolean),card,card.querySelector('.coach-chat'),{role:'engine'});
  const aside=document.createElement('div');aside.className='ol-mini-callout';
  const icon=document.createElement('span');icon.className='ol-dot';icon.textContent='♟';
  const title=document.createElement('span');title.className='ol-mini-title';title.textContent='Play a move to get feedback';
  aside.append(icon,title);
  const anchor=card.querySelector('.ol-insights');
  card.insertBefore(aside,anchor);
  const titleEl=$('whiteTitle');
  if(titleEl){
   const update=()=>{
    const text=short(titleEl.textContent,62);
    title.textContent=text;
    aside.dataset.status=/blunder|mistake|queen lost/i.test(text)?'wrong':/solid|good|improvement|excellent/i.test(text)?'good':'neutral';
   };
   new MutationObserver(update).observe(titleEl,{childList:true,characterData:true,subtree:true});update();
  }
  const ai=card.querySelector('.ai-row'),infoDetails=document.querySelector('details.optional-info');
  if(ai&&infoDetails)infoDetails.append(ai);
  attachToast('whiteTitle');attachPieceMotion();
 }
 function initialize(){
  const p=document.body.dataset.olPage;
  if(!['academy','training','coach'].includes(p))return;
  document.body.classList.add('ol-focus');
  if(p==='academy')enhanceAcademy();
  if(p==='training')enhanceTraining();
  if(p==='coach')enhanceCoach();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();