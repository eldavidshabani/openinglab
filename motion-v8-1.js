/* OpeningLab by Twelvy · Motion and readability v8.1
   Progressive UI only. No engine, game state, scores or lesson data changes. */
(()=>{'use strict';
 const PREF='openinglab.ui.v8.1.';
 const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const readPref=key=>{try{return localStorage.getItem(PREF+key)}catch(_){return null}};
 const savePref=(key,value)=>{try{localStorage.setItem(PREF+key,value)}catch(_){}};
 let expanded=readPref('largeType')==='yes';
 let motion=readPref('motion')!=='off'&&!prefersReduced;
 const candidates=['#whiteText','#blackText','#yourText','#oppText','#wrongText',
  '#answerText','#coachText','#coachReply','#personal','.story-copy'];
 const successTargets=['#yourTitle','#answerHeading','#whiteTitle','.story-title'];
 const moveTargets=['#moves','#moveHistory','#moveLog','.move-ledger'];
 const watchedText=new WeakMap(),watchedSuccess=new WeakMap(),watchedMoves=new WeakMap();
 let uid=0,workScheduled=false,observation=null;
 const reduce=()=>prefersReduced||!motion;
 function applyPrefs(){
  document.body.classList.add('ol-v9');
  document.body.classList.toggle('ol-large-text',expanded);
  document.documentElement.classList.toggle('ol-no-motion',reduce());
 }
 function makeControls(){
  const head=document.querySelector('header,.topbar');
  if(!head||document.querySelector('.ol-view-bar'))return;
  const wrapper=document.createElement('div');wrapper.className='ol-view-bar';
  wrapper.setAttribute('aria-label','Display preferences');
  const hint=document.createElement('span');hint.className='ol-view-tag';hint.textContent='✦ MORE PLAY. LESS READING.';
  const controls=document.createElement('div');controls.className='ol-view-controls';
  const textBtn=document.createElement('button');textBtn.type='button';textBtn.id='ol-text-toggle';
  textBtn.title='Change explanation text size';textBtn.setAttribute('aria-label','Toggle larger reading text');
  const motionBtn=document.createElement('button');motionBtn.type='button';motionBtn.id='ol-motion-toggle';
  motionBtn.title=prefersReduced?'Device setting prefers reduced motion':'Toggle interface animations';
  motionBtn.setAttribute('aria-label','Toggle animated transitions');
  function sync(){
   textBtn.textContent=expanded?'Aa Standard text':'Aa Larger text';
   textBtn.setAttribute('aria-pressed',String(expanded));
   motionBtn.textContent='✦ Motion '+(reduce()?'off':'on');
   motionBtn.setAttribute('aria-pressed',String(!reduce()));
   motionBtn.disabled=prefersReduced;
  }
  textBtn.addEventListener('click',()=>{expanded=!expanded;savePref('largeType',expanded?'yes':'no');applyPrefs();sync()});
  motionBtn.addEventListener('click',()=>{motion=!motion;savePref('motion',motion?'on':'off');applyPrefs();sync()});
  controls.append(textBtn,motionBtn);wrapper.append(hint,controls);head.insertAdjacentElement('afterend',wrapper);sync();
 }
 function pulse(card){
  if(reduce()||!card)return;
  card.classList.remove('ol-fresh');void card.offsetWidth;card.classList.add('ol-fresh');
 }
 function cheer(){
  if(reduce())return;
  if(document.querySelector('.ol-success-pop'))return;
  const pop=document.createElement('div');pop.className='ol-success-pop';
  pop.setAttribute('aria-hidden','true');pop.textContent='♟ NICE MOVE!';
  document.body.append(pop);setTimeout(()=>pop.remove(),1300);
 }
 function updateExpandable(){
  for(const el of document.querySelectorAll(candidates.join(','))){
   if(el.closest('.ol-view-bar'))continue;
   const body=el.textContent.trim(),seen=watchedText.get(el),prev=seen?.text||null;
   if(prev===body)continue;
   let btn=seen?.button;
   if(!seen){watchedText.set(el,{text:body,button:null});}
   else{seen.text=body;}
   const qualifies=body.length>=115;
   if(qualifies){
    if(!el.id)el.id='ol-explain-'+(++uid);
    if(!btn||!btn.isConnected){
      btn=document.createElement('button');btn.type='button';btn.className='ol-read-more';
      btn.setAttribute('aria-controls',el.id);
      btn.addEventListener('click',()=>{
       const open=!el.classList.contains('ol-open');
       el.classList.toggle('ol-open',open);
       btn.setAttribute('aria-expanded',String(open));
       btn.firstChild.textContent=open?'Show less ':'Show why ';
      });
      const span=document.createTextNode('Show why ');
      btn.appendChild(span);
      el.insertAdjacentElement('afterend',btn);
      watchedText.get(el).button=btn;
    }
    el.classList.add('ol-collapsible');el.classList.remove('ol-open');
    btn.setAttribute('aria-expanded','false');
    if(btn.firstChild?.textContent!=='Show why ')btn.firstChild.textContent='Show why ';
    if(prev!==null&&prev!==body)pulse(el.closest('.story,.feedback,.story-event,.coach-card')||el.parentElement);
   }else{
    el.classList.remove('ol-collapsible','ol-open');
    if(btn){btn.remove();watchedText.get(el).button=null;}
    if(prev!==null&&prev!==body)pulse(el.closest('.story,.feedback,.story-event')||null);
   }
  }
 }
 function updateSuccess(){
  for(const el of document.querySelectorAll(successTargets.join(','))){
   const text=(el.textContent||'').trim(),prev=watchedSuccess.get(el);
   watchedSuccess.set(el,text);
   if(prev===undefined||prev===text)continue;
   if(/^(?:✓|✔)|(?:correct|variation complete|tactic found|great move|well done)/i.test(text)){
     cheer();
   }
  }
 }
 function updateMoveEffects(){
  for(const node of document.querySelectorAll(moveTargets.join(','))){
    if(!node.id&&node.closest('.ol-view-bar'))continue;
    const text=node.textContent.trim(),prev=watchedMoves.get(node);
    watchedMoves.set(node,text);
    if(!prev||prev===text||reduce())continue;
    const board=document.querySelector('#board');
    const square=board?.querySelector('.sq.last .piece, .sq.move .piece, .square.last .piece, .square.move .piece');
    if(!square)continue;
    square.classList.remove('ol-piece-jump');void square.offsetWidth;square.classList.add('ol-piece-jump');
  }
 }
 function collapseWeeks(){
  const weeks=[...document.querySelectorAll('.week')];
  if(!weeks.length)return;
  weeks.forEach((week,i)=>{
   if(week.querySelector('details.ol-week-details'))return;
   const head=week.querySelector('.week-head'),body=week.querySelector('.week-body');
   if(!head||!body)return;
   const d=document.createElement('details');d.className='ol-week-details';
   d.open=i===0;
   const summary=document.createElement('summary');summary.className='week-head';summary.textContent=head.textContent;
   d.append(summary,body);
   week.replaceWith(d);
  });
 }
 function refresh(){
  workScheduled=false;
  updateExpandable();updateSuccess();updateMoveEffects();
 }
 function schedule(){
  if(workScheduled)return;
  workScheduled=true;window.requestAnimationFrame(refresh);
 }
 function init(){
  applyPrefs();makeControls();collapseWeeks();refresh();
  observation=new MutationObserver(schedule);
  observation.observe(document.body,{subtree:true,childList:true,characterData:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();