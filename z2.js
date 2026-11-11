(function(){
var K='xp-agmap',RULES=[[/DIAMOND|الماسي/i,'الماسية'],[/\bMAHI\b|ماهي/i,'ماهي']],NATDEF={'بنغلاديش':'ماهي'};
function ld(){try{return JSON.parse(localStorage.getItem(K))||{a:{},n:{}};}catch(e){return {a:{},n:{}};}}
function sv(m){try{localStorage.setItem(K,JSON.stringify(m));}catch(e){}}
function mapAg(raw,co){var r=String(raw||'').trim(),m=ld();if(r==='—'||r==='غير محدد')r='';
 if(r){var u=r.toUpperCase();if(m.a[u])return m.a[u];for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(r))return RULES[i][1];return r;}
 return (co&&(m.n[co]||NATDEF[co]))||'غير محدد';}
window.XP_MAPAG=mapAg;
function hook(){var U=window.XP_U;if(!U||!U.CANDS||!U.ACT||!U.ACT.cvagren){setTimeout(hook,100);return;}
 var C=U.CANDS;if(!C.__ag){C.__ag=1;C.push=function(){for(var i=0;i<arguments.length;i++){var c=arguments[i];if(c&&typeof c==='object'&&'ag' in c)c.ag=mapAg(c.ag,c.co);}return Array.prototype.push.apply(this,arguments);};}
 var A=U.ACT;if(!A.cvagren.__w){var o=A.cvagren;A.cvagren=function(t){var g=t.dataset.g,v=((document.getElementById('zag'+t.dataset.j)||{}).value||'').trim();
  if(v&&g&&v!==g){var m=ld(),B=window.XP_ZB&&window.XP_ZB();if(g==='غير محدد'&&B){var cos={};B.added.forEach(function(a){var c=C[a.i];if(c&&c.ag===g)cos[c.co]=1;});Object.keys(cos).forEach(function(co){m.n[co]=v;});}else m.a[g.toUpperCase()]=v;sv(m);}
  var r=o(t);try{window.XP_HOST.reopen();}catch(e){}return r;};A.cvagren.__w=1;}}
hook();
/* single-add form: map the prefilled agent */
function enh(){var i=document.getElementById('zag');if(!i||i.__m)return;i.__m=1;var co=(document.getElementById('zco')||{}).value;i.value=mapAg(i.value,co);}
(function st(){if(!document.body){setTimeout(st,50);return;}new MutationObserver(function(){try{enh();}catch(e){}}).observe(document.body,{childList:true,subtree:true});})();
/* daily rental = 8 hours: label every place that shows a "day" of rental */
var DR=[[/^(\s*)يوم كامل(\s*)$/,'$1يوم (8 ساعات)$2'],[/يوم واحد(?! \()/g,'يوم واحد (8 ساعات)'],[/تمديد يومين(?! \()/g,'تمديد يومين (16 ساعة)'],[/· يومان ·/g,'· يومان (16 ساعة) ·'],
 [/بالساعة أو اليوم(?! \()/g,'بالساعة أو اليوم (8 ساعات)'],[/(^|\s)يوم · أسبوع/g,'$1يوم (8 ساعات) · أسبوع'],[/يوم، أسبوع/g,'يوم (8 ساعات)، أسبوع'],[/يمدد يومًا أو أكثر/g,'يمدد يومًا (8 ساعات) أو أكثر'],[/حافز اليوم الكامل/g,'حافز اليوم (8 ساعات)'],[/بالساعة واليوم والأسبوع/g,'بالساعة واليوم (8 ساعات) والأسبوع']];
function fixTxt(root){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,set=/Settings/.test(location.hash);while((n=w.nextNode())){var v=n.nodeValue;if(!v||!/يوم|اليوم/.test(v))continue;if(n.parentNode&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName))continue;var o=v;
 DR.forEach(function(r){v=v.replace(r[0],r[1]);});if(set&&/^\s*اليوم\s*$/.test(v)){v=v.replace('اليوم','اليوم (8 ساعات)');var lb=n.parentNode;if(lb&&!lb.parentNode.querySelector('.z8h')){var d=document.createElement('div');d.className='z8h';d.textContent='⏱ اليوم في الإيجار = 8 ساعات عمل · ما زاد عن 8 ساعات يُحسب ساعة إضافية';d.style.cssText='font-size:12px;color:#1F5FBF;margin:2px 0 6px';lb.parentNode.insertBefore(d,lb.nextSibling);}}
 if(v!==o)n.nodeValue=v;}}
var pq=0;function sch8(){if(pq)return;pq=1;requestAnimationFrame(function(){pq=0;try{fixTxt(document.body);}catch(e){}});}
(function st8(){if(!document.body){setTimeout(st8,50);return;}new MutationObserver(sch8).observe(document.body,{childList:true,subtree:true});sch8();})();
})();
