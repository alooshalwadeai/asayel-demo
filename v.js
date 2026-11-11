(function(){
function enh(){
 var U=window.XP_U; if(U&&U.PERMS)U.PERMS.forEach(function(p){if(p[0]==='contract'&&p[1].indexOf('الربط')<0)p[1]='بيانات العقد (مساند · الربط · التأمين · مدينة الوصول)';});
 var inp=document.getElementById('kld');if(!inp||inp.__kl)return;inp.__kl=1;
 var lab=inp.closest('label');if(!lab)return;var has=!!inp.value;
 var w=document.createElement('div');w.className='shfl kldw';
 w.innerHTML='<span>الربط</span><div class="xseg kls" role="group" aria-label="حالة الربط"><button type="button" data-kl="wait" class="'+(has?'':'on')+'">باقي الربط</button><button type="button" data-kl="date" class="'+(has?'on':'')+'">اختر تاريخ</button></div>';
 inp.removeAttribute('dir');inp.style.display=has?'':'none';inp.setAttribute('aria-label','تاريخ الربط');w.appendChild(inp);
 lab.parentNode.replaceChild(w,lab);
 var dr=document.getElementById('xdr');var body=dr&&dr.querySelector('.xrow.mt');
 if(body&&!dr.querySelector('.klnote')){var n=document.createElement('p');n.className='mut sm klnote';n.textContent='🔐 التعديل للمدير ولمن يعطيه صلاحية «بيانات العقد» من صفحة الموظفين والصلاحيات.';body.parentNode.insertBefore(n,body);}
}
var pend=0;function sch(){if(pend)return;pend=1;requestAnimationFrame(function(){pend=0;try{enh();}catch(e){}});}
function start(){if(!document.body){setTimeout(start,50);return;}new MutationObserver(sch).observe(document.body,{childList:true,subtree:true});sch();}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-kl]');if(!b)return;e.preventDefault();var w=b.closest('.kldw');var inp=w.querySelector('#kld');
 Array.prototype.forEach.call(w.querySelectorAll('[data-kl]'),function(x){x.classList.toggle('on',x===b);});
 if(b.dataset.kl==='wait'){inp.value='';inp.style.display='none';}else{inp.style.display='';try{inp.focus();if(inp.showPicker)inp.showPicker();}catch(er){}}
},true);
var s=document.createElement('style');s.textContent='.kldw .kls{display:flex;width:100%}.kldw .kls button{flex:1;height:40px}.kldw input{margin-top:8px}.klnote{margin:10px 0 0}';document.head.appendChild(s);
start();
})();
