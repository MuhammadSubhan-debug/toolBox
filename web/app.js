"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=(m,ok)=>{const e=$('#msg');if(e){e.textContent=m||'';e.className=ok?'ok':'err'}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const kb=n=>n>1048576?(n/1048576).toFixed(2)+' MB':(n/1024).toFixed(1)+' KB';
const base=n=>n.replace(/\.[^.]+$/,'');
const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
const tick=()=>new Promise(r=>setTimeout(r));
const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4e3)};
const lib=u=>new Promise((res,rej)=>{if(lib.c[u])return res();const s=document.createElement('script');s.src=u;s.onload=()=>{lib.c[u]=1;res()};s.onerror=()=>rej(new Error('Could not load a required component. Check your internet connection and try again.'));document.head.appendChild(s)});lib.c={};
const run=fn=>async(...a)=>{const b=$('#go');try{say('');if(b)b.disabled=true;await fn(...a)}catch(e){console.error(e);say(e&&e.message?e.message:String(e))}finally{if(b)b.disabled=false}};
const copy=async t=>{try{await navigator.clipboard.writeText(t);say('Copied to clipboard.',1)}catch(e){say('Copy failed. Select the text and copy it manually.')}};
const needFiles=(id,re,label)=>{const fs=[...$(id).files].filter(f=>re.test(f.type)||re.test(f.name));if(!fs.length)throw new Error('Please choose '+label+' first.');return fs};
const loadImg=f=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('"'+f.name+'" is not a valid or supported image.'));i.src=URL.createObjectURL(f)});
const toBlob=(c,t,q)=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('This browser cannot export '+t+'.')),t,q));
const cvs=(i,W,H,flat)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');if(flat){x.fillStyle='#fff';x.fillRect(0,0,W,H)}x.drawImage(i,0,0,W,H);return c};
const addRes=(b,n,note)=>{const u=URL.createObjectURL(b),d=document.createElement('div');d.className='res';d.innerHTML=(b.type.startsWith('image/')?'<img src="'+u+'" alt="">':'')+'<span>'+esc(n)+' &middot; '+kb(b.size)+' '+esc(note||'')+'</span><a class="btn" href="'+u+'" download="'+esc(n)+'">Download</a>';$('#out').appendChild(d)};
const clear=()=>{$('#out').innerHTML=''};
const JSPDF='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',PDFLIB='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',PDFW='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',TESS='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',LAME='https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js',SPARK='https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js',BARC='https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js';
$$('.drop').forEach(d=>{const i=$('input',d),s=$('span',d),t=s.textContent;i.addEventListener('change',()=>{s.textContent=i.files.length?i.files.length+' file(s) selected: '+[...i.files].map(f=>f.name).join(', ').slice(0,80):t});d.ondragover=e=>{e.preventDefault()};d.ondrop=e=>{e.preventDefault();i.files=e.dataTransfer.files;i.dispatchEvent(new Event('change'))}});
const T={};

