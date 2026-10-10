/* The Soul — dependency-free, offline cinematic player. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const chapters = window.STORY;
  const beats = chapters.flatMap((c, chapter) => c.beats.map((paragraphs, local) => ({chapter, local, paragraphs})));
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const plain = s => s.replace(/\*\*|\*|`|^>\s*/g,'');
  function html(s) {
    return escape(s).replace(/^>\s*/,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/`(.*?)`/g,'<code>$1</code>');
  }
  let index = 0, started = false, playing = false, elapsed = 0, duration = 1;
  let voice = false, sound = false, moving = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speechActive = false, speechToken = 0, transitionToken = 0, lastTick = performance.now();
  let bgSlot = 0, currentArt = '', audioContext, master, nodes = [], toastTimer;
  const moods = ['THE FIRE WITHIN','THE DEVIL’S MISTAKE','ABOVE THE FLAMES','A LIGHT BEYOND','THREE QUESTIONS','THE PRICE OF FEELING','THE COURAGE TO LIVE','ONE MORE TOMORROW'];
  const roman = ['I','II','III','IV','V','VI','VII','VIII'];
  function toast(text) { $('toast').textContent=text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500); }
  function background(art) {
    if (art===currentArt) return;
    currentArt=art; const next=bgSlot ? $('bgA') : $('bgB'), old=bgSlot ? $('bgB') : $('bgA');
    next.style.backgroundImage='url("images/'+art+'.jpg")'; next.classList.add('active'); old.classList.remove('active'); bgSlot=1-bgSlot;
  }
  function cancelSpeech() { speechToken++; speechActive=false; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function speak() {
    cancelSpeech();
    if (!voice || !playing || !('speechSynthesis' in window)) return;
    const token=speechToken;
    const text=beats[index].paragraphs.map(plain).join(' ');
    const utterance=new SpeechSynthesisUtterance(text);
    const available=speechSynthesis.getVoices(); const preferred=available.find(v=>v.lang.startsWith('en')&&v.localService)||available.find(v=>v.lang.startsWith('en'));
    if(preferred) utterance.voice=preferred;
    utterance.lang='en-US'; utterance.rate=.86; utterance.pitch=.9; utterance.volume=.95;
    speechActive=true;
    utterance.onend=()=>{ if(token===speechToken){speechActive=false;elapsed=Math.max(elapsed,duration-.8);} };
    utterance.onerror=event=>{if(token===speechToken){speechActive=false;if(event.error!=='canceled'&&event.error!=='interrupted'){voice=false;updateButtons();toast('Narration is unavailable. The story will continue with text.');}}};
    speechSynthesis.speak(utterance);
  }
  function updateButtons() {
    $('toggle').textContent=playing?'Ⅱ':'▶'; $('toggle').setAttribute('aria-label',playing?'Pause story':'Play story');
    $('audio').textContent=sound?'Sound on':'Sound off'; $('audio').setAttribute('aria-pressed',sound);
    $('narrate').textContent=voice?'Voice on':'Voice off'; $('narrate').setAttribute('aria-pressed',voice);
    $('motion').textContent=moving?'Motion on':'Motion off'; $('motion').setAttribute('aria-pressed',moving);
    document.body.classList.toggle('reduced',!moving);
    $('prev').disabled=started&&index===0; $('next').disabled=started&&index===beats.length-1;
  }
  function setPlaying(value) { playing=value;lastTick=performance.now();updateButtons();if(playing)speak();else cancelSpeech(); }
  function render(immediate=false) {
    const token=++transitionToken;
    cancelSpeech(); elapsed=0;
    const beat=beats[index], c=chapters[beat.chapter];
    duration=Math.max(5,beat.paragraphs.map(plain).join(' ').split(/\s+/).length/2.55+2.2);
    background(c.art);
    $('chapterLabel').textContent=beat.chapter===7?'EPILOGUE':'CHAPTER '+roman[beat.chapter];
    $('chapterTitle').textContent=c.title.replace(/^(Chapter [IVX]+|Epilogue) — /,'');
    $('beatCount').textContent=String(beat.local+1).padStart(2,'0')+' / '+String(c.beats.length).padStart(2,'0');
    $('mood').textContent=moods[beat.chapter];
    $('status').textContent=playing?'Let the story unfold.':'Take your time. Every scene will wait.';
    $('runtime').textContent='← → SCENES · SPACE PAUSE';
    $('position').textContent=String(index+1).padStart(2,'0')+' / '+beats.length;
    $('ending').hidden=index!==beats.length-1;
    const paint=()=>{
      if(token!==transitionToken)return;
      $('passage').innerHTML=beat.paragraphs.map(p=>{
        const match=p.match(/^\*\*(Ali|God|Devil):\*\*\s*(.*)$/s);
        return match?'<p class="dialogue"><span class="speaker '+match[1].toLowerCase()+'">'+match[1]+'</span>'+html(match[2])+'</p>':'<p class="narration">'+html(p)+'</p>';
      }).join('');
      $('passage').classList.remove('fading'); updateButtons();drawAtmosphere(performance.now());if(playing)speak();
    };
    $('passage').classList.add('fading');
    if(immediate||!moving)paint();else setTimeout(paint,280);
    updateProgress();
  }
  function begin(at=0) { started=true;index=at;$('opening').hidden=true;$('film').hidden=false;playing=true;render(true);updateButtons(); }
  function move(delta) {
    if(!started){begin();return;}
    const next=Math.max(0,Math.min(beats.length-1,index+delta));if(next===index)return;
    index=next; render();lastTick=performance.now();
  }
  function reset() {
    setPlaying(false);++transitionToken;started=false;index=0;elapsed=0;$('opening').hidden=false;$('film').hidden=true;background('abyss');$('mood').textContent=moods[0];$('status').textContent='A soul. A thousand battles. One more tomorrow.';$('runtime').textContent='YOUR JOURNEY BEGINS HERE';$('position').textContent='00 / '+beats.length;updateProgress();updateButtons();drawAtmosphere(performance.now());
  }
  function updateProgress() {
    const current=beats[index];
    chapters.forEach((c,i)=>{
      const fraction=!started?0:i<current.chapter?1:i>current.chapter?0:(current.local+Math.min(elapsed/duration,1))/c.beats.length;
      $('timeline').children[i].firstElementChild.style.width=(fraction*100)+'%';
      $('timeline').children[i].setAttribute('aria-current',started&&i===current.chapter?'step':'false');
    });
  }
  chapters.forEach((c,i)=>{
    const btn=document.createElement('button');btn.innerHTML='<span class="fill"></span>';btn.title=c.title;btn.setAttribute('aria-label',c.title);btn.onclick=()=>begin(beats.findIndex(b=>b.chapter===i));$('timeline').append(btn);
    const card=document.createElement('button');card.className='chapter-card';card.style.backgroundImage='url("images/'+c.art+'.jpg")';card.innerHTML='<span>'+ (i===7?'EPILOGUE':'CHAPTER '+roman[i])+'</span><h3>'+escape(c.title.replace(/^(Chapter [IVX]+|Epilogue) — /,''))+'</h3>';card.onclick=()=>{$('chapterDialog').close();begin(beats.findIndex(b=>b.chapter===i));};$('chapterList').append(card);
    const section=document.createElement('section');section.innerHTML='<h2>'+escape(c.title)+'</h2>'+c.paragraphs.map(p=>'<p>'+html(p)+'</p>').join('');$('readerContent').append(section);
  });
  $('begin').onclick=()=>begin();$('restart').onclick=()=>begin();$('home').onclick=e=>{e.preventDefault();reset();};
  $('toggle').onclick=()=>started?setPlaying(!playing):begin();$('next').onclick=()=>move(1);$('prev').onclick=()=>move(-1);
  let resumeAfterDialog=false;
  function openDialog(id){resumeAfterDialog=playing;setPlaying(false);$(id).showModal();}
  $('chaptersBtn').onclick=()=>openDialog('chapterDialog');$('readBtn').onclick=()=>openDialog('reader');
  document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('close',()=>{if(resumeAfterDialog){resumeAfterDialog=false;setPlaying(true);}});});
  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]')||/BUTTON|A|INPUT/.test(document.activeElement.tagName))return;
    if(e.code==='Space'){e.preventDefault();started?setPlaying(!playing):begin();}if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);
  });
  let touchX=0;
  $('film').addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
  $('film').addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-touchX;if(Math.abs(d)>65)move(d<0?1:-1);},{passive:true});
  $('narrate').onclick=()=>{
    if(!('speechSynthesis' in window)){toast('This browser does not support narration.');return;}
    voice=!voice;updateButtons();if(voice){toast('Browser narration enabled. Voice availability varies by device.');speak();}else cancelSpeech();
  };
  $('motion').onclick=()=>{moving=!moving;updateButtons();drawAtmosphere(performance.now());};
  $('fullscreen').onclick=async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else if($('cinema').requestFullscreen)await $('cinema').requestFullscreen();else toast('Fullscreen is not available in this browser.');}catch{toast('Fullscreen is not available in this browser.');}
  };
  $('audio').onclick=async()=>{
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Sound is unavailable in this browser.');return;}
      if(!audioContext){audioContext=new AC();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);
        [55,82.41,110,164.81].forEach((frequency,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=.045/(i+1);o.connect(g);g.connect(master);o.start();nodes.push(o);});
      }
      await audioContext.resume();sound=!sound;master.gain.setTargetAtTime(sound?.6:0,audioContext.currentTime,.7);updateButtons();
    }catch{toast('Sound could not start. Try again after interacting with the page.');}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)setPlaying(false);if(audioContext)audioContext.suspend();}else{lastTick=performance.now();if(sound&&audioContext)audioContext.resume().catch(()=>{});}});
  window.addEventListener('pagehide',()=>{cancelSpeech();if(audioContext)audioContext.suspend();});
  // A real rotating 3D mesh: native WebGL, no external engines or network requests.
  const soul=$('soul');const gl=soul.getContext('webgl',{alpha:true,antialias:true});
  let program,vertexBuffer,meshCount=0;
  if(gl){
    const vertex='attribute vec3 a;uniform float time;uniform float aspect;uniform vec2 center;varying float light;void main(){vec3 p=a;float c=cos(time*.22),s=sin(time*.22);p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);float c2=cos(.32),s2=sin(.32);p=vec3(p.x,p.y*c2-p.z*s2,p.y*s2+p.z*c2);float z=3.5-p.z;gl_Position=vec4((p.x*.37/aspect+center.x*z),p.y*.37+center.y*z,0.0,z);light=.35+.65*(p.z+1.0)*.5;}';
    const fragment='precision mediump float;uniform vec3 color;varying float light;void main(){gl_FragColor=vec4(color*light,light*.48);}';
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return null;return s;}
    const v=shader(gl.VERTEX_SHADER,vertex),f=shader(gl.FRAGMENT_SHADER,fragment);
    if(v&&f){program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))program=null;}
    if(program){
      const points=[],lat=16,lon=28;
      function point(i,j){const theta=Math.PI*i/lat,phi=2*Math.PI*j/lon;const r=1+.055*Math.sin(j*2.3+i*1.7);return [r*Math.sin(theta)*Math.cos(phi),r*Math.cos(theta),r*Math.sin(theta)*Math.sin(phi)];}
      for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){points.push(...point(i,j),...point(i,j+1),...point(i,j),...point(i+1,j),...point(i,j),...point(i+1,j+1));}
      meshCount=points.length/3;vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
    }
  }
  const canvas=$('atmosphere'),ctx=canvas.getContext('2d');let width=0,height=0,dpr=1;
  const particles=Array.from({length:115},()=>({x:Math.random(),y:Math.random(),z:Math.random(),phase:Math.random()*6.28}));
  let pointer={x:0,y:0};window.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;},{passive:true});
  function resize(){width=$('cinema').clientWidth;height=$('cinema').clientHeight;dpr=Math.min(devicePixelRatio||1,2);for(const c of [canvas,soul]){c.width=width*dpr;c.height=height*dpr;}if(gl)gl.viewport(0,0,soul.width,soul.height);}
  new ResizeObserver(resize).observe($('cinema'));resize();
  function drawAtmosphere(now){
    if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const t=moving?now*.00022:0,chapter=started?beats[index].chapter:0,bright=[3,4,6].includes(chapter);
    for(const p of particles){const x=(p.x*width+Math.sin(t+p.phase)*18+p.z*pointer.x*25+width)%width;const y=((p.y-t*(chapter===7?.003:.024)*(1+p.z))%1+1)%1*height;ctx.globalAlpha=.15+p.z*.42;ctx.fillStyle=bright?'#f4dbad':chapter===7?'#b8dfff':p.z>.65?'#df9861':'#81c8f0';ctx.beginPath();ctx.arc(x,y,.4+p.z*1.25,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    const visible=chapter!==7,cx=width*(width<700?.76:.73),cy=height*.44;
    if(visible){
      const r=Math.min(width,height)*.12,pulse=1+Math.sin(t*4)*.04,g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,bright?'rgba(211,228,246,.22)':'rgba(54,167,255,.26)');g.addColorStop(.3,'rgba(64,146,255,.07)');g.addColorStop(1,'rgba(64,146,255,0)');ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,2*r,2*r);
      ctx.strokeStyle='rgba(122,195,250,.2)';ctx.lineWidth=.7;
      for(let j=0;j<3;j++){ctx.beginPath();for(let i=0;i<=100;i++){const a=i/100*Math.PI*2,x=Math.cos(a)*r*.7*pulse,y=Math.sin(a)*r*.7*pulse,z=Math.sin(a)*r*.4;const angle=t+j*.85;const xx=x*Math.cos(angle)+z*Math.sin(angle),zz=-x*Math.sin(angle)+z*Math.cos(angle);const scale=450/(450-zz);const px=cx+xx*scale,py=cy+(y*.38+zz*.55)*scale;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}
    }
    if(gl&&program){
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);if(visible){gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);gl.uniform1f(gl.getUniformLocation(program,'time'),moving?now*.001:0);gl.uniform1f(gl.getUniformLocation(program,'aspect'),width/height);gl.uniform2f(gl.getUniformLocation(program,'center'),cx/width*2-1,1-cy/height*2);gl.uniform3f(gl.getUniformLocation(program,'color'),bright?.8:.3,bright?.88:.65,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.LINES,0,meshCount);}
    }
  }
  let lastDraw=0;
  function frame(now){
    const delta=Math.min((now-lastTick)/1000,.2);lastTick=now;
    if(playing&&started&&!document.hidden){elapsed+=delta;updateProgress();if(elapsed>=duration&&!speechActive){if(index<beats.length-1){index++;render();}else{elapsed=duration;setPlaying(false);$('status').textContent='Your story isn’t finished.';updateProgress();}}}
    if(!document.hidden&&(moving||lastDraw===0)&&now-lastDraw>32){drawAtmosphere(now);lastDraw=now;}
    requestAnimationFrame(frame);
  }
  background('abyss');updateButtons();$('position').textContent='00 / '+beats.length;requestAnimationFrame(frame);
})();
