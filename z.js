(function(){
var PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',PDFW='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',JSPDF='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',TESS='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
var LD={};function load(u){if(LD[u])return LD[u];LD[u]=new Promise(function(ok,no){var s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=function(){delete LD[u];no(new Error('load '+u));};document.head.appendChild(s);});return LD[u];}
function pdfjs(){return load(PDFJS).then(function(){var L=window.pdfjsLib;L.GlobalWorkerOptions.workerSrc=PDFW;return L;});}
function U(){return window.XP_U;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var NAT={ETHIOPIA:'إثيوبيا',ETHIOPIAN:'إثيوبيا',ETH:'إثيوبيا',KENYA:'كينيا',KENYAN:'كينيا',KEN:'كينيا',PHILIPPINES:'الفلبين',FILIPINO:'الفلبين',FILIPINA:'الفلبين',PHL:'الفلبين',UGANDA:'أوغندا',UGANDAN:'أوغندا',UGA:'أوغندا',INDONESIA:'إندونيسيا',INDONESIAN:'إندونيسيا',IDN:'إندونيسيا','SRI LANKA':'سريلانكا','SRI LANKAN':'سريلانكا',LKA:'سريلانكا',BANGLADESH:'بنغلاديش',BANGLADESHI:'بنغلاديش',BGD:'بنغلاديش',INDIA:'الهند',INDIAN:'الهند',IND:'الهند',PAKISTAN:'باكستان',PAKISTANI:'باكستان',PAK:'باكستان',BURUNDI:'بوروندي',BURUNDIAN:'بوروندي',BDI:'بوروندي'};
var MON={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,SEPT:8,OCT:9,NOV:10,DEC:11};
function yr(y){y=+y;return y<100?(y>40?1900+y:2000+y):y;}
var ARN=[[/اثيوب|حبش/,'إثيوبيا'],[/كيني/,'كينيا'],[/فلبين/,'الفلبين'],[/اوغند/,'أوغندا'],[/اندونيس/,'إندونيسيا'],[/سريلانك|سيرلانك/,'سريلانكا'],[/بنغلاد|بنجلاد/,'بنغلاديش'],[/هند/,'الهند'],[/باكستان/,'باكستان'],[/بوروند/,'بوروندي']];
function arn(s){return String(s||'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');}
var STOPL=/\b(NATIONALITY|CITIZENSHIP|DATE|BIRTH|GENDER|SEX|RELIGION|PASSPORT|AGE|PLACE|STATUS|MARITAL|SALARY|POSITION|NO|NUMBER|TEL|PHONE|MOBILE|CONTACT|HEIGHT|WEIGHT|ADDRESS|EDUCATION|LANGUAGE|SKILLS?|EXPERIENCE|ISSUE|EXPIRY|CHILDREN|REF|CODE|COUNTRY|SURNAME|GIVEN|FIRST|LAST|MIDDLE|FATHER|MOTHER|AGENCY|AGENT|NAME|COMPANY|OFFICE|RELIGION|GENDER|DOB|D\.O\.B)\b/;
function vName(s){s=String(s||'').toUpperCase().replace(/[؀-ۿ]+/g,' ').replace(/[^A-Z' \-]/g,' ').replace(/\s+/g,' ').trim();s=s.replace(/^(?:(?:OF|THE|IN|FULL|APPLICANT'?S?|CANDIDATE'?S?|WORKER'?S?|MAID'?S?)\s+)+/,'');if(/^(OF|APPLICANT|CANDIDATE)\b/.test(s))return null;var m=STOPL.exec(s);if(m)s=s.slice(0,m.index).trim();
 var w=s.split(' ').filter(function(x){return x.replace(/[^A-Z]/g,'').length>=2;});if(w.length<2||w.length>6)return null;if(w.some(function(x){return x.length>16;}))return null;return w.join(' ');}
function vNameAr(s){var w=String(s||'').replace(/[^؀-ۿ ]/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(function(x){return x.length>=2;});if(!w.length||w.length>5)return null;if(/الجنسي|الجواز|الميلاد|العمر|الراتب|الديان/.test(w.join(' ')))return null;return w.join(' ');}
function vWord(s){s=String(s||'').toUpperCase().replace(/[؀-ۿ]+/g,' ').replace(/[^A-Z' \-]/g,' ').replace(/\s+/g,' ').trim();var m=STOPL.exec(s);if(m)s=s.slice(0,m.index).trim();var w=s.split(' ').filter(function(x){return x.length>=2;});return w.length&&w.length<=4?w.join(' '):null;}
function vPP(s){var u=String(s||'').toUpperCase();var m=/\b([A-Z]{1,2}\s?\d{6,9}[A-Z]?)\b/.exec(u)||/\b([A-Z]{1,2}\d{1,4}\s\d{3,8}[A-Z]?)\b/.exec(u);if(!m)return null;var v=m[1].replace(/\s/g,'');return /^[A-Z]{1,2}\d{6,9}[A-Z]?$/.test(v)?v:null;}
function vNat(s){var u=String(s||'').toUpperCase(),a=arn(s);for(var k in NAT){if(new RegExp('\\b'+k+'\\b').test(u))return NAT[k];}for(var i=0;i<ARN.length;i++)if(ARN[i][0].test(a))return ARN[i][1];return null;}
function vSal(s){var u=String(s||'').toUpperCase().replace(/(\d)[,. ](\d{3})\b/g,'$1$2');var re=/\b(\d{3,4})\b/g,m;while((m=re.exec(u))){var n=+m[1];if(n>=500&&n<=6000)return n;}return null;}
function okAge(d){if(!d||isNaN(d))return false;var a=(new Date()-d)/31557600000;return a>=17&&a<=66;}
function vDate(s){var u=String(s||'').toUpperCase(),m,d;
 if((m=/\b(\d{1,2})(?:ST|ND|RD|TH)?[\s\-\/.,]*([A-Z]{3,9})[\s\-\/.,]*(\d{2,4})\b/.exec(u))&&MON[m[2].slice(0,3)]!=null){d=new Date(yr(m[3]),MON[m[2].slice(0,3)],+m[1]);if(okAge(d))return d;}
 if((m=/\b([A-Z]{3,9})[\s\-\/.]*(\d{1,2})(?:ST|ND|RD|TH)?[\s,\-\/.]+(\d{4})\b/.exec(u))&&MON[m[1].slice(0,3)]!=null){d=new Date(+m[3],MON[m[1].slice(0,3)],+m[2]);if(okAge(d))return d;}
 if((m=/\b(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})\b/.exec(u))){d=new Date(+m[1],+m[2]-1,+m[3]);if(okAge(d))return d;}
 if((m=/\b(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})\b/.exec(u))){var a=+m[1],b=+m[2];if(a>12&&b<=12)d=new Date(yr(m[3]),b-1,a);else if(b>12&&a<=12)d=new Date(yr(m[3]),a-1,b);else d=new Date(yr(m[3]),b-1,a);if(okAge(d))return d;}
 return null;}
function vAge(s){var m=/\b(\d{2})\b/.exec(String(s||''));if(m&&+m[1]>=18&&+m[1]<=65)return +m[1];return null;}
function grab(lines,labels,val,excl){for(var i=0;i<lines.length;i++){var L=lines[i];for(var j=0;j<labels.length;j++){var re=labels[j],m=re.exec(L);if(!m)continue;if(excl&&excl.test(L.slice(Math.max(0,m.index-14),m.index+m[0].length+2)))continue;
  var rest=L.slice(m.index+m[0].length).replace(/^[\s:：.\-|\/=،]+/,'');var v=rest?val(rest):null;if(v!=null)return v;var pre=L.slice(0,m.index).replace(/[\s:：.\-|\/=،]+$/,'');if(pre&&!/[A-Z]{3,}\s*[:：]/.test(pre)){v=val(pre);if(v!=null)return v;}
  for(var k=1;k<=2&&i+k<lines.length;k++){var nx=lines[i+k];if(!nx.replace(/[\s|:]/g,''))continue;v=val(nx);if(v!=null)return v;break;}}}return null;}
function arFix(raw){var s=String(raw||'');try{s=s.normalize('NFKC');}catch(e){}var fw=(s.match(/(^|[\s:])ال[؀-ۿ]/g)||[]).length,bw=(s.match(/[؀-ۿ]لا($|[\s:])/g)||[]).length;if(bw>fw)s=s.replace(/[؀-ۿ]+(?:[ ][؀-ۿ]+)*/g,function(r){return r.split('').reverse().join('');});return s;}
function parse(raw){raw=arFix(raw);
 var lines=String(raw||'').split(/\n/).map(function(l){return l.replace(/[ \t ]+/g,' ').trim();}).filter(Boolean);var U_=lines.map(function(l){return l.toUpperCase();});
 var t=String(raw||'').toUpperCase();var one=t.replace(/[؀-ۿ]+/g,' ').replace(/\s+/g,' ');var o={},src={};
 var nm=grab(U_,[/FULL\s*N.?[MV]E\b/,/NAME\s+OF\s+(?:THE\s+)?(?:APPLICANT|CANDIDATE|WORKER|MAID|EMPLOYEE)/,/(?:APPLICANT|CANDIDATE|WORKER|EMPLOYEE)'?S?\s+NAME/,/\bNAME\s+IN\s+FULL\b/],vName)||
  grab(U_,[/(?:^|[^A-Z])NAME\b/],vName,/(FATHER|MOTHER|SPOUSE|HUSBAND|AGENCY|AGENT|COMPANY|EMPLOYER|CONTACT|RELATIVE|SPONSOR|REFEREE|SCHOOL|SUR|GIVEN|FIRST|LAST|MIDDLE|OFFICE|PERSON)\W{0,3}N?A?M?E?/)||
  grab(lines,[/الاسم(?:\s*الكامل)?|اسم\s*العامل[ةه]/],vName)||grab(lines,[/الاسم(?:\s*الكامل)?|اسم\s*العامل[ةه]/],vNameAr);
 if(!nm){var gv=grab(U_,[/GIVEN\s*NAMES?|FIRST\s*NAME/],vWord),sn=grab(U_,[/SURNAME|LAST\s*NAME|FAMILY\s*NAME/],vWord);if(gv&&sn)nm=gv+' '+sn;else if(gv&&gv.split(' ').length>=2)nm=gv;}
 if(nm){o.n=nm;src.n='label';}
 var mz=/P[A-Z<]([A-Z]{3})([A-Z]+(?:<[A-Z]+)*)<<([A-Z]+(?:<[A-Z]+)*)/.exec(one.replace(/ /g,''));
 if(mz){if(!o.n){o.n=(mz[3].replace(/</g,' ')+' '+mz[2].replace(/</g,' ')).replace(/\s+/g,' ').trim();src.n='MRZ';}if(NAT[mz[1]])o.co=NAT[mz[1]];}
 o.pp=grab(U_,[/PASSPORT\s*(?:NO|NUMBER|N[O0]\.|#)?/,/\bP\.?\s?P?\.?\s?NO\b/,/PASS\s*NO/],vPP)||grab(lines,[/رقم\s*(?:ال)?جواز|جواز\s*السفر/],vPP)||(function(){var m=/\b([A-Z]{1,2}\d{7}[A-Z]?)\b/.exec(one);return m?m[1]:null;})()||undefined;
 if(!o.co)o.co=grab(U_,[/NATIONALITY/,/CITIZENSHIP/,/\bCOUNTRY\b(?!\s*OF\s*(?:WORK|EXP|EMPLOY))/],vNat)||grab(lines,[/الجنسي[ةه]/],vNat)||undefined;
 if(!o.co){for(var k2 in NAT){if(k2.length>4&&new RegExp('\\b'+k2+'\\b').test(one)){o.co=NAT[k2];break;}}}
 if(!o.co){var a=arn(raw);for(var q=0;q<ARN.length;q++)if(ARN[q][0].test(a)&&q!==6){o.co=ARN[q][1];break;}}
 o.sal=grab(U_,[/SALARY/,/\bWAGES?\b/,/MONTHLY\s*PAY/],vSal)||grab(lines,[/الراتب|المرتب|الأجر/],vSal)||(function(){var m=/(\d{3,4})\s*(?:SAR|S\.?R\b|RIYALS?|SR\b|5AR)|(?:SAR|S\.R\.?|SR)\s*(\d{3,4})/.exec(one);return m?+(m[1]||m[2]):null;})()||undefined;
 var dob=grab(U_,[/DATE\s*OF\s*BIRTH/,/\bD\.?\s?O\.?\s?B\b/,/BIRTH\s*DATE|BIRTHDATE|BIRTHDAY/,/\bBORN\b/],vDate)||grab(lines,[/تاريخ\s*الميلاد|الميلاد/],vDate);
 if(!dob){var mz2=/(?:ETH|KEN|PHL|UGA|IDN|LKA|BGD|IND|PAK|BDI)(\d{2})([01]\d)([0-3]\d)\d/.exec(one.replace(/ /g,''));if(mz2){var d2=new Date(yr(mz2[1]),+mz2[2]-1,+mz2[3]);if(okAge(d2))dob=d2;}}
 if(dob){o.dob=dob;var n=new Date(),ag=n.getFullYear()-dob.getFullYear();if(n<new Date(n.getFullYear(),dob.getMonth(),dob.getDate()))ag--;o.age=ag;}
 if(!o.age){var av=grab(U_,[/\bAGE\b/],vAge)||grab(lines,[/العمر|السن/],vAge);if(av)o.age=av;}
 if(!o.dob&&!o.age){var re=/\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{2,4})\b/g,qq;while((qq=re.exec(one))){var d3=new Date(yr(qq[3]),MON[qq[2]],+qq[1]);if(okAge(d3)){var n3=new Date();o.age=n3.getFullYear()-d3.getFullYear();break;}}}
 var ar=arn(raw);
 if(/NON[\s\-]*MUSL?IM/.test(one))o.rel='غير مسلمة';else if(/\bMUSLIM\b|\bISLAM/.test(one)||/مسلم|الاسلام/.test(ar))o.rel='مسلمة';else if(/CHRISTIAN|CATHOLIC|PROTESTANT|ORTHODOX/.test(one)||/مسيح/.test(ar))o.rel='مسيحية';
 if(/\bMARRIED\b/.test(one)||/متزوج/.test(ar))o.ms='متزوجة';else if(/\bSINGLE\b/.test(one)||/عزباء|عزب/.test(ar))o.ms='عزباء';else if(/DIVORCED/.test(one)||/مطلق/.test(ar))o.ms='مطلقة';else if(/WIDOW/.test(one)||/ارمل/.test(ar))o.ms='أرملة';
 var lg=[];if(/ARABIC/.test(one)||/العربي/.test(ar))lg.push('عربي');if(/ENGLISH/.test(one)||/الانجليزي/.test(ar))lg.push('إنجليزي');if(lg.length)o.lg=lg.join(' · ');
 var sk=[];if(/CLEAN|DUST|HOUSE\s*KEEP|MOPP|SWEEP/.test(one)||/تنظيف/.test(ar))sk.push('تنظيف');if(/WASH|IRON|LAUNDRY/.test(one)||/غسيل|كي/.test(ar))sk.push('غسيل وكي');if(/COOK/.test(one)||/طبخ/.test(ar))sk.push('طبخ');if(/BABY|CHILD|KIDS|INFANT|NANNY/.test(one)||/اطفال/.test(ar))sk.push('رعاية أطفال');if(/ELDER|OLD\s*AGE|AGED|SENIOR|PATIENT/.test(one)||/كبار|مسن/.test(ar))sk.push('رعاية كبار');if(sk.length)o.sk=sk.join(' · ');
 if(/FIRST\s*TIME|FIRST\s*TIMER|NO\s*EXPERIENCE|NEW\s*COMER|\bFRESH(?:ER)?\b|EXPERIENCE\s*ABROAD\W{0,4}NO\b|EX\.?\s*ABROAD\W{0,30}\bFT\b|\bFT\W{0,6}EX\.?\s*ABROAD/.test(one)||/اول\s*مر[هة]|بدون\s*خبر|لم\s*يسبق/.test(ar))o.ex=0;
 else{var me=/(?:EXP\w*ENCE|WORKED|EX-?ABROAD)[^0-9]{0,60}(\d{1,2})\s*(?:YEARS?|YRS?)/.exec(one)||/(\d{1,2})\s*(?:YEARS?|YRS?)\s*(?:IN|AT|-)?\s*(?:SAUDI|KSA|UAE|KUWAIT|QATAR|OMAN|BAHRAIN|JORDAN|LEBANON|DUBAI|ABU|RIYADH|JEDDAH|HONG|SINGAPORE|MALAYSIA)/.exec(one);if(me&&+me[1]<30)o.ex=+me[1];}
 o._src=src;return o;}
function looksGarbage(txt){txt=arFix(txt);var s=String(txt||'').replace(/\s/g,'');if(s.length<60)return true;var good=(s.match(/[A-Za-z0-9؀-ۿ]/g)||[]).length;if(good/s.length<.6)return true;return !/NAME|PASSPORT|NATIONALITY|SALARY|BIRTH|\bAGE\b|الاسم|الجنسي|الجواز|الراتب/i.test(txt);}

function fileBuf(f){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result);};r.onerror=no;r.readAsArrayBuffer(f);});}
function c2url(cv,q){return cv.toDataURL('image/jpeg',q||.85);}
function imgToCanvas(img){var w=img.width,h=img.height,cv=document.createElement('canvas');cv.width=w;cv.height=h;var x=cv.getContext('2d');
 if(img.bitmap){x.drawImage(img.bitmap,0,0);return cv;}
 var d=img.data,id=x.createImageData(w,h),n=w*h;
 if(d.length===n*4)id.data.set(d);else if(d.length===n*3){for(var i=0,j=0;i<n;i++){id.data[j++]=d[i*3];id.data[j++]=d[i*3+1];id.data[j++]=d[i*3+2];id.data[j++]=255;}}else if(d.length===n){for(var i2=0,j2=0;i2<n;i2++){id.data[j2++]=d[i2];id.data[j2++]=d[i2];id.data[j2++]=d[i2];id.data[j2++]=255;}}else return null;
 x.putImageData(id,0,0);return cv;}
function mul(m,n){return [m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];}
function pageImages(L,page,pw){return page.getOperatorList().then(function(ops){var O=L.OPS,ctm=[1,0,0,1,0,0],st=[],list=[];for(var i=0;i<ops.fnArray.length;i++){var f=ops.fnArray[i],a=ops.argsArray[i];
 if(f===O.save)st.push(ctm.slice());else if(f===O.restore)ctm=st.pop()||[1,0,0,1,0,0];else if(f===O.transform)ctm=mul(ctm,a);
 else if(f===O.paintImageXObject||f===O.paintJpegXObject){var dw=Math.hypot(ctm[0],ctm[1]);if(!pw||dw<pw*.6)list.push(a[0]);}}
 return Promise.all(list.map(function(nm){return new Promise(function(ok){var done=false;function got(im){if(done)return;done=true;try{ok(im?imgToCanvas(im):null);}catch(e){ok(null);}}try{if(page.objs.has&&page.objs.has(nm))got(page.objs.get(nm));else page.objs.get(nm,got);}catch(e){try{page.commonObjs.get(nm,got);}catch(e2){ok(null);}}setTimeout(function(){got(null);},4000);});}));}).catch(function(){return [];});}
function render(page,scale){var vp=page.getViewport({scale:scale});var cv=document.createElement('canvas');cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);return page.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise.then(function(){return cv;});}
function up(cv,mode){var k=Math.min(3.2,Math.max(1,2400/cv.width));var c=document.createElement('canvas');c.width=Math.round(cv.width*k);c.height=Math.round(cv.height*k);var x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(cv,0,0,c.width,c.height);
 if(mode===0)return c;try{var W=c.width,H=c.height,d=x.getImageData(0,0,W,H),a=d.data,i,L;for(i=0;i<a.length;i+=4){var r=a[i],g=a[i+1],bb=a[i+2],mx=Math.max(r,g,bb),mn=Math.min(r,g,bb);L=.299*r+.587*g+.114*bb;var v=(L<140||(mx-mn>90&&L<170))?0:255;a[i]=a[i+1]=a[i+2]=v;}
 var lh=Math.round(W*.06),lv=Math.round(H*.03),y,xx,run,q,o;for(y=0;y<H;y++){run=0;for(xx=0;xx<=W;xx++){if(xx<W&&a[(y*W+xx)*4]===0)run++;else{if(run>lh)for(q=xx-run;q<xx;q++){o=(y*W+q)*4;a[o]=a[o+1]=a[o+2]=255;}run=0;}}}
 for(xx=0;xx<W;xx++){run=0;for(y=0;y<=H;y++){if(y<H&&a[(y*W+xx)*4]===0)run++;else{if(run>lv)for(q=y-run;q<y;q++){o=(q*W+xx)*4;a[o]=a[o+1]=a[o+2]=255;}run=0;}}}
 x.putImageData(d,0,0);}catch(e){}return c;}
var OW=null,OP=null;function wk(){if(!OW)OW=load(TESS).then(function(){return window.Tesseract.createWorker('eng',1,{logger:function(m){if(OP&&m.status==='recognizing text')OP(Math.round(m.progress*100));}});});return OW;}
function rec(w,cv,psm){return w.setParameters({tessedit_pageseg_mode:psm}).then(function(){return w.recognize(cv);}).then(function(r){return r.data.text;});}
function full(q){return q.n&&q.co&&q.pp&&q.sal&&q.age;}
function ocr(cv,prog){OP=prog;return wk().then(function(w){return rec(w,up(cv,0),'3').then(function(t){if(full(parse(t)))return t;var c1=up(cv,1);return rec(w,c1,'3').then(function(t2){var all=t+'\n'+t2,q=parse(all);if(q.n&&q.co)return all;return rec(w,c1,'11').then(function(t3){return all+'\n'+t3;});});});});}
function ocrTop(cv){var h=Math.round(cv.height*.2),c=document.createElement('canvas');c.width=cv.width;c.height=h;c.getContext('2d').drawImage(cv,0,0,cv.width,h,0,0,cv.width,h);OP=null;return wk().then(function(w){return rec(w,up(c,0),'3');}).catch(function(){return '';});}
function pickPhoto(cands,pw,ph){var best=null,ba=0;cands.forEach(function(cv){if(!cv)return;var w=cv.width,h=cv.height,a=w*h;if(w<60||h<60)return;var ratio=h/w;if(ratio<1.05||ratio>1.9)return;if(a>ba){ba=a;best=cv;}});return best;}
function extract(file,prog,lite){
 var isPdf=/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name);
 if(!isPdf){return new Promise(function(ok,no){var im=new Image();im.onload=function(){var cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv.getContext('2d').drawImage(im,0,0);ok(cv);};im.onerror=no;im.src=URL.createObjectURL(file);}).then(function(cv){prog('🔎 قراءة الصورة (OCR)…');return ocr(cv,function(p){prog('🔎 قراءة الصورة (OCR) '+p+'%');}).then(function(txt){return {text:txt,pages:[cv],photo:detectPhoto(cv),ocr:1};});});}
 return fileBuf(file).then(function(buf){return pdfjs().then(function(L){return L.getDocument({data:buf}).promise.then(function(doc){var n=Math.min(doc.numPages,lite?2:3),texts=[],pages=[],imgs=[],pw=0;var chain=Promise.resolve();
  for(var p=1;p<=n;p++)(function(p){chain=chain.then(function(){return doc.getPage(p).then(function(pg){var vp=pg.getViewport({scale:1});return pg.getTextContent().then(function(tc){var items=tc.items.slice().sort(function(a,b){return (b.transform[5]-a.transform[5])||(a.transform[4]-b.transform[4]);});var line='',last=null,out=[];var le=null;items.forEach(function(it){var y=Math.round(it.transform[5]),hh=Math.abs(it.transform[3])||10,x0=it.transform[4];if(last!==null&&Math.abs(y-last)>Math.max(3,hh*.45)){out.push(line);line='';le=null;}var tight=le!==null&&x0-le<hh*.2&&x0-le>-hh*.5&&/[A-Za-z0-9]$/.test(line)&&/^[A-Za-z0-9]/.test(it.str);line=tight?line+it.str:(line?line+' ':'')+it.str;le=x0+(it.width||0);last=y;});out.push(line);texts.push(out.join('\n'));return render(pg,lite?1.3:1.6);}).then(function(cv){pages.push(cv);return pageImages(L,pg,vp.width).then(function(a){imgs=imgs.concat(a);});});});});})(p);
  return chain.then(function(){try{doc.destroy();}catch(e){}var txt=texts.join('\n');var photo=null;var cands=imgs.filter(function(c){return c;});
   photo=pickPhoto(cands,0,0);
   if(looksGarbage(txt)){prog('🔎 الملف صورة ممسوحة · قراءة النص (OCR)…');return ocr(pages[0],function(pp){prog('🔎 قراءة النص (OCR) '+pp+'%');}).then(function(t1){var q=parse(t1);if((q.n&&q.co)||pages.length<2)return t1;return ocr(pages[1],function(){}).then(function(t2){return t1+'\n'+t2;});}).then(function(t2){var ph2=photo;for(var z=0;!ph2&&z<pages.length;z++)ph2=detectPhoto(pages[z]);return {text:t2,pages:pages,photo:ph2,ocr:1,nimg:cands.length};});}
   return {text:txt,pages:pages,photo:photo,ocr:0,nimg:cands.length};});});});});
}
function detectPhoto(src){try{var W=480,k=src.width/W,H=Math.round(src.height/k);var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.drawImage(src,0,0,W,H);var d=x.getImageData(0,0,W,H).data;
 var S=8,gw=Math.floor(W/S),gh=Math.floor(H/S),g=new Uint8Array(gw*gh);
 for(var gy=0;gy<gh;gy++)for(var gx=0;gx<gw;gx++){var n=0;for(var yy=0;yy<S;yy++)for(var xx=0;xx<S;xx++){var p=((gy*S+yy)*W+gx*S+xx)*4,r=d[p],G=d[p+1],b=d[p+2],mx=Math.max(r,G,b),mn=Math.min(r,G,b);if(mx<228||(mx-mn)>28)n++;}g[gy*gw+gx]=n>=S*S*.8?1:0;}
 var seen=new Uint8Array(gw*gh),best=null,bs=0;
 for(var i=0;i<g.length;i++){if(!g[i]||seen[i])continue;var q=[i],x0=1e9,y0=1e9,x1=-1,y1=-1,cnt=0;seen[i]=1;while(q.length){var j=q.pop(),cx=j%gw,cy=(j-cx)/gw;cnt++;if(cx<x0)x0=cx;if(cx>x1)x1=cx;if(cy<y0)y0=cy;if(cy>y1)y1=cy;[j-1,j+1,j-gw,j+gw].forEach(function(t){if(t<0||t>=g.length||seen[t]||!g[t])return;if(Math.abs((t%gw)-cx)>1)return;seen[t]=1;q.push(t);});}
  var bw=x1-x0+1,bh=y1-y0+1,a=bh/bw,fill=cnt/(bw*bh);if(bw<6||bh<7||a<1.02||a>2.8||fill<.3)continue;if(bw*bh>gw*gh*.5)continue;var sc=cnt*Math.exp(-Math.pow((a-1.3)/.6,2));if(sc>bs){bs=sc;best=[x0,y0,bw,bh];}}
 if(!best)return null;var X=best[0]*S*k,Y=best[1]*S*k,BW=best[2]*S*k,BH=best[3]*S*k,o=document.createElement('canvas');o.width=Math.round(BW);o.height=Math.round(BH);o.getContext('2d').drawImage(src,X,Y,BW,BH,0,0,BW,BH);return o;}catch(e){return null;}}
var COS=['الفلبين','إندونيسيا','كينيا','أوغندا','بنغلاديش','سريلانكا','إثيوبيا','الهند','باكستان','بوروندي'];
var EN={'الفلبين':'PHILIPPINES','إندونيسيا':'INDONESIA','كينيا':'KENYA','أوغندا':'UGANDA','بنغلاديش':'BANGLADESH','سريلانكا':'SRI LANKA','إثيوبيا':'ETHIOPIA','الهند':'INDIA','باكستان':'PAKISTAN','بوروندي':'BURUNDI'};
function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return h;}
function silhouette(seed,w,h){var cv=document.createElement('canvas');cv.width=w;cv.height=h;var x=cv.getContext('2d'),H=hue(seed||'x');
 var g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'hsl('+H+',45%,88%)');g.addColorStop(1,'hsl('+H+',40%,74%)');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle='hsl('+H+',30%,38%)';x.beginPath();x.arc(w/2,h*.4,w*.21,0,7);x.fill();x.beginPath();x.ellipse(w/2,h*1.02,w*.44,h*.38,0,0,7);x.fill();
 x.fillStyle='hsl('+H+',28%,30%)';x.beginPath();x.ellipse(w/2,h*.3,w*.25,h*.13,0,Math.PI,0);x.fill();return cv;}
function rr(x,X,Y,W,H,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath();}
/* default CV image for candidates with no uploaded file */
function drawCV(c,cu){var W=1240,H=1754,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#0B1F3A';x.fillRect(0,0,W,190);x.fillStyle='#E9B949';x.fillRect(0,190,W,8);
 x.fillStyle='#fff';x.font='700 52px Tajawal, Arial';x.textAlign='left';x.direction='ltr';x.fillText(cu?'شركة أصايل المنصورة للاستقدام':(c.ag||'AGENCY')+'',60,95);
 x.font='400 30px Arial';x.fillStyle='#BFD3F2';x.fillText('APPLICATION FOR EMPLOYMENT · سيرة ذاتية',60,148);
 var ph=c.phI||c.phC||(c.phC=silhouette(c.n,330,410));x.save();rr(x,W-400,250,330,410,18);x.clip();var iw=ph.naturalWidth||ph.width,ih=ph.naturalHeight||ph.height,sc=Math.max(330/iw,410/ih);x.drawImage(ph,W-400+(330-iw*sc)/2,250,iw*sc,ih*sc);x.restore();x.strokeStyle='#0B1F3A';x.lineWidth=4;rr(x,W-400,250,330,410,18);x.stroke();
 x.fillStyle='#0B1F3A';x.textAlign='right';x.direction='rtl';x.font='700 64px Tajawal, Arial';x.fillText(c.n,W-460,330);
 x.font='400 34px Tajawal, Arial';x.fillStyle='#4A5B73';x.fillText((c.co||'')+' · '+(c.age||'—')+' سنة',W-460,390);
 var rows=[['الدولة','NATIONALITY',c.co+'  '+(EN[c.co]||'')],['العمر','AGE',(c.age||'—')+''],['الخبرة','EXPERIENCE',c.ex?c.ex+' سنوات':'أول مرة · FIRST TIME'],['اللغات','LANGUAGES',c.lg||'—'],['المهارات','SKILLS',c.sk||'—'],['الديانة','RELIGION',c.rel||'—'],['الحالة الاجتماعية','MARITAL STATUS',c.ms||'—'],['الراتب الشهري','MONTHLY SALARY',(c.sal||'—')+' SAR'],['الوكيل','AGENT',c.ag||'—']];if(cu)rows.pop();
 var y=720;rows.forEach(function(r,k){x.fillStyle=k%2?'#fff':'#F2F6FC';x.fillRect(60,y,W-120,92);x.strokeStyle='#DCE4F0';x.lineWidth=2;x.strokeRect(60,y,W-120,92);
  x.textAlign='right';x.direction='rtl';x.fillStyle='#0B1F3A';x.font='700 32px Tajawal, Arial';x.fillText(r[0],W-90,y+58);
  x.textAlign='left';x.direction='ltr';x.fillStyle='#8592A6';x.font='400 22px Arial';x.fillText(r[1],90,y+40);
  x.textAlign='center';x.direction='rtl';x.fillStyle='#1F2D44';x.font='500 32px Tajawal, Arial';x.fillText(r[2],W/2-40,y+58);y+=92;});
 x.textAlign='center';x.direction='rtl';x.fillStyle='#8592A6';x.font='400 26px Tajawal, Arial';x.fillText(cu?'شركة أصايل المنصورة للاستقدام · نجران':'سيرة ذاتية نموذجية للعرض التجريبي · شركة أصايل المنصورة · نجران',W/2,H-70);
 return cv;}
function po(cv,q){return {u:c2url(cv,q||.82),w:cv.width,h:cv.height};}
function pagesOf(c,cu){if(cu)return c.cvCu||(c.cvCu=[po(drawCV(c,1),.85)]);if(c.cvPages&&c.cvPages.length)return c.cvPages;return c.cvDef||(c.cvDef=[po(drawCV(c),.85)]);}
function phImg(c){if(c.ph&&!c.phI){var im=new Image();im.onload=function(){c.phI=im;c.cvCu=null;};im.src=c.ph;}}
function thumbOf(c){return pagesOf(c)[0].u;}
function cand(i){return U().CANDS[i];}
function avHtml(c,i,lg,cu){phImg(c);var U_=U();var inner=c.ph?'<div class="xav xph'+(lg?' lg':'')+'" role="img" aria-label="صورة '+esc(c.n)+'" style="background-image:url('+c.ph+')"></div>':'<div class="xav'+(lg?' lg':'')+'" aria-hidden="true">'+esc((c.n||'?').charAt(0))+'</div>';
 if(lg)return inner;return '<div class="xavw">'+inner+'<button type="button" class="xcvb" data-act="cvopen" data-i="'+i+'"'+(cu?' data-cu="1"':'')+'>📄 السيرة الذاتية</button></div>';}
window.XP_AV=function(c,i,lg,cu){try{return avHtml(c,i,lg,cu);}catch(e){return '<div class="xav" aria-hidden="true">'+esc((c.n||'?').charAt(0))+'</div>';}};
window.XP_CVB=function(i){var c=cand(i);var src='';try{src=thumbOf(c);}catch(e){}
 return '<div class="xcvbox"><div class="xcvbh"><b>📄 السيرة الذاتية</b>'+(c.cvName?'<span class="mut sm">'+esc(c.cvName)+'</span>':'<span class="mut sm">نموذجية</span>')+'</div>'+
 '<button type="button" class="xcvth" data-act="cvopen" data-i="'+i+'" aria-label="عرض السيرة بملء الشاشة"><img alt="" src="'+src+'"><span>⛶ اضغط للتكبير</span></button>'+
 '<div class="xcvbr"><button type="button" class="xbt sm" data-act="cvopen" data-i="'+i+'">⛶ ملء الشاشة</button><button type="button" class="xbt sm ghost" data-act="cvsave" data-i="'+i+'">⬇ حفظ السيرة</button></div></div>';};
/* fullscreen viewer */
var VZ=1;
function viewer(i,cu){var c=cand(i);if(!c)return;var pages=pagesOf(c,cu);var ov=document.getElementById('xcvv');if(!ov){ov=document.createElement('div');ov.id='xcvv';document.body.appendChild(ov);
 ov.addEventListener('click',function(e){var sv=e.target.closest('[data-act=cvsave]');if(sv){e.preventDefault();e.stopPropagation();saveCV(+sv.dataset.i,sv.dataset.cu==='1');return;}var b=e.target.closest('[data-vz]');if(b){var k=b.dataset.vz;VZ=k==='fit'?1:Math.max(.5,Math.min(4,VZ+(+k)));apply();return;}if(e.target.closest('[data-vx]')||e.target===ov)closeV();});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('show'))closeV();});}
 VZ=1;ov.innerHTML='<div class="xcvvt"><b>السيرة الذاتية · '+esc(c.n)+'</b><span class="xcvvs"></span><button type="button" data-vz="-0.25" aria-label="تصغير">−</button><button type="button" data-vz="fit">ملاءمة</button><button type="button" data-vz="0.25" aria-label="تكبير">+</button><button type="button" class="xcvvd" data-act="cvsave" data-i="'+i+'"'+(cu?' data-cu="1"':'')+'>⬇ حفظ</button><button type="button" data-vx aria-label="إغلاق">✕</button></div><div class="xcvvb" role="dialog" aria-label="السيرة الذاتية"></div>';
 var b=ov.querySelector('.xcvvb');pages.forEach(function(p){var im=new Image();im.alt='صفحة من السيرة الذاتية';im.src=p.u;b.appendChild(im);});
 ov.classList.add('show');document.documentElement.classList.add('xcvopen');try{if(window.innerWidth<800&&ov.requestFullscreen)ov.requestFullscreen().catch(function(){});}catch(e){}
 function apply(){ov.querySelectorAll('.xcvvb img').forEach(function(im){im.style.width=(VZ*100)+'%';});ov.querySelector('.xcvvs').textContent=Math.round(VZ*100)+'%';}apply();}
