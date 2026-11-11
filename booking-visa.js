(() => {
  'use strict';
  const api = 'https://rmhkmutxptwdvcorcfyy.supabase.co/rest/v1/rpc/';
  const publicKey = 'sb_publishable_wJghGm84T-aRdvKZZXmF3Q_zEfYRsM9';
  const permission = 'إضافة رقم التأشيرة نيابةً عن العميل';
  const choices = ['نعم، لدي رقم التأشيرة', 'ساعدني ألقى رقم تأشيرتي', 'أطلب مساعدة مجانية من أصايل'];
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const when = x => new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'}).format(new Date(x));
  const current = () => window.XP_U?.rcust?.() || window.XP_U?.cust?.();
  const keyFor = c => 'asayel.recruitment.' + c.ph;
  function credentials(c) {
    const name = keyFor(c);
    let data = JSON.parse(localStorage.getItem(name) || 'null');
    if (!data) {
      data = {key:crypto.randomUUID()};
      localStorage.setItem(name,JSON.stringify(data));
    }
    return data;
  }
  async function call(fn,args,staff=false) {
    const headers = {'Content-Type':'application/json',apikey:publicKey};
    if (staff) {
      const token = JSON.parse(localStorage.getItem('asayel-chat') || 'null')?.access_token;
      if (!token) throw Error('سجّل الدخول بحسابك الوظيفي لعرض هذا القسم.');
      headers.Authorization = 'Bearer ' + token;
    }
    const res = await fetch(api + fn,{method:'POST',headers,body:JSON.stringify(args)});
    const data = await res.json();
    if (!res.ok) throw Error(data.message || 'تعذّر حفظ التغيير. حاول مرة أخرى.');
    return data;
  }
  function summary(h) {
    return '<dl><div><dt>العاملة</dt><dd>'+esc(h.worker)+'</dd></div><div><dt>رقم الحجز</dt><dd><bdi>'+esc(h.ref)+'</bdi></dd></div><div><dt>انتهاء الحجز بتوقيت المملكة</dt><dd>'+esc(when(h.expires))+'</dd></div></dl>';
  }
  function button(action,text) {return '<button type="button" data-v="'+action+'">'+text+'</button>';}
  function field(staff) {
    return '<form data-visa-form><label>رقم التأشيرة<input name="number" type="text" inputmode="numeric" dir="ltr" required pattern="[0-9٠-٩۰-۹]+" autocomplete="off"></label><button>'+ (staff?'حفظ الرقم':'تأكيد الحجز برقم التأشيرة') +'</button></form>';
  }
  function details(choice) {
    if(choice==='0') return field(false);
    if(choice==='1') return '<h4>سبق أن صدرت لي تأشيرة</h4><p>سجّل الدخول إلى حسابك الشخصي في مساند، وافتح طلبات التأشيرات، ثم اعرض تفاصيل التأشيرة الصادرة وانسخ رقمها. يمكنك أيضًا مراجعة الرسالة النصية الواردة من مساند على جوالك المسجّل. إذا كان الإشعار لا يتضمن الرقم، ارجع إلى تفاصيل الطلب في حسابك.</p><h4>أحتاج إلى إصدار تأشيرة</h4><p>سجّل الدخول إلى مساند أو أنشئ حسابك الشخصي، ثم اختر خدمة إصدار تأشيرة عمالة منزلية. أكمل البيانات المطلوبة، وراجع تفاصيل الرسوم، واتبع تعليمات السداد الظاهرة في مساند. بعد صدور التأشيرة، تابع إشعار مساند على جوالك واستخرج الرقم من الرسالة أو من تفاصيل الطلب.</p><div class="av-actions"><a href="https://musaned.com.sa/" target="_blank" rel="noopener noreferrer">فتح منصة مساند</a>'+button('0','حصلت على الرقم، أدخله الآن')+'</div>';
    if(choice==='2') return '<p>سيتواصل معك أحد موظفي شركة أصايل على جوالك المسجّل لمساعدتك في فتح حسابك الشخصي في مساند، وإرشادك خلال خطوات إصدار التأشيرة</p><p>أتعاب شركة أصايل للمساعدة: ٠ ريال<br>رسوم خدمة إصدار التأشيرة عبر مساند: ١٧٢٫٥٠ ريال، مستحقة لمنصة مساند</p>'+button('help','اطلب تواصل موظف أصايل');
    return '';
  }
  function status(h) {
    if(h.cancelled) return 'أُلغي الحجز';
    if(h.visa) return 'تم الحجز برقم التأشيرة '+esc(h.visa)+'. '+(h.added_by?'أضاف فريق أصايل الرقم إلى حجزك، ويمكنك الآن متابعة طلبك':'يمكنك متابعة طلبك من حسابك في أصايل');
    if(h.expired) return 'انتهت مهلة الحجز';
    if(h.help_at) return 'استلمنا طلب المساعدة. سيتواصل معك موظف أصايل على جوالك المنتهي بـ '+esc(h.phone.slice(-4));
    return 'الخطوة التالية: إضافة رقم التأشيرة';
  }
  function customerPanel(h,choice) {
    const open=!h.expired&&!h.cancelled&&!h.visa;
    return '<h2>حجز السيرة الذاتية</h2>'+summary(h)+'<p role="status">'+status(h)+'</p>'+
      (h.visa?'<p>الربط في مساند · '+(h.linked_at?'تم تأكيد الربط':'بانتظار تأكيد الموظف')+'</p>':'')+
      (h.help_at?'<p>حالة طلب المساعدة · '+(h.visa?'تمت إضافة رقم التأشيرة':'تم استلام الطلب')+'</p>':'')+
      (open?(h.help_at?button('0','إضافة رقم التأشيرة'):'<h3>هل لديك رقم التأشيرة؟</h3><div class="av-choices">'+choices.map((label,i)=>'<button type="button" data-v="'+i+'" aria-pressed="'+(String(i)===choice)+'">'+label+'</button>').join('')+'</div>')+'<div class="av-detail">'+details(choice)+'</div>':'');
  }
  function staffRow(h,desk,selected) {
    const id=esc(h.id), open=!h.visa&&!h.expired&&!h.cancelled;
    return '<article data-booking="'+id+'"><h3>'+esc(h.customer)+'</h3><p>جوال العميل <bdi>'+esc(h.phone)+'</bdi></p>'+summary(h)+
      (h.visa?'<p>رقم التأشيرة <bdi>'+esc(h.visa)+'</bdi></p>':'')+
      '<p>'+(h.cancelled?'أُلغي الحجز':h.expired&&!h.visa?'انتهت المهلة':h.visa?'تمت إضافة رقم التأشيرة':'بانتظار إضافة رقم التأشيرة')+'</p>'+
      (open&&desk.can_save&&h.help_at?(selected===h.id?field(true):button('edit','إضافة رقم التأشيرة للعميل')):'')+
      (h.linked_at?'<p>تم الربط في مساند · '+esc(when(h.linked_at))+'</p>':h.visa&&!h.cancelled&&desk.can_link?button('link','تأكيد اكتمال الربط في مساند'):'')+'</article>';
  }
  function previousIds(c) {
    try {return JSON.parse(localStorage.getItem('z13my:'+c.ph)||'[]').filter(id=>/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)).slice(0,20);}
    catch {return [];}
  }
  function release(h) {
    const c=current(),u=window.XP_U;
    if(!c||h.phone!==c.ph||!h.cancelled)return;
    const cred=credentials(c);
    if(cred.id!==h.id)return;
    const holds=u?.HOLDS?.()||[];
    const worker=u?.CANDS?.find(w=>w.n===h.worker&&w.co===h.nationality);
    const local=worker?.hold;
    if(local?.ph===c.ph){
      const i=holds.indexOf(local);
      if(i>=0)holds.splice(i,1);
      local.st='done';delete worker.hold;worker.s='متاحة';
    }
    localStorage.setItem('z13my:'+c.ph,JSON.stringify(previousIds(c).filter(id=>id!==h.id)));
    stock=null;fetched=0;delete cred.id;localStorage.setItem(keyFor(c),JSON.stringify(cred));
    window.XP_HOST?.reopen?.();
  }
  async function cancel() {
    const c=current();if(!c)throw Error('سجّل الدخول لإلغاء حجزك');
    const cred=credentials(c),ids=previousIds(c);
    if(!cred.id&&ids.length){
      const prior=await call('asayel_resume_legacy',{p_ids:ids,p_phone:c.ph,p_key:cred.key});
      if(!prior)throw Error('تعذّر تحديد الحجز الحالي. حدّث الصفحة وأعد المحاولة.');
      cred.id=prior.id;localStorage.setItem(keyFor(c),JSON.stringify(cred));
    }
    if(!cred.id)return null;
    return call('asayel_cancel_booking',{p_id:cred.id,p_key:cred.key});
  }
  async function load(el) {
    const mode=el.dataset.mode;
    if(mode==='customer') {
      const c=current(); if(!c) return;
      const cred=credentials(c);
      el.bookings=await call('asayel_my_bookings',{p_key:cred.key});
      if(!cred.id&&el.bookings.length){cred.id=el.bookings[0].id;localStorage.setItem(keyFor(c),JSON.stringify(cred));}
      if(!cred.id) {
        const prior=await call('asayel_resume_legacy',{p_ids:previousIds(c),p_phone:c.ph,p_key:cred.key});
        if(!prior){el.hidden=true;return;}
        cred.id=prior.id;localStorage.setItem(keyFor(c),JSON.stringify(cred));
      }
      el.h=await call('asayel_visa',{p_action:'read',p_id:cred.id,p_key:cred.key});
      const h=el.h, u=window.XP_U;
      if(!el.isConnected || current()?.ph!==c.ph)return;
      if(h.cancelled){release(h);return;}
      if(!h.cancelled&&!h.expired&&u?.HOLDS&&u?.CANDS) {
        const i=u.CANDS.findIndex(w=>w.n===h.worker&&w.co===h.nationality);
        const holds=u.HOLDS();
        const local=holds.find(x=>x.ph===c.ph&&x.ci===i&&x.st!=='done');
        if(i>=0&&!local){
          const restored={bookingId:h.id,ci:i,cn:h.customer,ph:h.phone,visa:h.visa||'',at:Date.parse(h.expires)-72*3600000,st:'held'};
          holds.unshift(restored);u.CANDS[i].hold=restored;u.CANDS[i].s='محجوزة لعميل';
          window.XP_HOST?.reopen?.();return;
        }
        if(local){local.visa=h.visa||'';local.bookingId=h.id;}
      }
    } else el.data=await call('asayel_desk',{p_view:mode},true);
    paint(el);
  }
  function paint(el) {
    const mode=el.dataset.mode;
    let body;
    if(mode==='customer') {
      body=(el.bookings?.length>1?'<label>اختر الحجز<select data-current-booking>'+el.bookings.map(b=>'<option value="'+esc(b.id)+'" '+(b.id===el.h.id?'selected':'')+'>'+esc(b.ref)+' · '+esc(b.worker)+'</option>').join('')+'</select></label>':'')+customerPanel(el.h,el.choice);
      if(location.hash==='#/RecMy') {
        const oldCancel=document.querySelector('#app [data-act="rmycancel"]');
        if(oldCancel)oldCancel.hidden=true;
        if(!el.h.linked_at&&!el.h.cancelled&&!el.h.expired)body+=button('cancel','إلغاء الحجز');
      }
      if(location.hash==='#/RecMy') {
        const card=document.querySelector('#app .kwa')?.closest('section.rcd');
        if(card)card.hidden=!el.h.visa&&!el.h.cancelled&&!el.h.expired;
      }
    }
    if(mode==='queue') body='<h2>طلبات التأشيرات والمساعدة</h2>'+ (el.data.rows.map(h=>staffRow(h,el.data,el.selected)).join('')||'<p>لا توجد طلبات.</p>');
    if(mode==='permissions') body='<h2>'+permission+'</h2>'+el.data.map(u=>'<label class="av-perm"><input type="checkbox" data-employee="'+esc(u.id)+'" '+(u.enabled?'checked':'')+'>'+esc(u.name)+'</label>').join('');
    if(mode==='audit') body='<h2>سجل تأشيرات الاستقدام</h2>'+ (el.data.map(r=>'<p>'+esc(r.employee)+' · '+esc(r.action)+' · '+esc(r.booking)+' · '+esc(when(r.happened_at))+'</p>').join('')||'<p>لا توجد عمليات مسجّلة.</p>');
    el.innerHTML=body+'<p class="av-msg" role="alert"></p>';
  }
  function message(el,text) {
    let msg=el.querySelector('.av-msg');
    if(!msg){msg=document.createElement('p');msg.className='av-msg';msg.setAttribute('role','alert');el.append(msg);}
    msg.textContent=text;
  }
  async function mutate(el,action,id,number) {
    if(el.busy) return;
    const staff=el.dataset.mode!=='customer';
    el.busy=true;
    try {
      const data=await call('asayel_visa',{p_action:action,p_id:id,p_number:number||null,p_key:staff?null:credentials(current()).key},staff);
      el.choice=null;el.selected=null;
      if(staff) await load(el); else {el.h=data;paint(el);}
      if(data.conflict) message(el,'سبق حفظ رقم مختلف. احتُفظ بالرقم '+data.visa+'، يرجى مراجعته قبل أي تغيير.');
    } catch(e){message(el,e.message);} finally {el.busy=false;}
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('.av-panel [data-v]');if(!b)return;
    const el=b.closest('.av-panel'), action=b.dataset.v, id=b.closest('[data-booking]')?.dataset.booking;
    if(/^\d$/.test(action)){el.choice=action;paint(el);el.querySelector('input[name=number]')?.focus();}
    if(action==='cancel')window.XP_U.ACT.rmycancel(b);
    if(action==='help') mutate(el,'help',el.h.id);
    if(action==='edit'){el.selected=id;paint(el);el.querySelector('input[name=number]')?.focus();}
    if(action==='link')mutate(el,'link',id);
    if(action==='retry')load(el).catch(err=>message(el,err.message));
  });
  document.addEventListener('submit',e=>{
    if(!e.target.matches('[data-visa-form]'))return;
    e.preventDefault();const el=e.target.closest('.av-panel');
    mutate(el,'save',e.target.closest('[data-booking]')?.dataset.booking||el.h.id,e.target.elements.number.value);
  });
  document.addEventListener('change',async e=>{
    const box=e.target;
    if(box.matches('[data-current-booking]')){
      const c=current(),cred=credentials(c);cred.id=box.value;localStorage.setItem(keyFor(c),JSON.stringify(cred));
      window.XP_HOST.reopen();return;
    }
    if(!box.matches('.av-panel [data-employee]'))return;
    const el=box.closest('.av-panel');box.disabled=true;
    try{el.data=await call('asayel_desk',{p_view:'permissions',p_employee:box.dataset.employee,p_enable:box.checked},true);paint(el);}
    catch(err){box.checked=!box.checked;box.disabled=false;message(el,err.message);}
  });
  const modes={RecMy:'customer',CustHome:'customer',RecHolds:'queue',Recruitment:'queue',RecOrders:'queue',Staff:'permissions',AuditLog:'audit'};
  const mainCities=new Set('الرياض|مكة المكرمة|جدة|الطائف|المدينة المنورة|الدمام|الخبر|أبها|نجران|جازان|الباحة|بريدة|حائل|تبوك|سكاكا|عرعر'.split('|'));
  function limitArrivalCities() {
    const select=document.querySelector('#xdr select#z17dest');
    if(!select||select.dataset.mainCities)return;
    const value=select.value;
    const options=Array.from(select.options).filter(o=>!o.value||mainCities.has(o.value));
    if(!options.some(o=>o.value))return;
    select.dataset.mainCities='1';
    select.replaceChildren(...options);
    select.value=mainCities.has(value)?value:'';
  }
  function mount() {
    limitArrivalCities();
    const mode=modes[location.hash.slice(2)];
    const host=document.querySelector('#app .xmn') || document.querySelector('#app main');
    if(!host||!mode||host.querySelector('.av-panel[data-mode]'))return;
    if(mode==='customer'&&(!current()||(!credentials(current()).id&&!previousIds(current()).length)))return;
    const el=document.createElement('section');el.className='av-panel';el.dir='rtl';el.dataset.mode=mode;
    host.prepend(el);load(el).catch(err=>{message(el,err.message);el.insertAdjacentHTML('beforeend',button('retry','إعادة المحاولة'));});
  }
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',()=>{const el=document.querySelector('.av-panel[data-mode]');if(el&&!el.busy&&!el.querySelector('input:focus'))load(el).catch(e=>message(el,e.message));});
  const clinicRoutes = {Staff:'permissions',VisaTrack:'queue',Recruitment:'queue',Candidates:'catalog'};
  const profileFields={n:'الاسم',pp:'الجواز',co:'الجنسية',age:'العمر',ex:'سنوات الخبرة',lg:'اللغات',sk:'المهارات',sal:'الراتب',ag:'المكتب',rel:'الديانة',ms:'الحالة الاجتماعية'};
  const medical=(action,args={})=>call('asayel_medical',{p_action:action,...args},true);
  const actionButton=(key,label)=>'<button type="button" data-med="'+key+'">'+label+'</button>';
  function medicalRows(data) {
    return data.rows.map(row=>{
      const stage={medical:'بانتظار نتيجة الفحص',rejected:'رُفض الفحص · بانتظار البديلة',visa:'اجتازت الفحص · في التفييز'}[row.stage];
      const exam=row.stage==='medical'&&data.examine;
      const replace=row.stage==='rejected'&&data.replace;
      return '<article data-order="'+esc(row.id)+'"><h3>'+esc(row.worker_name)+' · '+esc(row.nat)+'</h3><p>الحجز '+esc(row.ref)+' · '+stage+'</p>'+
        (row.passport?'<p>الجواز المسجّل '+esc(row.passport)+'</p>':'')+
        (exam||replace?'<label>'+ (replace?'رقم جواز البديلة':'رقم جواز العاملة عند رفض الفحص')+'<input dir="ltr" data-pass maxlength="24"></label>':'')+
        (exam?actionButton('pass','اجتازت الفحص · الانتقال إلى التفييز')+actionButton('reject','رُفض الفحص · إرسال الجواز للمتابعة'):'')+
        (replace?actionButton('lookup','عرض السيرة برقم الجواز')+'<div data-profile></div>':'')+'</article>';
    }).join('')||'<p>لا توجد حجوزات في هذه المرحلة.</p>';
  }
  async function clinicLoad(el,mode){
    if(mode==='permissions'){
      const rows=await medical('permissions');
      el.innerHTML='<h2>صلاحية استبدال عاملة بعد رفض الفحص</h2>'+rows.map(s=>'<label class="av-perm"><input type="checkbox" data-delegate="'+esc(s.id)+'" '+(s.enabled?'checked':'')+'>'+esc(s.name)+'</label>').join('');
    } else if(mode==='catalog'){
      await medical('permissions');
      const workers=(window.XP_U?.CANDS||[]).filter(w=>w.pp);
      const profiles=workers.map(w=>Object.fromEntries([...Object.keys(profileFields),'s'].map(k=>[k,w[k]??''])));
      if(profiles.length)await medical('catalog',{p_data:profiles});
      el.innerHTML='<h2>سجل جوازات السير الذاتية</h2><p>السير ذات الجواز المتاحة للمزامنة من هذا الجهاز: '+profiles.length+'</p>'+actionButton('sync','مزامنة السير للمتابعة');
    } else {
      const data=await medical('queue');
      el.innerHTML='<h2>متابعة الفحص والتفييز</h2>'+medicalRows(data);
    }
  }
  function clinicMount(){
    const mode=clinicRoutes[location.hash.slice(2)],host=document.querySelector('#app .xmn, #app main');
    if(!mode||!host||host.querySelector('.medical-panel')||!localStorage.getItem('asayel-chat'))return;
    const el=document.createElement('section');el.className='av-panel medical-panel';el.dataset.clinic=mode;el.dir='rtl';host.append(el);
    clinicLoad(el,mode).catch(e=>message(el,e.message));
  }
  document.addEventListener('change',async e=>{
    const box=e.target.closest('[data-delegate]');if(!box)return;
    box.disabled=true;
    try{await medical('grant',{p_id:box.dataset.delegate,p_data:box.checked});}
    catch(err){box.checked=!box.checked;message(box.closest('section'),err.message);}
    finally{box.disabled=false;}
  });
  document.addEventListener('input',e=>{
    if(e.target.matches('[data-pass]'))e.target.closest('article').querySelector('[data-profile]')?.replaceChildren();
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-med]');if(!b)return;
    const el=b.closest('.medical-panel'),row=b.closest('article'),act=b.dataset.med;
    if(el.busy)return;
    el.busy=true;b.disabled=true;
    try{
      if(act==='sync'){await clinicLoad(el,'catalog');return;}
      const input=row.querySelector('[data-pass]'),pp=input.value.trim().toUpperCase();
      if(act!=='pass'&&!pp)throw Error('أدخل رقم الجواز أولًا');
      const data=await medical(act,{p_id:row.dataset.order,p_passport:act==='pass'?null:pp});
      if(act==='lookup'){
        if(input.value.trim().toUpperCase()!==pp)return;
        row.querySelector('[data-profile]').innerHTML='<dl>'+Object.entries(profileFields).map(([key,label])=>'<div><dt>'+label+'</dt><dd>'+esc(data[key]||'—')+'</dd></div>').join('')+'</dl>'+actionButton('replace','اعتماد البديلة على نفس التأشيرة');
      }else await clinicLoad(el,'queue');
    }catch(err){message(el,err.message);}finally{el.busy=false;b.disabled=false;}
  });
  let stock=null,fetching=false,fetched=0,retryAt=0;
  function showStock(){
    const route=location.hash.slice(2);
    if(route==='RecCVs'){
      for(const b of document.querySelectorAll('#app [data-act="rhold"]')){
        const w=window.XP_U?.CANDS?.[b.dataset.i],card=b.closest('article');
        if(card&&w)card.toggleAttribute('data-stock-hidden',!stock||stock.recruitment.some(r=>r.worker===w.n&&r.nat===w.co));
      }
    }
    if(route==='AvailableWorkers'&&stock){
      const host=document.querySelector('#app .xmn,#app main')||document.querySelector('#app');
      if(!host)return;
      let panel=host.querySelector('[data-rental-list]');
      const period=r=>({d:'يوم',w:'أسبوع',m:'شهر',h:r.hours+' ساعات'}[r.dur]);
      const markup=stock.rent.map(r=>'<article><b>'+esc(r.name)+' · '+esc(r.nat)+'</b><p>محجوزة لمدة '+esc(period(r))+' · من '+esc(r.start_date)+' إلى '+esc(r.end_date)+'</p></article>').join('');
      if(!panel&&markup){panel=document.createElement('section');panel.className='av-panel';panel.dataset.rentalList='';host.prepend(panel);}
      if(panel&&panel.dataset.content!==markup){panel.innerHTML=markup?'<h2>فترات حجز عاملات الإيجار</h2>'+markup:'';panel.dataset.content=markup;}
      for(const r of stock.rent){
        const root=host.querySelectorAll('article,.xcvc,[data-worker-id]');
        for(const card of root){
          if(panel?.contains(card))continue;
          const exact=[...card.querySelectorAll('h2,h3,b,strong')].some(n=>n.textContent.trim()===r.name);
          if(card.dataset.workerId!==r.id&&!(exact&&card.textContent.includes(r.nat)))continue;
          if(card.querySelector('[data-rental-period="'+r.id+'-'+r.start_date+'"]'))continue;
          const badge=document.createElement('p');badge.dataset.rentalPeriod=r.id+'-'+r.start_date;badge.textContent='محجوزة لمدة '+period(r)+' · '+r.start_date+' — '+r.end_date;card.append(badge);
        }
      }
    }
  }
  async function inventory(){
    if(!['#/RecCVs','#/AvailableWorkers'].includes(location.hash))return;
    showStock();
    if(fetching||Date.now()-fetched<5000||Date.now()<retryAt)return;
    fetching=true;
    try{stock=await call('asayel_availability',{});fetched=Date.now();showStock();}
    catch{retryAt=Date.now()+5000;}
    finally{fetching=false;}
  }
  const stockStyle=document.createElement('style');
  stockStyle.textContent='[data-stock-hidden]{display:none!important}.medical-panel button{margin:4px}.medical-panel input:not([type=checkbox]){display:block;max-width:100%}';
  document.head.append(stockStyle);
  new MutationObserver(()=>{clinicMount();inventory();}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(()=>{if(!document.hidden)inventory();},5000);
  window.addEventListener('focus',()=>{fetched=0;inventory();});

  window.AsayelVisa={cancel,release,async reserve(c,worker) {
    const cred=credentials(c);
    const result=await call('asayel_reserve',{p_key:cred.key,p_customer:c.name,p_phone:c.ph,p_worker:worker.n,p_nat:worker.co,p_dest:window.XP_DEST||''});
    stock=null;fetched=0;cred.id=result.id;localStorage.setItem(keyFor(c),JSON.stringify(cred));return result;
  }};
})();

