(function(){
function tod(){var d=new Date();return ('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear();}
function pdd(s){var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s||'');return m?new Date(+m[3],+m[2]-1,+m[1]):null;}
function rr(){var h=window.XP_HOST||{};if(h.reopen)h.reopen();}
document.addEventListener('click',function(e){
 var b=e.target.closest&&e.target.closest('[data-act=arrived],[data-act=fdeliver]');if(!b)return;var V=window.XP_V,U=window.XP_U;if(!V||!U)return;var i=+b.dataset.i;
 if(b.dataset.act==='arrived'){var a=V.ARR[i];if(!a)return;var before=a.s;setTimeout(function(){if(a.s!==before&&a.s==='وصلت المطار'&&!a.arrD){a.arrD=tod();var v=V.VISA.filter(function(x){return x.id===a.id;})[0];if(v)v.arrD=a.arrD;}},0);return;}
 var v=V.VISA[i];if(!v)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 if(U.can&&!U.can('recv')){U.toast('🔒 ليست لديك صلاحية «الاستقبال وتسليم العاملات»');return;}
 var ar=v.arrD;if(!ar){var a2=V.ARR.filter(function(x){return x.id===v.id&&x.arrD;})[0];ar=a2?a2.arrD:tod();}
 var d0=pdd(ar),el=d0?Math.max(0,Math.round((Date.now()-d0.getTime())/864e5)):0;
 v.done=1;v.dt=tod();V.GUAR.unshift({k:'ع-'+(190+V.GUAR.length),c:v.c,w:v.w,co:v.co,st:ar,el:el});
 V.sendWA(v.c,'تسليم العاملة','تم تسليمك عاملتك '+v.w+' اليوم ✅ ضمان المكتب 90 يومًا ويُحسب من تاريخ وصولها '+ar+'، وأي ملاحظة تواصل معنا. نتمنى لكم التوفيق 🌷');
 U.log('اعتماد','متابعة الوصول','تسليم العاملة '+v.w+' للعميل '+v.c,'في المكتب','مع العميل · الضمان من تاريخ الوصول '+ar);
 U.toast('تم تسليم العاملة للعميل · الضمان محسوب من تاريخ الوصول '+ar);rr();
},true);
var R=window.XP_RPATCH=window.XP_RPATCH||{};(R['x.js']=R['x.js']||[]).push.apply(R['x.js'],[["'ضمان 90 يومًا لكل عقد استقدام · تنبيه تلقائي قبل الانتهاء بـ 10 أيام'", "'الضمان يبدأ من تاريخ وصول العاملة · المدة حسب عقد مساند · تنبيه تلقائي قبل الانتهاء بـ 10 أيام'"], ["{ l: 'بداية الضمان', k: 'st' }", "{ l: 'بداية الضمان (الوصول)', k: 'st' }"]]);(R['s/1.txt']=R['s/1.txt']||[]).push.apply(R['s/1.txt'],[["function gStart(r) { return r.gStart || r.entry; }", "function gStart(r) { return r.entry || r.gStart; }"]]);(R['s/2.txt']=R['s/2.txt']||[]).push.apply(R['s/2.txt'],[["f('fentry', 'تاريخ دخول المملكة'", "f('fentry', 'تاريخ الوصول (دخول المملكة)'"], ["'تُحسب نهاية الضمان بعد إدخال بدايته'", "'تُحسب نهاية الضمان تلقائيًا من تاريخ الوصول'"]]);(R['s/3.txt']=R['s/3.txt']||[]).push.apply(R['s/3.txt'],[["'<h3 class=\"xgh\">الضمان <small class=\"mut\">حسب عقد مساند</small></h3>", "'<h3 class=\"xgh\">الضمان <small class=\"mut\">يبدأ من تاريخ الوصول</small></h3>"], ["f('fgs', 'بداية الضمان (حسب مساند)', r.gStart || r.entry, 'date')", "f('fgs', 'بداية الضمان = تاريخ الوصول', r.entry, 'date', 'readonly title=\"يتحدد تلقائيًا من تاريخ الوصول\"')"], ["gBox(r.gStart || r.entry, gDays(r))", "gBox(r.entry, gDays(r))"]]);})();