function closeV(){var ov=document.getElementById('xcvv');if(ov)ov.classList.remove('show');document.documentElement.classList.remove('xcvopen');try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}}
function dl(url,name){var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},100);}
function saveCV(i,cu){var c=cand(i);if(!c)return;var nm='CV-'+(cu?'Asayel-':'')+(c.n||'worker').replace(/[^\w؀-ۿ]+/g,'-');
 if(!cu&&c.cvBlob){dl(URL.createObjectURL(c.cvBlob),c.cvName||nm+'.pdf');return;}
 load(JSPDF).then(function(){var J=window.jspdf.jsPDF,d=new J({unit:'pt',format:'a4'});pagesOf(c,cu).forEach(function(p,k){if(k)d.addPage();var w=595.28,h=w*p.h/p.w;d.addImage(p.u,'JPEG',0,0,w,Math.min(h,841.89));});d.save(nm+'.pdf');}).catch(function(){dl(pagesOf(c,cu)[0].u,nm+'.jpg');});}
/* sample CV PDF (fictional) */
function samplePdf(){return load(JSPDF).then(function(){var J=window.jspdf.jsPDF,d=new J({unit:'pt',format:'a4'});var W=595.28;
 d.setFillColor(11,31,58);d.rect(0,0,W,86,'F');d.setTextColor(255,255,255);d.setFont('helvetica','bold');d.setFontSize(22);d.text('SAMPLE MANPOWER AGENCY',36,44);d.setFont('helvetica','normal');d.setFontSize(11);d.text('APPLICATION FOR EMPLOYMENT  -  DEMO CV (FICTIONAL DATA)',36,66);
 var ph=silhouette('AMINA',300,370);d.addImage(c2url(ph,.9),'JPEG',W-36-120,104,120,148);
 d.setTextColor(11,31,58);d.setFont('helvetica','bold');d.setFontSize(13);d.text('POSITION APPLIED FOR: HOUSEMAID',36,124);
 var rows=[['FULL NAME','AMINA HASSAN ALI'],['PASSPORT NO','EP1234567'],['NATIONALITY','ETHIOPIAN'],['DATE OF BIRTH','14 MAR 1999'],['RELIGION','MUSLIM'],['MARITAL STATUS','SINGLE'],['NUMBER OF CHILDREN','0'],['MONTHLY SALARY','1000 SAR'],['CONTRACT PERIOD','2 YEARS'],['ARABIC','FAIR'],['ENGLISH','POOR'],['EXPERIENCE','FIRST TIME'],['SKILLS','CLEANING, WASHING, IRONING, COOKING, BABY SITTING']];
 var y=150;d.setFontSize(10.5);rows.forEach(function(r,k){if(k%2){d.setFillColor(242,246,252);d.rect(36,y-13,W-72-140,20,'F');}d.setFont('helvetica','bold');d.setTextColor(60,72,92);d.text(r[0],42,y);d.setFont('helvetica','normal');d.setTextColor(20,30,48);d.text(r[1],180,y);y+=20;});
 d.setFont('courier','bold');d.setFontSize(12);d.setTextColor(20,30,48);d.text('P<ETHALI<<AMINA<HASSAN<<<<<<<<<<<<<<<<<<<<<<',36,y+40);d.text('EP12345670ETH9903142F3201015<<<<<<<<<<<<<<04',36,y+58);
 d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(130,140,160);d.text('This is a fictional sample CV generated for the Asayel demo. All data is invented.',36,800);
 var blob=d.output('blob');return new File([blob],'sample-cv-amina.pdf',{type:'application/pdf'});});}
