# رابط التشغيل التجريبي — asail-almansora.vercel.app

- مشروع Vercel مستقل: `asail-almansora` (فريق team_W8Vwa4UcMeaZh7xTIWT0gPG1)، يُنشر بنفس ملفات asayel-demo لكن بملف `trial/p.js` مكان `p.js`.
- `trial/p.js` = نفس `p.js` + `window.XP_TRIAL=1` + تحميل z23 (وضع التجربة: الاستقدام فقط، رقم واتساب 0597841939، إخفاء الصفحات ذات البيانات الوهمية، شريط «نسخة تجريبية حتى 01/12/2026»، وإيقاف صفحات العملاء بعد التاريخ).
- الرابط القديم `asayel-demo.vercel.app` رجع كما كان (بدون z23)، والرابطان يستخدمان نفس قاعدة Supabase.
- مشروع `asayel-mansoura` أُنشئ بالخطأ قبل اختيار الاسم وهو موقوف (paused).
- تذكير انتهاء التجربة مجدول يوم 29/11/2026.
- **طريقة النشر (من 17/11/2026):** فرع `deploy/trial` = `main` مع `trial/p.js` مكان `p.js`، ويُنشر منه مشروع asail-almansora (gitSource). النشر السابق بالملفات كان ناقصًا (r.js وbooking-*.js وindex.html قديم)، فظهرت صفحة دخول العملاء القديمة (زر نفاذ، ألوان مختلفة، و«تسجيل جديد» لا يعمل).
- عند أي تحديث: `git checkout -B deploy/trial origin/main && cp trial/p.js p.js && git commit -am ... && git push -f origin deploy/trial` ثم نشر asail-almansora من هذا الفرع.

## تسريع الفتح (حزمة الملفات)
كل الملفات المذكورة في `p.js` و`trial/p.js` مجمّعة في ملف واحد `pb.<hash>.js` يُقرأ بطلب واحد ويُحفظ في المتصفح.
بعد تعديل أي ملف أو تغيير نسخته في `p.js`: شغّل `python3 tools/build-bundle.py` ثم ارفع.
إذا نُسي التجميع لا يتعطل شيء: الملف غير الموجود في الحزمة يُحمَّل منفصلًا كالسابق.
