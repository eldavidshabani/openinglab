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
  const board=$('board');if(!board||prefersReduce||!Element.prototype.animate)return;
  let snapshot=null,activeAnimation=null;
  function read(){
   const positions=new Map();
   for(const square of board.querySelectorAll('[aria-label]')){
    const name=(square.getAttribute('aria-label')||'').slice(0,2);
    if(!/^[a-h][1-8]$/.test(name))continue;
    const piece=square.querySelector('.piece');
    positions.set(name,{square,piece:piece?.textContent||'',rect:square.getBoundingClientRect()});
   }
   return positions;
  }
  function slide(from,to){
   if(!from?.rect||!to?.rect||!to?.square||!to.piece)return;
   const dest=to.square.querySelector('.piece');if(!dest)return;
   const sourceRect=from.rect,targetRect=to.rect;
   if(!sourceRect.width||!targetRect.width)return;
   if(activeAnimation){activeAnimation.cancel();activeAnimation=null;}
   const ghost=document.createElement('span');
   ghost.textContent=to.piece;ghost.setAttribute('aria-hidden','true');
   ghost.style.cssText='position:fixed;z-index:9999;pointer-events:none;display:grid;place-items:center;line-height:1;font-size:'+Math.round(targetRect.height*.75)+'px;width:'+targetRect.width+'px;height:'+targetRect.height+'px;left:'+sourceRect.left+'px;top:'+sourceRect.top+'px;text-shadow:0 2px 2px #0008;';
   document.body.append(ghost);dest.style.visibility='hidden';
   const deltaX=targetRect.left-sourceRect.left,deltaY=targetRect.top-sourceRect.top;
   const anim=ghost.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate('+deltaX+'px,'+deltaY+'px) scale(1)'}],{duration:300,easing:'cubic-bezier(.2,.76,.22,1)',fill:'forwards'});
   activeAnimation=anim;
   const cleanup=()=>{dest.style.visibility='';ghost.remove();if(activeAnimation===anim)activeAnimation=null;};
   anim.onfinish=cleanup;anim.oncancel=cleanup;
  }
  const obs=new MutationObserver(()=>{
   const next=read();
   if(snapshot){
    const arrivals=[...next].filter(([sq,v])=>v.piece&&snapshot.get(sq)?.piece!==v.piece);
    const departed=[...snapshot].filter(([sq,v])=>v.piece&&next.get(sq)?.piece!==v.piece);
    const candidates=[];
    for(const [sq,to] of arrivals){
     for(const [fromSq,from] of departed){
      if(from.piece===to.piece&&sq!==fromSq){
       // Prefer the destination marked as the just-completed move.
       const marked=to.square.classList.contains('last')||to.square.classList.contains('move');
       candidates.push({from,to,marked});
      }
     }
    }
    candidates.sort((a,b)=>Number(b.marked)-Number(a.marked));
    if(candidates.length&&candidates[0].marked)slide(candidates[0].from,candidates[0].to);
   }
   snapshot=next;
  });
  snapshot=read();
  obs.observe(board,{childList:true});
 }
 function mobileNav(){
  if(document.querySelector('.ol-bottom-nav'))return;
  const destinations=[
   ['./index.html','⌂','Home','home'],
   ['./training-center.html','⚡','Train','training'],
   ['./opening-academy.html','♗','Learn','academy'],
   ['./coach-v5-1.html','♚','Play','coach'],
   ['./my-chess-reset.html','▥','Stats','reset']
  ];
  const nav=document.createElement('nav');nav.className='ol-bottom-nav';nav.setAttribute('aria-label','OpeningLab navigation');
  for(const [href,icon,label,key] of destinations){
   const a=document.createElement('a');a.href=href;
   if(document.body.dataset.olPage===key){a.className='current';a.setAttribute('aria-current','page');}
   const glyph=document.createElement('span');glyph.className='ol-nav-icon';glyph.textContent=icon;
   const caption=document.createElement('span');caption.textContent=label;
   a.append(glyph,caption);nav.append(a);
  }
  document.body.append(nav);
 }
 function compactPicker(container,label,boardSelector){
  if(!container||container.querySelector('.ol-course-picker'))return;
  const nodes=[...container.children];
  const details=document.createElement('details');details.className='ol-course-picker';
  const summary=document.createElement('summary');summary.textContent=label;
  const content=document.createElement('div');content.className='ol-picker-body';
  nodes.forEach(node=>content.append(node));
  details.append(summary,content);container.append(details);
  const phone=window.matchMedia('(max-width:760px)');
  details.open=!phone.matches;
  content.addEventListener('click',e=>{
   if(!phone.matches)return;
   const button=e.target.closest('button.lesson, .lab-list button, #list button');
   if(!button)return;
   details.open=false;
   const anchor=document.querySelector(boardSelector);
   window.requestAnimationFrame(()=>{
    if(anchor)anchor.scrollIntoView({behavior:prefersReduce?'instant':'smooth',block:'start'});
   });
  });
 }
 function enhanceAcademy(){
  compactPicker(document.querySelector('aside.catalog'),'♗ Choose opening  ·  tap to browse','.board-title');
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
  compactPicker(document.querySelector('.lab-library'),'⚡ Choose challenge  ·  tap to browse','.board-title');
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
  mobileNav();
  if(p==='academy')enhanceAcademy();
  if(p==='training')enhanceTraining();
  if(p==='coach')enhanceCoach();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
 else initialize();
})();