/* add-from-CV drawer */
var CUR=null;
function fld(id,lab,val,auto,type,opts){var v=val==null?'':val;var inp=opts?'<select id="'+id+'">'+opts.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>':'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(v)+'"'+(type==='number'?' inputmode="numeric"':'')+'>';
 return '<label class="zf'+(auto?' zauto':'')+'"><span>'+esc(lab)+(auto?' <i>تلقائي ✓</i>':'')+'</span>'+inp+'</label>';}
function title(s){return String(s||'').toLowerCase().replace(/\b[a-z]/g,function(m){return m.toUpperCase();});}
function openAdd(){CUR=null;U().drawer('إضافة عاملة من السيرة الذاتية','<div class="zadd"><p class="mut">ارفع ملف السيرة الذاتية (PDF أو صورة) وسيقرأ النظام الاسم ورقم الجواز والجنسية والعمر واللغات والمهارات والراتب، ويأخذ الصورة الشخصية تلقائيًا. راجع البيانات قبل الحفظ.</p>'+
 '<label class="zdrop" for="zfile"><input id="zfile" type="file" accept="application/pdf,image/*"><b>⬆ اختر ملف السيرة الذاتية</b><span class="mut sm">PDF · JPG · PNG — يبقى الملف على جهازك ولا يُرفع لأي خدمة خارجية</span></label>'+
 '<button type="button" class="xbt ghost" data-act="cvsample">✨ جرّب بالسيرة النموذجية</button><p class="zst mut sm" role="status" aria-live="polite"></p><div class="zres"></div></div>');}
