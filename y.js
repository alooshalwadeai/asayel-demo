(function(){
function enh(){
 var dr=document.getElementById('xdr');if(!dr||!dr.classList.contains('show')||dr.querySelector('.fadv'))return;
 var V=window.XP_V,U=window.XP_U;if(!V||!U)return;
 var h=dr.querySelector('h2,h3,.xdrh,header');var txt=dr.innerText||'';var m=/طلب (س-\d+)/.exec(txt);if(!m||txt.indexOf('المراحل')<0)return;
 var i=-1;for(var k=0;k<V.VISA.length;k++){if(V.VISA[k].id===m[1]){i=k;break;}}if(i<0)return;var v=V.VISA[i],VS=V.VSTEPS;
 var box=document.createElement('div');box.className='fadv';
 if(v.done||v.st>=6){box.innerHTML='<p class="mut sm">'+(v.st>=6?'المراحل بعد التذكرة (الوصول للمطار والمكتب) تُحدَّث من صفحة «متابعة الوصول».':'')+'</p>';}
 else{var nx=VS[v.st+1],ok=!U.can||U.can('rec');
  box.innerHTML='<b>نقل الطلب للمرحلة التالية</b><div class="fadvr"><span class="xc">'+VS[v.st]+'</span><span>←</span><span class="xc fnx">'+nx+'</span></div>'+
  (ok?'<button type="button" class="xbt" data-act="fnext" data-i="'+i+'">'+(v.st===5?'✈ حجز التذكرة ونقل الطلب':'✓ نقل إلى «'+nx+'» وإبلاغ العميل')+'</button><p class="mut sm">يُرسل للعميل تنبيه واتساب بالمرحلة الجديدة تلقائيًا.</p>':
  '<p class="mut sm">🔒 النقل لمن لديه صلاحية «تحديث مراحل الاستقدام» (يعطيها المدير من الموظفين والصلاحيات).</p>');}
 var hs=[].filter.call(dr.querySelectorAll('h3'),function(x){return x.textContent.indexOf('المراحل')>=0;})[0];(hs?hs.parentNode:dr).appendChild(box);
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.fadv [data-act=fnext]');if(!b)return;var V=window.XP_V;var v=V&&V.VISA[+b.dataset.i];if(!v)return;var st=v.st;setTimeout(function(){if(v.st!==st){var d=document.getElementById('xdr');if(d)d.classList.remove('show');}},60);},false);
var pend=0;function sch(){if(pend)return;pend=1;requestAnimationFrame(function(){pend=0;try{enh();}catch(e){}});}
function start(){if(!document.body){setTimeout(start,50);return;}new MutationObserver(sch).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
var s=document.createElement('style');s.textContent='.fadv{margin:16px 0 4px;padding:14px;border:1.5px solid #CFE0FA;background:#F2F7FF;border-radius:14px;display:flex;flex-direction:column;gap:10px}.fadvr{display:flex;align-items:center;gap:8px}.fadv .fnx{background:#3D8BFF;color:#fff}.fadv .xbt{align-self:flex-start}';document.head.appendChild(s);
start();
})();