/* ---------- Images ---------- */
T.img=mode=>{let r=1;const f=$('#f');
 if(mode=='resize'){f.addEventListener('change',run(async()=>{const i=await loadImg(needFiles('#f',/^image\//,'an image')[0]);$('#w').value=i.naturalWidth;$('#h').value=i.naturalHeight;r=i.naturalWidth/i.naturalHeight}));
  $('#w').oninput=()=>{if($('#lock').checked&&$('#w').value)$('#h').value=Math.round($('#w').value/r)};$('#h').oninput=()=>{if($('#lock').checked&&$('#h').value)$('#w').value=Math.round($('#h').value*r)}}
 $('#go').onclick=run(async()=>{const fs=needFiles('#f',/^image\//,'an image');clear();
  for(const file of fs){const i=await loadImg(file);let W=i.naturalWidth,H=i.naturalHeight;
   if(mode=='resize'){W=+$('#w').value;H=+$('#h').value;if(!(W>0&&H>0)||W>16000||H>16000)throw new Error('Enter a width and height between 1 and 16000 pixels.');if(fs.length>1)H=Math.round(W*i.naturalHeight/i.naturalWidth)}
   const t=mode=='resize'?(ext[file.type]?file.type:'image/png'):$('#fmt').value,q=mode=='compress'?$('#q').value/100:.92;
   const b=await toBlob(cvs(i,W,H,t=='image/jpeg'),t,q);addRes(b,base(file.name)+'-'+mode+'.'+ext[t],'(original '+kb(file.size)+(b.size>=file.size&&mode=='compress'?', already well optimized':'')+')')}
  say('Done.',1)})};
T.crop=()=>{let img,s=1,R=null,d=null;const cv=$('#cv'),x=cv.getContext('2d');
 const draw=()=>{x.clearRect(0,0,cv.width,cv.height);x.drawImage(img,0,0,cv.width,cv.height);if(R){x.fillStyle='rgba(0,0,0,.5)';x.beginPath();x.rect(0,0,cv.width,cv.height);x.rect(R.x,R.y,R.w,R.h);x.fill('evenodd');x.strokeStyle='#fff';x.lineWidth=2;x.strokeRect(R.x,R.y,R.w,R.h)}};
 $('#f').addEventListener('change',run(async()=>{img=await loadImg(needFiles('#f',/^image\//,'an image')[0]);s=Math.min(1,640/img.naturalWidth);cv.width=Math.round(img.naturalWidth*s);cv.height=Math.round(img.naturalHeight*s);R=null;cv.hidden=false;draw()}));
 const pos=e=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)*cv.width/b.width,(e.clientY-b.top)*cv.height/b.height]};
 cv.onpointerdown=e=>{d=pos(e);cv.setPointerCapture(e.pointerId)};cv.onpointerup=()=>{d=null};
 cv.onpointermove=e=>{if(!d)return;const[px,py]=pos(e);let w=px-d[0],h=py-d[1];const a=$('#ar').value;if(a!='free'){const[p,q]=a.split(':');h=(h<0?-1:1)*Math.abs(w)*q/p}
  let x0=Math.min(d[0],d[0]+w),y0=Math.min(d[1],d[1]+h),w2=Math.abs(w),h2=Math.abs(h);x0=Math.max(0,x0);y0=Math.max(0,y0);w2=Math.min(w2,cv.width-x0);h2=Math.min(h2,cv.height-y0);R={x:x0,y:y0,w:w2,h:h2};draw()};
 $('#go').onclick=run(async()=>{if(!img)throw new Error('Please choose an image first.');if(!R||R.w<3||R.h<3)throw new Error('Drag on the image to select the area to crop.');
  const c=document.createElement('canvas');c.width=Math.round(R.w/s);c.height=Math.round(R.h/s);c.getContext('2d').drawImage(img,R.x/s,R.y/s,R.w/s,R.h/s,0,0,c.width,c.height);clear();addRes(await toBlob(c,'image/png'),'cropped.png');say('Done.',1)})};
T.bg=()=>$('#go').onclick=run(async()=>{const f=needFiles('#f',/^image\//,'an image')[0];say('Removing background... the first run downloads an AI model (about 40 MB).',1);
 let m;try{m=await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm')}catch(e){throw new Error('Could not load the AI model. Check your internet connection.')}
 const b=await m.removeBackground(f);clear();addRes(b,base(f.name)+'-no-bg.png');say('Done.',1)});
T.img2pdf=()=>$('#go').onclick=run(async()=>{const fs=needFiles('#f',/^image\//,'one or more images');await lib(JSPDF);const{jsPDF}=window.jspdf;let doc;
 for(const f of fs){const i=await loadImg(f),w=i.naturalWidth,h=i.naturalHeight,o=w>h?'l':'p',u=cvs(i,w,h,true).toDataURL('image/jpeg',.92);if(!doc)doc=new jsPDF({orientation:o,unit:'px',format:[w,h],hotfixes:['px_scaling']});else doc.addPage([w,h],o);doc.addImage(u,'JPEG',0,0,w,h)}
 clear();addRes(doc.output('blob'),'images.pdf');say('Done.',1)});
T.ocr=()=>{$('#go').onclick=run(async()=>{const f=needFiles('#f',/^image\//,'an image')[0];await lib(TESS);say('Reading text... (language data downloads on first use)',1);
 const r=await Tesseract.recognize(f,$('#lang').value,{logger:m=>{if(m.status=='recognizing text')say('Reading text... '+Math.round(m.progress*100)+'%',1)}});const t=r.data.text.trim();$('#txt').value=t;say(t?'Done.':'No text was detected. Try a sharper, higher-contrast image or another language.',!!t)});
 $('#cp').onclick=()=>{if(!$('#txt').value)return say('Nothing to copy yet.');copy($('#txt').value)}};

/* ---------- PDF ---------- */
const openPdf=async f=>{try{return await PDFLib.PDFDocument.load(await f.arrayBuffer())}catch(e){throw new Error('"'+f.name+'" is damaged, password protected, or not a valid PDF.')}};
const pdfBlob=async d=>new Blob([await d.save()],{type:'application/pdf'});
T.merge=()=>$('#go').onclick=run(async()=>{const fs=needFiles('#f',/pdf/i,'two or more PDFs');if(fs.length<2)throw new Error('Select at least 2 PDF files.');await lib(PDFLIB);const m=await PDFLib.PDFDocument.create();
 for(const f of fs){const d=await openPdf(f);(await m.copyPages(d,d.getPageIndices())).forEach(p=>m.addPage(p))}clear();addRes(await pdfBlob(m),'merged.pdf');say('Done.',1)});
T.split=()=>$('#go').onclick=run(async()=>{const f=needFiles('#f',/pdf/i,'a PDF')[0];await lib(PDFLIB);const src=await openPdf(f),n=src.getPageCount();let rs=[];
 if($('#all').checked){for(let k=1;k<=n;k++)rs.push([k,k])}else{const s=$('#rg').value.trim();if(!s)throw new Error('Enter page ranges such as 1-3, 5 (this PDF has '+n+' pages).');
  for(const p of s.split(',').map(x=>x.trim()).filter(Boolean)){const m=p.match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw new Error('Invalid range "'+p+'". Use a format like 1-3, 5, 8-10.');const a=+m[1],b=m[2]?+m[2]:a;if(a<1||b<a||b>n)throw new Error('Range "'+p+'" is outside the document (1 to '+n+').');rs.push([a,b])}}
 clear();for(const[a,b]of rs){const d=await PDFLib.PDFDocument.create();const idx=[];for(let k=a;k<=b;k++)idx.push(k-1);(await d.copyPages(src,idx)).forEach(p=>d.addPage(p));addRes(await pdfBlob(d),base(f.name)+'-pages-'+a+(b>a?'-'+b:'')+'.pdf')}say('Done.',1)});
T.pdfc=()=>$('#go').onclick=run(async()=>{const f=needFiles('#f',/pdf/i,'a PDF')[0];await lib(PDFJS);await lib(JSPDF);pdfjsLib.GlobalWorkerOptions.workerSrc=PDFW;const{jsPDF}=window.jspdf;
 let pdf;try{pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise}catch(e){throw new Error('Could not read this PDF. It may be damaged or password protected.')}
 const[sc,q]=$('#lvl').value.split(',').map(Number);let doc;
 for(let p=1;p<=pdf.numPages;p++){say('Compressing page '+p+' of '+pdf.numPages+'...',1);await tick();const pg=await pdf.getPage(p),vp=pg.getViewport({scale:sc}),c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:x,viewport:vp}).promise;
  const o=c.width>c.height?'l':'p';if(!doc)doc=new jsPDF({orientation:o,unit:'px',format:[c.width,c.height],hotfixes:['px_scaling']});else doc.addPage([c.width,c.height],o);doc.addImage(c.toDataURL('image/jpeg',q),'JPEG',0,0,c.width,c.height)}
 const b=doc.output('blob');clear();if(b.size>=f.size)return say('This PDF is already well optimized. A re-compressed copy would be larger ('+kb(b.size)+' vs '+kb(f.size)+'), so nothing was created.');addRes(b,base(f.name)+'-compressed.pdf','(original '+kb(f.size)+')');say('Done.',1)});

/* ---------- Developer tools ---------- */
T.json=()=>{const i=$('#in'),o=$('#o'),ind=()=>{const v=$('#ind').value;return v=='t'?'\t':+v};
 const explain=(e,s)=>{let m=e.message||'Invalid JSON',pos=(m.match(/position (\d+)/)||[])[1],ln=(m.match(/line (\d+)/)||[])[1],col=(m.match(/column (\d+)/)||[])[1];
  if(pos!=null){const b=s.slice(0,+pos).split('\n');ln=b.length;col=b[b.length-1].length+1}
  const h=[];if(/,\s*[}\]]/.test(s))h.push('trailing comma before a closing } or ]');if(/'[^'\n]*'\s*:/.test(s)||/:\s*'/.test(s))h.push('single quotes instead of double quotes');if(/(^|[{,])\s*[A-Za-z_$][\w$]*\s*:/.test(s))h.push('property names without quotes');if(/\/\/|\/\*/.test(s))h.push('comments (not allowed in JSON)');if(/\b(undefined|NaN|Infinity)\b/.test(s))h.push('undefined, NaN or Infinity (not valid JSON)');
  return 'Invalid JSON'+(ln?' at line '+ln+(col?', column '+col:''):'')+'.\n'+m+(h.length?'\nPossible causes: '+h.join('; ')+'. Try the Repair button.':'')};
 const parse=()=>{const s=i.value.replace(/^\uFEFF/,'');if(!s.trim())throw new Error('Paste some JSON first.');try{return JSON.parse(s)}catch(e){throw new Error(explain(e,s))}};
 const show=(t,m)=>{o.value=t;say(m,1)};
 $('#fmtb').onclick=run(()=>{show(JSON.stringify(parse(),null,ind()),'Valid JSON, formatted.')});
 $('#min').onclick=run(()=>{show(JSON.stringify(parse()),'Valid JSON, minified.')});
 $('#val').onclick=run(()=>{const v=parse();say('Valid JSON ('+(Array.isArray(v)?'array of '+v.length+' items':v===null?'null':typeof v=='object'?'object with '+Object.keys(v).length+' keys':typeof v)+').',1)});
 $('#fix').onclick=run(()=>{let s=i.value.replace(/^\uFEFF/,'');if(!s.trim())throw new Error('Paste some JSON first.');
  s=s.replace(/("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,(m,a)=>a||'').replace(/'((?:\\.|[^'\\])*)'/g,(m,a)=>'"'+a.replace(/"/g,'\\"')+'"').replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g,'$1"$2"$3').replace(/\bundefined\b|\bNaN\b/g,'null').replace(/,\s*([}\]])/g,'$1');
  let v;try{v=JSON.parse(s)}catch(e){throw new Error('Automatic repair was not enough. '+explain(e,s))}show(JSON.stringify(v,null,ind()),'Repaired and formatted. Please review the result.')});
 $('#cp').onclick=()=>o.value?copy(o.value):say('Nothing to copy yet.');$('#sv').onclick=()=>o.value?dl(new Blob([o.value],{type:'application/json'}),'data.json'):say('Nothing to download yet.')};
T.b64=()=>{const i=$('#in'),o=$('#o');
 const toB=u=>{let s='';for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode.apply(null,u.subarray(k,k+8192));let b=btoa(s);if($('#us').checked)b=b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return b};
 $('#enc').onclick=run(()=>{if(!i.value)throw new Error('Enter some text to encode.');o.value=toB(new TextEncoder().encode(i.value));say('Encoded.',1)});
 $('#dec').onclick=run(()=>{let s=i.value.replace(/^data:[^,]*;base64,/,'').replace(/\s+/g,'');if(!s)throw new Error('Enter Base64 text to decode.');s=s.replace(/-/g,'+').replace(/_/g,'/');
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw new Error('Not valid Base64: it contains characters outside A-Z, a-z, 0-9, +, /, = (or - and _ for URL-safe).');if(s.replace(/=+$/,'').length%4==1)throw new Error('Not valid Base64: the length is incorrect (data may be cut off).');
  s=s.replace(/=+$/,'');s+='='.repeat((4-s.length%4)%4);let bin;try{bin=atob(s)}catch(e){throw new Error('Not valid Base64 data.')}
  const u=Uint8Array.from(bin,c=>c.charCodeAt(0));try{o.value=new TextDecoder('utf-8',{fatal:true}).decode(u);say('Decoded.',1)}catch(e){o.value='';if(confirm('This Base64 decodes to binary data, not text. Download it as a file?'))dl(new Blob([u]),'decoded.bin');say('Decoded to binary data (not readable text).')}});
 $('#f').onchange=run(async()=>{const f=$('#f').files[0];if(!f)return;if(f.size>20e6)throw new Error('File is too large for this tool (limit 20 MB).');o.value=toB(new Uint8Array(await f.arrayBuffer()));say('File encoded.',1)});
 $('#cp').onclick=()=>o.value?copy(o.value):say('Nothing to copy yet.')};
T.hash=()=>$('#go').onclick=run(async()=>{const f=$('#f').files[0],t=$('#in').value;if(!f&&!t)throw new Error('Type some text or choose a file first.');if(f&&f.size>500e6)throw new Error('File is too large (limit 500 MB).');
 const buf=f?await f.arrayBuffer():new TextEncoder().encode(t).buffer;await lib(SPARK);const hx=a=>[...new Uint8Array(a)].map(b=>b.toString(16).padStart(2,'0')).join('');const res=[['MD5',SparkMD5.ArrayBuffer.hash(buf)]];
 if(!crypto.subtle)say('SHA hashes need HTTPS or localhost. Showing MD5 only.');else for(const a of['SHA-1','SHA-256','SHA-384','SHA-512'])res.push([a,hx(await crypto.subtle.digest(a,buf))]);
 $('#hs').innerHTML=res.map(([a,h])=>'<div class="hr"><b>'+a+'</b><code>'+h+'</code><button class="btn alt" data-h="'+h+'">Copy</button></div>').join('');$$('[data-h]').forEach(b=>b.onclick=()=>copy(b.dataset.h))});
T.pw=()=>{const rnd=n=>{const m=Math.floor(4294967296/n)*n;let x;do{x=crypto.getRandomValues(new Uint32Array(1))[0]}while(x>=m);return x%n};
 const gen=run(()=>{const L=+$('#len').value;let am=$('#am').checked;const S=[];[['u','ABCDEFGHIJKLMNOPQRSTUVWXYZ'],['l','abcdefghijklmnopqrstuvwxyz'],['n','0123456789'],['s','!@#$%^&*()-_=+[]{};:,.?']].forEach(([id,c])=>{if($('#'+id).checked){if(am)c=c.replace(/[Il1O0|]/g,'');S.push(c)}});
  if(!S.length)throw new Error('Select at least one character type.');if(L<S.length||L>128)throw new Error('Length must be between '+S.length+' and 128.');const pool=S.join('');const a=S.map(c=>c[rnd(c.length)]);while(a.length<L)a.push(pool[rnd(pool.length)]);
  for(let k=a.length-1;k>0;k--){const j=rnd(k+1);[a[k],a[j]]=[a[j],a[k]]}$('#pw').value=a.join('');const e=L*Math.log2(pool.length),lv=e<45?['Weak',25]:e<70?['Fair',50]:e<100?['Strong',75]:['Very strong',100];$('#bar').style.width=lv[1]+'%';$('#st').textContent=lv[0]+' (about '+Math.round(e)+' bits of entropy)'});
 $('#go').onclick=gen;$$('input').forEach(e=>e.onchange=gen);$('#len').oninput=()=>{$('#lv').textContent=$('#len').value;gen()};$('#cp').onclick=()=>$('#pw').value?copy($('#pw').value):say('Generate a password first.');gen()};
T.color=()=>{const h2r=h=>{h=h.replace('#','');if(h.length==3)h=[...h].map(c=>c+c).join('');return /^[0-9a-f]{6}$/i.test(h)?[0,2,4].map(i=>parseInt(h.substr(i,2),16)):null};
 const hsl=([r,g,b])=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b);let h=0,s=0,l=(M+m)/2;if(M!=m){const d=M-m;s=l>.5?d/(2-M-m):d/(M+m);h=M==r?(g-b)/d+(g<b?6:0):M==g?(b-r)/d+2:(r-g)/d+4;h*=60}return[h,s*100,l*100]};
 const hex=(h,s,l)=>{h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return'#'+[f(0),f(8),f(4)].map(v=>v.toString(16).padStart(2,'0')).join('')};
 const sw=(c,t)=>'<span class="sw" data-c="'+c+'"><i style="background:'+c+'"></i>'+(t||c)+'</span>';
 const set=v=>{const r=h2r(v);if(!r)return say('Enter a valid HEX color like #3b82f6 or #38f.');say('');const c='#'+r.map(n=>n.toString(16).padStart(2,'0')).join(''),[h,s,l]=hsl(r);$('#cp').value=c;$('#hx').value=c;
  $('#vals').innerHTML='<p>'+sw(c)+' <code>HEX '+c+'<br>RGB rgb('+r.join(', ')+')<br>HSL hsl('+Math.round(h)+', '+Math.round(s)+'%, '+Math.round(l)+'%)</code></p>';
  const G=(t,a)=>'<h3>'+t+'</h3>'+a.map(x=>sw(x)).join('');$('#pal').innerHTML=G('Complementary',[c,hex(h+180,s,l)])+G('Analogous',[hex(h-30,s,l),c,hex(h+30,s,l)])+G('Triadic',[c,hex(h+120,s,l),hex(h+240,s,l)])+G('Split complementary',[c,hex(h+150,s,l),hex(h+210,s,l)])+G('Shades and tints',[90,75,60,45,30,15].map(x=>hex(h,s,x)));
  $$('.sw').forEach(e=>e.onclick=()=>copy(e.dataset.c))};
 $('#cp').oninput=()=>set($('#cp').value);$('#hx').oninput=()=>{let v=$('#hx').value.trim();if(v&&v[0]!='#')v='#'+v;if(h2r(v))set(v)};
 $('#rnd').onclick=()=>set('#'+[0,0,0].map(()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(''));
 if(window.EyeDropper)$('#eye').onclick=run(async()=>{set((await new EyeDropper().open()).sRGBHex)});else $('#eye').hidden=true;set('#3b82f6')};

/* ---------- Video ---------- */
T.v2a=()=>$('#go').onclick=run(async()=>{const f=needFiles('#f',/^(video|audio)\//,'a video file')[0];if(f.size>2e9)throw new Error('File is too large to convert in the browser (limit about 2 GB).');await lib(LAME);say('Decoding audio...',1);await tick();
 const ctx=new(window.AudioContext||window.webkitAudioContext)();let buf;try{buf=await ctx.decodeAudioData(await f.arrayBuffer())}catch(e){throw new Error('Could not read audio from this file. It may have no audio track, use an unsupported codec, or be too large for your device memory.')}finally{ctx.close()}
 const ch=Math.min(2,buf.numberOfChannels),enc=new lamejs.Mp3Encoder(ch,buf.sampleRate,+$('#kbps').value),cv=a=>{const o=new Int16Array(a.length);for(let k=0;k<a.length;k++){const s=Math.max(-1,Math.min(1,a[k]));o[k]=s<0?s*32768:s*32767}return o};
 const L=cv(buf.getChannelData(0)),Rr=ch>1?cv(buf.getChannelData(1)):null,B=11520,parts=[];
 for(let k=0,c=0;k<L.length;k+=B,c++){const d=ch>1?enc.encodeBuffer(L.subarray(k,k+B),Rr.subarray(k,k+B)):enc.encodeBuffer(L.subarray(k,k+B));if(d.length)parts.push(d);if(c%150==0){say('Encoding MP3... '+Math.round(k/L.length*100)+'%',1);await tick()}}
 parts.push(enc.flush());clear();addRes(new Blob(parts,{type:'audio/mpeg'}),base(f.name)+'.mp3');say('Done.',1)});
T.vc=()=>$('#go').onclick=run(async()=>{const f=needFiles('#f',/^video\//,'a video')[0];if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw new Error('This browser cannot compress video. Please use Chrome, Edge or Firefox on a computer.');
 const v=document.createElement('video');v.src=URL.createObjectURL(f);v.playsInline=true;await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(new Error('This video format cannot be read by your browser.'))});
 const H=Math.min(+$('#res').value,v.videoHeight),W=Math.round(v.videoWidth*H/v.videoHeight/2)*2,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),st=c.captureStream(30),ac=new AudioContext(),dst=ac.createMediaStreamDestination();ac.createMediaElementSource(v).connect(dst);dst.stream.getAudioTracks().forEach(t=>st.addTrack(t));await ac.resume();
 const mt=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mt)throw new Error('WebM recording is not supported in this browser.');
 const rec=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:+$('#br').value*1000,audioBitsPerSecond:96000}),ch=[];rec.ondataavailable=e=>e.data.size&&ch.push(e.data);const stopped=new Promise(r=>rec.onstop=r);
 rec.start(500);await v.play();await new Promise(res=>{v.onended=res;const loop=()=>{if(v.ended)return;x.drawImage(v,0,0,W,H);say('Compressing... '+Math.round(v.currentTime/v.duration*100)+'% (keep this tab open)',1);requestAnimationFrame(loop)};loop()});
 rec.stop();await stopped;ac.close();const b=new Blob(ch,{type:'video/webm'});clear();addRes(b,base(f.name)+'-compressed.webm','(original '+kb(f.size)+(b.size>=f.size?', result is not smaller: try lower bitrate or resolution':'')+')');say('Done.',1)});

/* ---------- Business and design ---------- */
T.receipt=()=>{const cv=$('#cv'),no=String(Math.floor(Math.random()*9e5+1e5));
 const build=()=>{const cur=$('#cur').value||'$',tax=parseFloat($('#tax').value)||0;if(tax<0||tax>100)throw new Error('Tax must be between 0 and 100%.');const m=v=>cur+v.toFixed(2),rows=[];let sub=0;
  $('#items').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach((l,n)=>{const p=l.split(',').map(s=>s.trim());if(p.length<3)throw new Error('Line '+(n+1)+': use the format Item, quantity, price.');const q=parseFloat(p[p.length-2]),pr=parseFloat(p[p.length-1]);if(!(q>0)||!(pr>=0))throw new Error('Line '+(n+1)+': quantity and price must be numbers.');rows.push([p.slice(0,-2).join(','),q,pr]);sub+=q*pr});
  if(!rows.length)throw new Error('Add at least one item.');const L=[],C=(t,b)=>L.push({t,c:1,b}),Rw=(a,b,bold)=>L.push({t:a,r:b,b:bold}),Dv=()=>C('-'.repeat(36)),tx=sub*tax/100;
  C($('#shop').value||'STORE',1);$('#addr').value.split('\n').filter(Boolean).forEach(a=>C(a));C(new Date().toLocaleString());C('Receipt #'+no);Dv();rows.forEach(([n,q,p])=>Rw(q+' x '+n.slice(0,22),m(q*p)));Dv();Rw('Subtotal',m(sub));if(tax)Rw('Tax ('+tax+'%)',m(tx));Rw('TOTAL',m(sub+tx),1);Dv();C($('#foot').value);
  const lh=26,Wd=440;cv.width=Wd;cv.height=L.length*lh+48;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,Wd,cv.height);x.fillStyle='#111';x.textBaseline='middle';
  L.forEach((l,k)=>{const y=24+lh*k+lh/2;x.font=(l.b?'bold 18px':'15px')+' "Courier New",monospace';if(l.c){x.textAlign='center';x.fillText(l.t,Wd/2,y)}else{x.textAlign='left';x.fillText(l.t,24,y);x.textAlign='right';x.fillText(l.r,Wd-24,y)}})};
 $('#go').onclick=run(build);$('#png').onclick=run(async()=>{build();dl(await toBlob(cv,'image/png'),'receipt.png')});$('#pr').onclick=run(()=>{build();const w=open('');if(!w)throw new Error('Pop-up blocked. Allow pop-ups to print, or download the PNG.');w.document.write('<img src="'+cv.toDataURL()+'" style="max-width:100%" onload="print()">');w.document.close()});
 $$('input,textarea').forEach(e=>e.oninput=()=>{try{build();say('')}catch(er){say(er.message)}});$('#go').click()};
T.barcode=()=>{const svg=$('#bc'),gen=async()=>{await lib(BARC);const v=$('#v').value.trim(),f=$('#fm').value;if(!v)throw new Error('Enter a value for the barcode.');
  try{JsBarcode(svg,v,{format:f,displayValue:true,margin:12,background:'#fff',lineColor:'#000'})}catch(e){svg.innerHTML='';throw new Error('"'+v+'" is not valid for '+f+'. EAN-13 needs 12-13 digits, EAN-8 7-8 digits, UPC 11-12 digits, ITF-14 13-14 digits, CODE 39 uses A-Z, 0-9 and - . $ / + %, CODE 128 accepts any ASCII text.')}};
 const S=()=>{if(!svg.firstChild)throw new Error('Generate a barcode first.');return new XMLSerializer().serializeToString(svg)};
 $('#go').onclick=run(gen);$('#svg').onclick=run(async()=>{await gen();dl(new Blob([S()],{type:'image/svg+xml'}),'barcode.svg')});
 $('#png').onclick=run(async()=>{await gen();const i=new Image(),w=svg.width.baseVal.value,h=svg.height.baseVal.value;await new Promise((res,rej)=>{i.onload=res;i.onerror=()=>rej(new Error('Could not export PNG.'));i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(S())});const c=cvs(i,w*3,h*3,true);dl(await toBlob(c,'image/png'),'barcode.png')});$('#go').click()};
T.qr=()=>{let generated=[],logoImage=null;
 const preview=$('#qrpreview'),download=$('#qrdownload'),zipBtn=$('#qrzip'),text=$('#qrtext');
 const palettes={
  classic:{dark:'#111827',light:'#ffffff',card:'#ffffff',ink:'#111827'},
  blue:{dark:'#123b70',light:'#ffffff',card:'#eff6ff',ink:'#123b70'},
  purple:{dark:'#54218a',light:'#ffffff',card:'#f5f0ff',ink:'#54218a'},
  dark:{dark:'#ffffff',light:'#172033',card:'#172033',ink:'#ffffff'},
  green:{dark:'#14532d',light:'#ffffff',card:'#f0fdf4',ink:'#14532d'}
 };
 const socialFor=value=>{
  if(!$('#qrsocial').checked)return null;
  let u=value.toLowerCase();
  const rules=[
   [/instagram\.com|instagr\.am/,'IG','#C13584'],[/facebook\.com|fb\.com/,'f','#1877F2'],
   [/tiktok\.com/,'♪','#111111'],[/youtube\.com|youtu\.be/,'▶','#FF0000'],
   [/linkedin\.com/,'in','#0A66C2'],[/wa\.me|whatsapp\.com/,'WA','#25D366'],
   [/x\.com|twitter\.com/,'X','#111111'],[/t\.me|telegram\.me/,'➤','#229ED9'],
   [/snapchat\.com/,'👻','#FACC15']
  ];
  for(const [re,label,color] of rules)if(re.test(u))return{label,color};
  return null;
 };
 const loadLogo=file=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error('Could not read the selected logo image.'));im.src=URL.createObjectURL(file)});
 const makeOne=async(value,index)=>{
  const size=+$('#qrsize').value,p=palettes[$('#qrdesign').value]||palettes.classic;
  const levels={L:QRCode.CorrectLevel.L,M:QRCode.CorrectLevel.M,Q:QRCode.CorrectLevel.Q,H:QRCode.CorrectLevel.H};
  const holder=document.createElement('div');holder.style.cssText='position:absolute;left:-10000px;top:0;background:'+p.light+';padding:0;line-height:0';
  document.body.appendChild(holder);
  try{new QRCode(holder,{text:value,width:size,height:size,colorDark:p.dark,colorLight:p.light,correctLevel:levels[$('#qrecc').value]})}
  catch(e){holder.remove();throw new Error('QR '+(index+1)+' could not be created. Try shorter content.')}
  await new Promise(r=>setTimeout(r,60));
  const qr=$('canvas',holder);if(!qr){holder.remove();throw new Error('QR '+(index+1)+' could not render.')}
  const frame=$('#qrframe').value, pad=frame==='none'?8:22, labelH=frame==='label'?42:frame==='rounded'?24:0;
  const c=document.createElement('canvas');c.width=size+pad*2;c.height=size+pad*2+labelH;
  const x=c.getContext('2d');x.fillStyle=p.card;x.fillRect(0,0,c.width,c.height);
  if(frame==='rounded'){x.beginPath();x.roundRect(1,1,c.width-2,c.height-2,24);x.fillStyle=p.card;x.fill();x.strokeStyle=p.dark;x.globalAlpha=.22;x.stroke();x.globalAlpha=1}
  x.drawImage(qr,pad,pad,size,size);holder.remove();
  let mark=null;if(logoImage)mark={image:logoImage};else mark=socialFor(value);
  if(mark){
   const logoSize=Math.round(size*(+$('#qrlogosize').value/100));
   const cx=pad+size/2,cy=pad+size/2,back=logoSize+12;
   x.fillStyle='#ffffff';x.beginPath();x.roundRect(cx-back/2,cy-back/2,back,back,Math.max(5,back*.18));x.fill();
   if(mark.image){const im=mark.image,ratio=Math.min(logoSize/im.naturalWidth,logoSize/im.naturalHeight);const w=im.naturalWidth*ratio,h=im.naturalHeight*ratio;x.drawImage(im,cx-w/2,cy-h/2,w,h)}
   else{x.fillStyle=mark.color;x.beginPath();x.arc(cx,cy,logoSize/2,0,Math.PI*2);x.fill();x.fillStyle=mark.label==='👻'?'#111827':'#fff';x.font='bold '+Math.max(10,logoSize*.55)+'px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(mark.label,cx,cy+1)}
  }
  if(labelH){x.fillStyle=p.ink;x.font='600 13px system-ui';x.textAlign='center';x.textBaseline='middle';let label=value.length>45?value.slice(0,42)+'…':value;x.fillText(label,c.width/2,size+pad+labelH/2)}
  return c;
 };
 const generate=async()=>{
  const values=text.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  if(!values.length)throw new Error('Enter text or URLs first.');
  if(values.length>50)throw new Error('Please generate up to 50 QR codes per batch.');
  if(values.some(v=>v.length>2500))throw new Error('Each QR content must be under 2500 characters.');
  await lib('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
  generated=[];preview.innerHTML='';download.disabled=true;zipBtn.disabled=true;
  if($('#qrlogo').files[0])logoImage=await loadLogo($('#qrlogo').files[0]);else logoImage=null;
  for(let i=0;i<values.length;i++){
   say('Creating QR '+(i+1)+' of '+values.length+'…',1);
   const c=await makeOne(values[i],i),blob=await toBlob(c,'image/png');
   const name='qr-code-'+String(i+1).padStart(2,'0')+'.png';generated.push({blob,name,canvas:c,value:values[i]});
   const card=document.createElement('div');card.className='qr-item';
   const img=document.createElement('img');img.src=URL.createObjectURL(blob);img.alt='QR code '+(i+1);img.width=180;
   const caption=document.createElement('p');caption.textContent=values[i].length>70?values[i].slice(0,67)+'…':values[i];
   const btn=document.createElement('button');btn.className='btn alt';btn.textContent='Download PNG';btn.onclick=()=>dl(blob,name);
   card.append(img,caption,btn);preview.appendChild(card);
  }
  download.disabled=false;zipBtn.disabled=false;say('Generated '+generated.length+' QR code(s). Scan-test them before use.',1);
 };
 $('#go').onclick=run(generate);
 download.onclick=run(async()=>{if(!generated.length)throw new Error('Generate QR codes first.');dl(generated[0].blob,generated[0].name);say('First QR code downloaded.',1)});
 zipBtn.onclick=run(async()=>{if(!generated.length)throw new Error('Generate QR codes first.');await lib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');const zip=new JSZip();generated.forEach(g=>zip.file(g.name,g.blob));const b=await zip.generateAsync({type:'blob'});dl(b,'qr-codes.zip');say('ZIP created with '+generated.length+' QR code(s).',1)});
 $('#qrcopy').onclick=()=>{if(!text.value.trim())return say('Enter some content to copy.');copy(text.value)};
 text.addEventListener('input',()=>{generated=[];download.disabled=true;zipBtn.disabled=true});
 ['qrsize','qrecc','qrdesign','qrframe','qrlogosize','qrsocial','qrlogo'].forEach(id=>$('#'+id).addEventListener('change',()=>{generated=[];download.disabled=true;zipBtn.disabled=true}));
};
T.logo=()=>{const cv=$('#cv'),draw=(c,S)=>{const x=c.getContext('2d');c.width=c.height=S;x.clearRect(0,0,S,S);const sh=$('#shape').value;x.fillStyle=$('#bg').value;
  if(sh=='circle'){x.beginPath();x.arc(S/2,S/2,S/2,0,7);x.fill()}else if(sh=='round'){x.beginPath();x.roundRect(0,0,S,S,S*.2);x.fill()}else if(sh=='square')x.fillRect(0,0,S,S);
  x.fillStyle=$('#fg').value;x.textAlign='center';x.textBaseline='middle';const ic=$('#icon').value.trim(),t=$('#txt').value,fn=$('#font').value;if(ic){x.font=S*.32+'px sans-serif';x.fillText(ic,S/2,S*.36)}
  let fs=S*.2;x.font='700 '+fs+'px '+fn;while(x.measureText(t).width>S*.78&&fs>8){fs-=2;x.font='700 '+fs+'px '+fn}x.fillText(t,S/2,ic?S*.7:S/2)};
 $$('input,select').forEach(e=>e.oninput=()=>draw(cv,512));$('#go').onclick=run(async()=>{const c=document.createElement('canvas');draw(c,1024);dl(await toBlob(c,'image/png'),'logo.png')});draw(cv,512)};