function st(t){var e=document.querySelector('#xdr .zst');if(e)e.textContent=t;}
function run(file){st('⏳ جارٍ قراءة السيرة الذاتية…');var res=document.querySelector('#xdr .zres');if(res)res.innerHTML='';
 extract(file,st).then(function(r){var o=parse(r.text);var photo=r.photo?c2url(r.photo,.88):'';CUR={file:file,pages:r.pages,o:o,photo:photo,ocr:r.ocr,text:r.text,ag:agencyOf(r.text,o.n)};st((r.ocr?'✓ تمت القراءة بالتعرف الضوئي (OCR) · ':'✓ تمت قراءة النص من الملف · ')+(photo?'وأُخذت الصورة تلقائيًا':'لم تُكتشف صورة — حدّدها بالسحب على السيرة'));form();})
 .catch(function(e){st('⚠ تعذّرت قراءة الملف ('+(e&&e.message||e)+'). أدخل البيانات يدويًا.');CUR={file:file,pages:[],o:{_src:{}},photo:''};form();});}
function form(){var res=document.querySelector('#xdr .zres');if(!res||!CUR)return;var o=CUR.o,a=function(k){return o[k]!=null&&o[k]!=='';};var ags=[];U().CANDS.forEach(function(c){if(c.ag&&ags.indexOf(c.ag)<0)ags.push(c.ag);});
 var co=o.co||'';var cos=COS.slice();if(co&&cos.indexOf(co)<0)cos.unshift(co);if(!co)cos.unshift('— اختر —');
 res.innerHTML='<div class="zgrid"><div class="zph"><div class="zphi"'+(CUR.photo?' style="background-image:url('+CUR.photo+')"':'')+'>'+(CUR.photo?'':'<span>لا صورة</span>')+'</div>'+(CUR.photo?'<i class="zok">الصورة تلقائية ✓</i>':'')+'<button type="button" class="xbt sm ghost" data-act="cvcrop">✂ '+(CUR.photo?'تغيير الصورة':'تحديد الصورة')+'</button></div>'+
 '<div class="zpg">'+(CUR.pages[0]?'<img alt="معاينة السيرة" src="'+(CUR.pages[0].__url||(CUR.pages[0].__url=c2url(CUR.pages[0],.85)))+'">':'')+'</div></div><div class="zcrop" hidden></div>'+
 '<div class="zfs">'+fld('zn','اسم العاملة',a('n')?title(o.n):'',a('n'))+fld('zpp','رقم الجواز',o.pp||'',a('pp'))+fld('zco','الجنسية',co||'— اختر —',a('co'),'',cos)+fld('zage','العمر',o.age||'',a('age'),'number')+
 fld('zex','الخبرة (سنوات · 0 = أول مرة)',o.ex!=null?o.ex:'',o.ex!=null,'number')+fld('zlg','اللغات',o.lg||'',a('lg'))+fld('zsk','المهارات',o.sk||'',a('sk'))+fld('zsal','الراتب الشهري (ر.س)',o.sal||'',a('sal'),'number')+fld('zrel','الديانة',o.rel||'',a('rel'))+
 '<label class="zf"><span>الوكيل</span><input id="zag" list="zags" dir="auto" value="'+esc(CUR.ag||ags[0]||'')+'"><datalist id="zags">'+ags.map(function(g){return '<option value="'+esc(g)+'">';}).join('')+'</datalist></label></div>'+
 '<p class="mut sm">🔒 رقم الجواز يظهر للإدارة فقط ولا يظهر للعميل في السير الذاتية.</p><div class="xrow"><button type="button" class="xbt" data-act="cvsave2">✓ حفظ العاملة وإظهار سيرتها</button><button type="button" class="xbt ghost" data-close>إلغاء</button></div>';}
