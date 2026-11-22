#!/usr/bin/env python3
"""تجميع ملفات البرنامج في ملف واحد لتسريع الفتح.

كان p.js يحمّل قرابة 40 ملفًا واحدًا بعد الآخر (كل ملف ينتظر الذي قبله)،
فيبقى «جارٍ فتح البرنامج…» عدة ثوانٍ في كل مرة.
هذا السكربت يجمع كل الملفات المذكورة في p.js وtrial/p.js في ملف واحد
pb.<hash>.js (JSON: اسم الملف ← نصه)، ويعدّل p.js وtrial/p.js ليقرآه بطلب واحد.

- أي ملف غير موجود في الحزمة (مثلاً أضافه زميل بعد آخر تجميع) يُحمَّل كالسابق، فلا يتعطل شيء.
- بعد تعديل أي ملف أو تغيير نسخته في p.js: شغّل  python3 tools/build-bundle.py  ثم ارفع.
"""
import hashlib, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PJS = ['p.js', 'trial/p.js']
LOADER_OLD = re.compile(r"(?:var B=null;try\{var bx=.*?\}catch\(e\)\{B=null\}\n?)?function L\(u\)\{.*?\}\}\n", re.S)


def key(u):
    return u.split('/')[-1]


def read(u):
    if u.startswith('http'):
        with urllib.request.urlopen(u) as r:
            return r.read().decode('utf-8')
    with open(os.path.join(ROOT, u.split('?')[0]), encoding='utf-8') as f:
        return f.read()


def main():
    urls = []
    for p in PJS:
        for u in re.findall(r"L\('([^']+)'\)", open(os.path.join(ROOT, p), encoding='utf-8').read()):
            if u not in urls and not u.startswith('saas/'):
                urls.append(u)
    bundle = {key(u): read(u) for u in urls}
    data = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
    h = hashlib.sha1(data.encode('utf-8')).hexdigest()[:10]
    name = 'pb.%s.js' % h
    for f in os.listdir(ROOT):
        if re.fullmatch(r'pb\.[0-9a-f]{10}\.js', f) and f != name:
            os.remove(os.path.join(ROOT, f))
    open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(data)
    loader = ("var B=null;try{var bx=new XMLHttpRequest();bx.open('GET','%s',false);bx.send();"
              "if(bx.status===200)B=JSON.parse(bx.responseText);}catch(e){B=null}\n"
              "function L(u){var k=u.split('/').pop(),c=B&&B[k];if(c==null){var x=new XMLHttpRequest();"
              "x.open('GET',u,false);x.send();if(x.status!==200)return;c=x.responseText;}"
              "{var s=document.createElement('script');s.textContent=c;document.head.appendChild(s);}}\n") % name
    for p in PJS:
        fp = os.path.join(ROOT, p)
        s = open(fp, encoding='utf-8').read()
        s2, n = LOADER_OLD.subn(lambda m: loader, s, count=1)
        if n != 1:
            sys.exit('لم أجد دالة L في ' + p)
        open(fp, 'w', encoding='utf-8').write(s2)
    print(name, len(urls), 'ملف', len(data), 'حرف')


if __name__ == '__main__':
    main()
