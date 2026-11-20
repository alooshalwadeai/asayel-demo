#!/bin/bash
# يبني فرع deploy/saas = آخر main (نفس برنامج أصايل) + ملفات نسخة المكاتب، ثم يُنشر منه مشروع asayel-saas-preview
set -e
cd "$(git rev-parse --show-toplevel)"
SRC=claude/saas-stage1
git fetch -q origin
git checkout -q -B deploy/saas origin/main
git checkout -q origin/$SRC -- saas
cp saas/vercel.json vercel.json
cp saas/signup.html signup.html
cp saas/preview/index.html isolation.html
python3 - <<'PY'
s = open('p.js').read()
end = s.index("\ntry{")
s = s[:end] + "L('saas/z25.js?v=" + __import__('hashlib').sha1(open('saas/z25.js','rb').read()).hexdigest()[:10] + "');" + s[end:]
open('p.js', 'w').write(s)
h = open('index.html').read()
i = h.index('<script')
v = __import__('hashlib').sha1(open('saas/boot.js','rb').read()).hexdigest()[:10]
h = h[:i] + '<script src="/saas/boot.js?v=' + v + '"></script>' + h[i:]
open('index.html', 'w').write(h)
PY
git add -A
git commit -q -m "نشر نسخة المكاتب (SaaS): main + saas/boot.js + saas/z25.js + signup.html

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01UVn8C55FLqost2mAaBqR4D"
git push -q -f origin deploy/saas
git rev-parse HEAD