function crop(){var box=document.querySelector('#xdr .zcrop');if(!box||!CUR||!CUR.pages[0])return;var pg=CUR.pages[0];box.hidden=false;box.innerHTML='<p class="sm"><b>اسحب مستطيلًا حول صورة العاملة</b> ثم ارفع إصبعك</p><div class="zcw"><img alt="" src="'+(pg.__url||c2url(pg,.85))+'"><div class="zrect" hidden></div></div>';
 var w=box.querySelector('.zcw'),im=w.querySelector('img'),r=w.querySelector('.zrect'),s=null;
 function pt(e){var b=im.getBoundingClientRect();return {x:Math.max(0,Math.min(b.width,e.clientX-b.left)),y:Math.max(0,Math.min(b.height,e.clientY-b.top)),W:b.width,H:b.height};}
 w.addEventListener('pointerdown',function(e){e.preventDefault();s=pt(e);w.setPointerCapture(e.pointerId);r.hidden=false;r.style.cssText='left:'+s.x+'px;top:'+s.y+'px;width:0;height:0';});
 w.addEventListener('pointermove',function(e){if(!s)return;var p=pt(e);r.style.left=Math.min(s.x,p.x)+'px';r.style.top=Math.min(s.y,p.y)+'px';r.style.width=Math.abs(p.x-s.x)+'px';r.style.height=Math.abs(p.y-s.y)+'px';});
 w.addEventListener('pointerup',function(e){if(!s)return;var p=pt(e),k=pg.width/p.W,x0=Math.min(s.x,p.x)*k,y0=Math.min(s.y,p.y)*k,ww=Math.abs(p.x-s.x)*k,hh=Math.abs(p.y-s.y)*k;s=null;if(ww<20||hh<20)return;
  var cv=document.createElement('canvas');cv.width=Math.round(ww);cv.height=Math.round(hh);cv.getContext('2d').drawImage(pg,x0,y0,ww,hh,0,0,ww,hh);CUR.photo=c2url(cv,.9);var keep=collect();form();restore(keep);st('✓ تم تحديد الصورة');});}
function collect(){var o={};['zn','zpp','zco','zage','zex','zlg','zsk','zsal','zrel','zag'].forEach(function(k){var e=document.getElementById(k);if(e)o[k]=e.value;});return o;}
function restore(o){for(var k in o){var e=document.getElementById(k);if(e)e.value=o[k];}}
function save2(){var f=collect(),u=U();if(!f.zn.trim()){st('⚠ اكتب اسم العاملة');document.getElementById('zn').focus();return;}if(f.zco.indexOf('اختر')>=0){st('⚠ اختر الجنسية');document.getElementById('zco').focus();return;}
 var c={n:f.zn.trim(),co:f.zco,age:+f.zage||0,ex:+f.zex||0,lg:f.zlg||'—',sk:f.zsk||'—',sal:+f.zsal||0,ag:f.zag||'—',s:'متاحة',pp:f.zpp.trim().toUpperCase(),rel:f.zrel,ph:CUR&&CUR.photo||'',cvPages:(CUR&&CUR.pages||[]).map(function(p){return po(p);}),cvBlob:CUR&&CUR.file||null,cvName:CUR&&CUR.file&&CUR.file.name||''};
 u.CANDS.push(c);if(window.XP_BULKDONE)window.XP_BULKDONE(CUR&&CUR.file);try{u.log('إضافة','المرشحات','إضافة '+c.n+' من السيرة الذاتية','—',c.co+' · '+c.sal+' ر.س');}catch(e){}
 var d=document.getElementById('xdr');if(d)d.classList.remove('show');try{u.toast('✓ أُضيفت '+c.n+' مع سيرتها الذاتية');}catch(e){}try{window.XP_HOST.reopen();}catch(e){}}
function reg(){var u=U();if(!u||!u.ACT){setTimeout(reg,60);return;}var A=u.ACT;
 A.cvadd=openAdd;A.cvopen=function(t){viewer(+t.dataset.i,t.dataset.cu==='1');};A.cvsave=function(t){saveCV(+t.dataset.i,t.dataset.cu==='1');};A.cvcrop=crop;A.cvsave2=save2;
 A.cvsample=function(t){t.disabled=true;st('⏳ تجهيز السيرة النموذجية…');samplePdf().then(function(f){t.disabled=false;run(f);}).catch(function(e){t.disabled=false;st('⚠ تعذّر تحميل السيرة النموذجية');});};}
document.addEventListener('change',function(e){if(e.target&&e.target.id==='zfile'&&e.target.files&&e.target.files[0])run(e.target.files[0]);});
reg();
window.XP_ZI={ocrTop:ocrTop,arFix:arFix,extract:extract,parse:parse,po:po,c2url:c2url,run:run,openAdd:openAdd,title:title,esc:esc,load:load,detectPhoto:detectPhoto};
var R=window.XP_RPATCH=window.XP_RPATCH||{};
(R['x.js']=R['x.js']||[]).push(
 ["btn('+ استيراد سير ذاتية', 'demo')","btn('⬆ إسقاط سير ذاتية PDF (بالجملة)', 'cvbulk') + ' ' + btn('+ إضافة عاملة واحدة', 'cvadd', '', 'ghost')"],
 ["'<div class=\"xav lg\" aria-hidden=\"true\">' + esc(c.n.charAt(0)) + '</div>' + kv([","window.XP_AV(c, +t.dataset.i, 1) + kv(["],
 ["['الحالة', chip(c.s, 'a')]])); },","['رقم الجواز', esc(c.pp || '—')], ['الحالة', chip(c.s, 'a')]]) + window.XP_CVB(+t.dataset.i)); },"]);
R['x.js'].push(["'<article class=\"xcvc\" data-co=\"' + esc(c.co) + '\"><div class=\"xav\" aria-hidden=\"true\">' + esc(c.n.charAt(0)) + '</div>","'<article class=\"xcvc\" data-co=\"' + esc(c.co) + '\" data-ag=\"' + esc(c.ag) + '\">' + window.XP_AV(c, i) + '"]);
(R['r.js']=R['r.js']||[]).push(["'\" data-co=\"' + esc(c.co) + '\"><div class=\"xav\" aria-hidden=\"true\">' + esc(c.n.charAt(0)) + '</div>","'\" data-co=\"' + esc(c.co) + '\">' + window.XP_AV(c, o.i, 0, 1) + '"]);
R['x.js'].push(["' سنة · خبرة ' + c.ex + ' سنوات</p>","' سنة · ' + (c.ex ? 'خبرة ' + c.ex + ' سنوات' : 'أول مرة (بدون خبرة)') + '</p>"],["['الخبرة', c.ex + ' سنوات']","['الخبرة', c.ex ? c.ex + ' سنوات' : 'أول مرة']"]);
R['r.js'].push(["' سنة · خبرة ' + c.ex + ' سنوات</p>","' سنة · ' + (c.ex ? 'خبرة ' + c.ex + ' سنوات' : 'أول مرة (بدون خبرة)') + '</p>"]);
var css='.xavw{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.xav.xph{background-size:cover;background-position:center top;border:2px solid #fff;box-shadow:0 0 0 2px #CFE0FA}.xcvb{border:1.5px solid #CFE0FA;background:#F2F7FF;color:#1F5FBF;border-radius:999px;padding:6px 12px;font:600 13px Tajawal,sans-serif;cursor:pointer}.xcvb:hover{background:#E3EEFF}'+
'.xcu .xcvb,.lpg .xcvb{background:#13335C;border-color:#2B5A93;color:#CFE0FA}'+
'.xcvbox{margin-top:16px;border:1.5px solid #DCE4F0;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px}.xcvbh{display:flex;justify-content:space-between;align-items:center;gap:8px}.xcvth{position:relative;border:0;padding:0;background:#EEF2F8;border-radius:10px;overflow:hidden;cursor:zoom-in;max-height:260px}.xcvth img{width:100%;display:block}.xcvth span{position:absolute;inset:auto 0 0 0;background:rgba(11,31,58,.82);color:#fff;padding:8px;font:600 13px Tajawal,sans-serif}.xcvbr{display:flex;gap:8px;flex-wrap:wrap}'+
'#xcvv{position:fixed;inset:0;z-index:2147483000;background:rgba(6,16,32,.94);display:none;flex-direction:column}#xcvv.show{display:flex}.xcvvt{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#0B1F3A;color:#fff;flex-wrap:wrap}.xcvvt b{flex:1;min-width:140px;font:700 16px Tajawal,sans-serif}.xcvvt button{min-width:44px;min-height:40px;border:1px solid #2B5A93;background:#13335C;color:#fff;border-radius:10px;font:600 15px Tajawal,sans-serif;cursor:pointer;padding:0 10px}.xcvvt .xcvvd{background:#E9B949;color:#0B1F3A;border-color:#E9B949}.xcvvs{font:500 13px Tajawal,sans-serif;color:#BFD3F2;min-width:44px;text-align:center}.xcvvb{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;align-items:center;gap:14px;-webkit-overflow-scrolling:touch}.xcvvb img{max-width:none;width:100%;background:#fff;border-radius:6px;box-shadow:0 8px 30px rgba(0,0,0,.4)}@media(min-width:800px){.xcvvb img{max-width:900px}}html.xcvopen{overflow:hidden}'+
'.zadd{display:flex;flex-direction:column;gap:12px}.zdrop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:22px 14px;border:2px dashed #9DBCEB;border-radius:14px;background:#F2F7FF;cursor:pointer;text-align:center}.zdrop input{position:absolute;opacity:0;width:1px;height:1px}.zdrop b{color:#1F5FBF;font-size:16px}.zdrop:focus-within{outline:3px solid #3D8BFF}.zst{min-height:1.2em;font-weight:600}'+
'.zgrid{display:grid;grid-template-columns:130px 1fr;gap:12px;align-items:start}.zph{display:flex;flex-direction:column;align-items:center;gap:6px}.zphi{width:120px;height:150px;border-radius:12px;background:#EEF2F8 center top/cover;display:flex;align-items:center;justify-content:center;color:#8592A6;border:2px solid #DCE4F0}.zok{font-style:normal;color:#1E8E5A;font-size:12px;font-weight:700}.zpg img{width:100%;max-height:220px;object-fit:cover;object-position:top;border-radius:10px;border:1px solid #DCE4F0}'+
'.zcw{position:relative;touch-action:none;user-select:none;cursor:crosshair}.zcw img{width:100%;display:block;border-radius:8px;pointer-events:none}.zrect{position:absolute;border:2.5px solid #E9B949;background:rgba(233,185,73,.18)}'+
'.zfs{display:grid;grid-template-columns:1fr 1fr;gap:10px}.zf{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600;min-width:0}.zf input,.zf select{box-sizing:border-box;width:100%}.zf input,.zf select{min-height:42px;border:1.5px solid #DCE4F0;border-radius:10px;padding:0 10px;font:500 15px Tajawal,sans-serif;background:#fff;color:#0B1F3A}.zf.zauto input,.zf.zauto select{border-color:#7FC6A0;background:#F1FBF5}.zf i{font-style:normal;color:#1E8E5A;font-size:11px}@media(max-width:560px){.zfs{grid-template-columns:1fr}.zgrid{grid-template-columns:110px 1fr}.zphi{width:104px;height:130px}}';
var sEl=document.createElement('style');sEl.textContent=css;document.head.appendChild(sEl);
/* ===== bulk CV drop ===== */
var BULK=null;
function Z(){return window.XP_ZI;}
var STOPW=/APPLICATION|NATIONALITY|RELIGION|SALARY|SKILL|FORM|CURRICULUM|VITAE|BIO ?DATA|RESUME|PERSONAL|DETAILS|INFORMATION|POSITION|PASSPORT|NAME|DATE|PHOTO/;
function agencyOf(text,name,strict){var ar=window.XP_ZI.arFix(text);var lines=String(ar||'').split(/\n/).map(function(l){return l.trim();}).filter(Boolean).slice(0,10),flat=String(ar).toUpperCase().replace(/[^A-Z]/g,''),nmU=String(name||'').toUpperCase(),best='',bs=1;
 for(var k=0;k<lines.length;k++){var raw=lines[k];
  var am=/((?:مكتب|شركة|شركه|وكالة|وكاله|مؤسسة|مؤسسه)[؀-ۿ ]{2,40})/.exec(raw);if(am&&!/[:：]/.test(raw)){var sa=am[1].trim()+(k<4?'':'');if(4>bs){bs=4;best=sa;}}
  var L=raw.toUpperCase().replace(/[^A-Z&.' \-]/g,' ').replace(/\s+/g,' ').trim();if(!L||STOPW.test(L))continue;
  var ws=L.split(' ').filter(function(w){return w.replace(/[^A-Z]/g,'').length>=2;});if(!ws.length||ws.length>6)continue;if(!ws.some(function(w){return w.replace(/[^A-Z]/g,'').length>=4;}))continue;
  while(ws.length>1&&ws[ws.length-1].replace(/[^A-Z]/g,'').length<3)ws.pop();
  var cand=ws.join(' ').replace(/[.\-_]+$/,'');if(nmU&&(cand===nmU||nmU.indexOf(cand)>=0||cand.indexOf(nmU)>=0))continue;
  var sc=0;if(/AGEN(?:CY|T)|MANPOWER|RECRUIT|EMPLOYMENT|SERVICE|INTERNATIONAL|LTD|PLC|\bINC\b|\bCO\b|OVERSEAS|TRAVEL|TRADING|LABOU?R|EXPORT|PLACEMENT|HUMAN/.test(cand))sc+=5;if(ws.length>=2)sc+=2;var cmp=cand.replace(/[^A-Z]/g,'');if(cmp.length>=5&&flat.split(cmp).length>2)sc+=2;if(k<3)sc+=1;if(/HOUSE\s*MAID|HOUSEMAID|\bMAID\b|DRIVER|NANNY|NURSE|COOK\b/.test(cand))sc-=6;
  if(sc>bs){bs=sc;best=cand;}}
 return bs>=(strict?5:3)?best:'';}
function nk(s){return String(s||'').toUpperCase().replace(/[^A-Z؀-ۿ ]/g,' ').split(/\s+/).filter(Boolean).sort().join(' ');}
function keys(o){var k=[];if(o.pp)k.push('P:'+String(o.pp).toUpperCase().replace(/[^A-Z0-9]/g,''));if(o.n)k.push('N:'+nk(o.n)+'|'+(o.co||''));return k;}
function locked(i){var U_=window.XP_U,V=window.XP_V,c=U_.CANDS[i];if(!c)return false;if(c.s&&c.s!=='متاحة')return true;
 var HL=U_.HOLDS;try{if(typeof HL==='function')HL=HL();}catch(e){HL=[];}if(!Array.isArray(HL))HL=[];if(HL.some(function(h){return h&&h.ci===i&&h.st!=='expired'&&h.st!=='cancel';}))return true;
 if(V&&V.VISA&&V.VISA.some(function(v){return v.w===c.n;}))return true;return false;}
function index(){var m={};window.XP_U.CANDS.forEach(function(c,i){keys({pp:c.pp,n:c.n,co:c.co}).forEach(function(k){if(!(k in m))m[k]=i;});});return m;}
function bst(){var e=document.querySelector('#xdr .zbody');if(e&&BULK)e.innerHTML=report();}
function pct(){return BULK&&BULK.total?Math.round(BULK.done/BULK.total*100):0;}
function report(){var b=BULK,es=Z().esc;if(!b)return '';
 var h='<div class="zbk">'+
 (b.running?'<div class="zbp"><div class="zbpt"><b>⏳ جارٍ قراءة السير '+b.done+' / '+b.total+'</b><button type="button" class="xbt sm ghost" data-act="cvbstop">إيقاف</button></div><div class="zbar"><i style="width:'+pct()+'%"></i></div><p class="mut sm">'+es(b.cur||'')+' — يمكنك إغلاق النافذة والعمل مستمر.</p></div>':
  '<div class="zbp"><b>'+(b.stopped?'⏸ أُوقف الإسقاط':'✓ اكتمل الإسقاط')+' · '+b.done+' من '+b.total+' ملف</b></div>')+
 '<div class="zbc"><div class="zg"><b>'+b.added.length+'</b><span>أُضيفت</span></div><div class="zr"><b>'+b.dup.length+'</b><span>مكرّرة رُفضت</span></div><div class="za"><b>'+b.lock.length+'</b><span>محجوزة / مربوطة</span></div><div class="zy"><b>'+b.review.length+'</b><span>تحتاج مراجعة</span></div></div>';
 var U_=window.XP_U,byCo={},byAg={};b.added.forEach(function(a){var c=U_.CANDS[a.i];if(!c)return;byCo[c.co]=(byCo[c.co]||0)+1;(byAg[c.ag]=byAg[c.ag]||[]).push(a.i);});
 if(b.added.length){h+='<h4>حسب الجنسية</h4><div class="zbt">'+Object.keys(byCo).map(function(k){return '<span class="xc">'+es(k)+' · '+byCo[k]+'</span>';}).join('')+'</div>';
  h+='<h4>حسب المكتب الخارجي <span class="mut sm">(لا يظهر للعميل)</span></h4>'+Object.keys(byAg).map(function(k,j){return '<div class="zbag"><span class="xc">'+byAg[k].length+'</span><input id="zag'+j+'" dir="auto" value="'+es(k)+'" aria-label="اسم المكتب"><button type="button" class="xbt sm ghost" data-act="cvagren" data-g="'+es(k)+'" data-j="'+j+'">تعديل الاسم للكل</button></div>';}).join('');}
 function lst(t,arr,cls){if(!arr.length)return '';return '<h4>'+t+'</h4><ul class="zbl '+cls+'">'+arr.slice(0,300).map(function(x,k){return '<li><b>'+es(x.name||'—')+'</b><span class="mut sm">'+es(x.file)+'</span><em>'+es(x.why)+'</em>'+(x.rev?'<button type="button" class="xbt sm" data-act="cvrev" data-k="'+k+'">مراجعة وإضافة</button>':'')+'</li>';}).join('')+'</ul>';}
 h+=lst('تحتاج مراجعة (لم تُقرأ بياناتها كاملة)',b.review.map(function(x){x.rev=1;return x;}),'zy')+lst('رُفضت لأنها محجوزة أو مربوطة بعقد — لا تُعاد',b.lock,'za')+lst('رُفضت لأنها مكرّرة — بقيت نسخة واحدة',b.dup,'zr');
 if(!b.running)h+='<div class="xrow"><button type="button" class="xbt" data-act="cvbnew">⬆ إسقاط دفعة جديدة</button><button type="button" class="xbt ghost" data-close>إغلاق</button></div>';
 return h+'</div>';}
function dropUI(){var U_=window.XP_U,ags=[];U_.CANDS.forEach(function(c){if(c.ag&&c.ag!=='—'&&ags.indexOf(c.ag)<0)ags.push(c.ag);});var es=Z().esc;
 return '<div class="zadd"><p class="mut">اسحب وأسقط ملفات السير الذاتية هنا (PDF أو صور) — مئات الملفات دفعة واحدة. يقرأ النظام كل سيرة ويضيفها حسب الجنسية والمكتب، ويرفض المكرّر تلقائيًا، ولا يعيد العاملات المحجوزات أو المربوطات بعقد.</p>'+
 '<label class="zf"><span>المكتب الخارجي (الوكيل) لهذه الدفعة</span><select id="zbag"><option value="">تلقائي — يُقرأ من رأس السيرة</option>'+ags.map(function(a){return '<option>'+es(a)+'</option>';}).join('')+'</select></label>'+
 '<label class="zdrop zbdrop" for="zbfile"><input id="zbfile" type="file" multiple accept="application/pdf,image/*"><b>⬇ أسقط الملفات هنا أو اضغط للاختيار</b><span class="mut sm">يمكن اختيار أكثر من 200 ملف · تُقرأ على جهازك ولا تُرفع لأي خدمة خارجية</span></label>'+
 '<div class="zbody"></div></div>';}
function openBulk(){window.XP_U.drawer('إسقاط السير الذاتية بالجملة',BULK&&(BULK.running||BULK.total)?'<div class="zbody">'+report()+'</div>':dropUI());}
function start(files){files=[].slice.call(files).filter(function(f){return /pdf|image/i.test(f.type)||/\.(pdf|jpe?g|png|webp)$/i.test(f.name);});if(!files.length)return;if(BULK&&BULK.running)return;
 var sel=document.getElementById('zbag');BULK={total:files.length,done:0,added:[],dup:[],lock:[],review:[],running:1,ag:sel?sel.value:'',files:files};
 var dz=document.querySelector('#xdr .zadd');if(dz)dz.innerHTML='<div class="zbody"></div>';bst();loop();}
function loop(){var b=BULK,U_=window.XP_U,I=index(),seen={};var t0=Date.now();
 (function next(){if(!b.running)return;if(b.done>=b.total){b.running=0;bst();try{window.XP_HOST.reopen();}catch(e){}try{U_.toast('✓ اكتمل الإسقاط: أُضيفت '+b.added.length+' · رُفض '+(b.dup.length+b.lock.length));}catch(e){}return;}
  var f=b.files[b.done];b.cur=f.name;bst();
  Z().extract(f,function(){},1).then(function(r){var o=Z().parse(r.text);var z=Z();
   var nm=o.n?z.title(o.n):'';var ks=keys({pp:o.pp,n:o.n?z.title(o.n):'',co:o.co});
   if(!ks.length){var fk='F:'+f.name+'|'+f.size;if(seen[fk])ks=[fk];seen[fk]=1;}
   var hit=null,ppk=o.pp?'P:'+String(o.pp).toUpperCase().replace(/[^A-Z0-9]/g,''):'';ks.forEach(function(k){if(hit!==null||!(k in I))return;var j=I[k];if(k.charAt(0)==='N'&&ppk&&j>=0){var op=(U_.CANDS[j].pp||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(op&&('P:'+op)!==ppk)return;}hit=j;});
   if(hit!==null){if(hit>=0&&locked(hit))b.lock.push({name:nm,file:f.name,why:'العاملة '+(U_.CANDS[hit].n)+' '+(U_.CANDS[hit].s!=='متاحة'?U_.CANDS[hit].s:'مربوطة بحجز/عقد')});else b.dup.push({name:nm,file:f.name,why:ppk&&(ppk in I)?'نفس رقم الجواز '+o.pp:'نفس الاسم والجنسية'});return;}
   if(!nm||!o.co){b.review.push({name:nm||'(لم يُقرأ الاسم)',file:f.name,why:!nm?'الاسم غير مقروء':'الجنسية غير مقروءة',f:f});ks.forEach(function(k){I[k]=-1;});return;}
   var ag0=b.ag||agencyOf(r.text,nm,r.ocr);var fin=function(ag){ag=ag||'غير محدد';
   var c={n:nm,co:o.co,age:o.age||0,ex:o.ex||0,lg:o.lg||'—',sk:o.sk||'—',sal:o.sal||0,ag:ag,s:'متاحة',pp:o.pp?String(o.pp).toUpperCase():'',rel:o.rel||'',ms:o.ms||'',ph:r.photo?z.c2url(r.photo,.8):'',cvPages:r.pages.map(function(p){return z.po(p,.72);}),cvBlob:f,cvName:f.name,bulk:1};
   U_.CANDS.push(c);var i=U_.CANDS.length-1;ks.forEach(function(k){I[k]=i;});b.added.push({i:i,file:f.name});};
   if(ag0||r.ocr||!r.pages[0])return fin(ag0);return z.ocrTop(r.pages[0]).then(function(tt){fin(agencyOf(tt,nm,1));});
  }).catch(function(e){b.review.push({name:'(تعذّرت القراءة)',file:f.name,why:'ملف تالف أو غير مدعوم',f:f,err:String(e&&e.stack||e)});})
  .then(function(){b.done++;setTimeout(next,0);});})();
 }
window.XP_BULKDONE=function(f){if(!BULK||!f)return;var k=BULK.review.findIndex(function(x){return x.f===f;});if(k>=0){BULK.review.splice(k,1);var U_=window.XP_U;BULK.added.push({i:U_.CANDS.length-1,file:f.name});}};
function regB(){var u=window.XP_U;if(!u||!u.ACT||!window.XP_ZI){setTimeout(regB,80);return;}var A=u.ACT;
 A.cvbulk=openBulk;A.cvbnew=function(){if(BULK&&BULK.running)return;BULK=null;openBulk();};A.cvbstop=function(){if(BULK){BULK.running=0;BULK.stopped=1;bst();try{window.XP_HOST.reopen();}catch(e){}}};
 A.cvrev=function(t){var x=BULK&&BULK.review[+t.dataset.k];if(!x||!x.f)return;Z().openAdd();Z().run(x.f);};
 A.cvagren=function(t){var v=(document.getElementById('zag'+t.dataset.j)||{}).value;v=(v||'').trim();if(!v||!BULK)return;var g=t.dataset.g;BULK.added.forEach(function(a){var c=u.CANDS[a.i];if(c&&c.ag===g){c.ag=v;c.cvDef=null;}});bst();try{u.toast('✓ تم تعديل اسم المكتب');}catch(e){}};}
regB();
document.addEventListener('change',function(e){if(e.target&&e.target.id==='zbfile'&&e.target.files&&e.target.files.length)start(e.target.files);});
['dragenter','dragover'].forEach(function(ev){document.addEventListener(ev,function(e){var d=e.target.closest&&e.target.closest('.zbdrop');if(d){e.preventDefault();d.classList.add('zon');}});});
document.addEventListener('dragleave',function(e){var d=e.target.closest&&e.target.closest('.zbdrop');if(d)d.classList.remove('zon');});
document.addEventListener('drop',function(e){var d=e.target.closest&&e.target.closest('.zbdrop');if(d){e.preventDefault();d.classList.remove('zon');start(e.dataTransfer.files);}});
window.XP_ZB=function(){return BULK;};
/* agency filter on admin candidates list */
function agf(){var sec=document.getElementById('xcv');if(!sec)return;var xf=sec.previousElementSibling;if(!xf||!xf.classList.contains('xf')||document.querySelector('.zagf'))return;
 var ags=[];sec.querySelectorAll('.xcvc[data-ag]').forEach(function(a){var g=a.dataset.ag;if(g&&ags.indexOf(g)<0)ags.push(g);});if(ags.length<2)return;var es=Z().esc;
 var d=document.createElement('div');d.className='xf zagf';d.setAttribute('role','group');d.setAttribute('aria-label','تصفية حسب المكتب');d.innerHTML='<span class="mut sm">المكتب:</span><button type="button" class="xfc on" data-agf="">الكل</button>'+ags.map(function(g){return '<button type="button" class="xfc" data-agf="'+es(g)+'">'+es(g)+'</button>';}).join('');xf.after(d);}
function applyF(){var a=document.querySelector('.zagf .on'),c=document.querySelector('.xf:not(.zagf) .xfc.on');var ag=a?a.dataset.agf:'',co=c?c.dataset.cf:'';document.querySelectorAll('#xcv .xcvc').forEach(function(x){x.style.display=(!co||x.dataset.co===co)&&(!ag||x.dataset.ag===ag)?'':'none';});}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-agf]');if(b){document.querySelectorAll('.zagf [data-agf]').forEach(function(x){x.classList.toggle('on',x===b);});applyF();return;}if(e.target.closest&&e.target.closest('[data-cf]'))setTimeout(applyF,0);});
var pendB=0;function schB(){if(pendB)return;pendB=1;requestAnimationFrame(function(){pendB=0;try{agf();}catch(e){}});}
(function sb(){if(!document.body){setTimeout(sb,50);return;}new MutationObserver(schB).observe(document.body,{childList:true,subtree:true});})();
var cssB='.zbk{display:flex;flex-direction:column;gap:12px}.zbk h4{margin:6px 0 0;font-size:15px}.zbp{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:#F2F7FF;border:1.5px solid #CFE0FA}.zbpt{display:flex;justify-content:space-between;align-items:center;gap:8px}.zbar{height:10px;border-radius:99px;background:#DCE4F0;overflow:hidden}.zbar i{display:block;height:100%;background:linear-gradient(90deg,#3D8BFF,#1F5FBF);transition:width .3s}'+
'.zbc{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.zbc div{border-radius:12px;padding:10px;text-align:center;display:flex;flex-direction:column;gap:2px;border:1.5px solid}.zbc b{font-size:22px}.zbc span{font-size:12px;font-weight:600}.zbc .zg{background:#EEF9F2;border-color:#9FD8B8;color:#17643E}.zbc .zr{background:#FDF0F0;border-color:#F0B4B4;color:#9B2C2C}.zbc .za{background:#FFF6E6;border-color:#F2D29A;color:#8A5A0B}.zbc .zy{background:#F3F0FF;border-color:#C9BEF5;color:#4B3B9A}'+
'.zbt{display:flex;flex-wrap:wrap;gap:6px}.zbag{display:flex;gap:8px;align-items:center}.zbag input{flex:1;min-width:0;min-height:38px;border:1.5px solid #DCE4F0;border-radius:10px;padding:0 10px;font:500 14px Tajawal,sans-serif}'+
'.zbl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow:auto}.zbl li{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:8px 10px;border-radius:10px;border:1px solid #E3E8F0;background:#fff}.zbl li em{font-style:normal;font-size:12px;font-weight:600;flex-basis:100%}.zbl.zr em{color:#9B2C2C}.zbl.za em{color:#8A5A0B}.zbl.zy em{color:#4B3B9A}.zbl li .xbt{margin-inline-start:auto}'+
'.zbdrop{padding:34px 14px}.zbdrop.zon{background:#E3EEFF;border-color:#1F5FBF}.zagf{margin-top:-4px}.zagf>span{align-self:center}@media(max-width:560px){.zbc{grid-template-columns:repeat(2,1fr)}}';
var sB=document.createElement('style');sB.textContent=cssB;document.head.appendChild(sB);
})();
