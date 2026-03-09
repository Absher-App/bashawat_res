# رفع المشروع إلى public_html

هذا الدليل يوضح كيف ترفع مشروع حلويات بقداش (Node.js) إلى مجلد **public_html** على الاستضافة.

---

## ما الذي ترفعه؟

ارفع **كل** محتويات مشروع bagdash إلى داخل **public_html** (بحيث يكون `server.js` و `package.json` مباشرة داخل `public_html`، وليس داخل مجلد فرعي).

### هيكل المجلد بعد الرفع (داخل public_html):

```
public_html/
├── server.js
├── package.json
├── package-lock.json
├── .env          ← أنشئه على السيرفر وأضف المتغيرات (انظر أدناه)
├── views/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── uploads/  ← احتفظ بالمحتوى الموجود إن وُجد؛ لا تستبدله
├── node_modules/ ← يُنشأ بعد تشغيل npm install على السيرفر
└── ... (باقي الملفات والمجلدات)
```

---

## طريقة الرفع

### 1) عبر مدير الملفات (File Manager)

1. ادخل إلى **public_html**.
2. احذف أو انقل أي ملفات قديمة إن لزم (احتفظ بـ **public/uploads** إن كان فيه صور ولا تستبدله).
3. ارفع الملفات كالتالي:
   - إما ضغط المشروع على جهازك (بدون `node_modules` وبدون `.env`) ثم رفع الملف المضغوط وفكّه داخل `public_html`.
   - أو رفع المجلدات والملفات واحداً واحداً: `server.js`, `package.json`, مجلد `views`, مجلد `public`, إلخ.

### 2) عبر Git (إن كان متاحاً على السيرفر)

من الطرفية على السيرفر:

```bash
cd public_html
git clone https://github.com/ahmadghneem540/bagdash.git .
# أو إن كان المستودع موجوداً مسبقاً:
git pull origin main
```

ثم أنشئ ملف `.env` وأضف المتغيرات (انظر أدناه).

---

## بعد الرفع: إعداد المشروع داخل public_html

### 1) إنشاء ملف `.env` داخل public_html

أنشئ ملفاً اسمه `.env` في نفس مكان `server.js` (داخل `public_html`) وأضف مثلاً:

```env
DB_HOST=127.0.0.1
DB_USER=u592434413_bagdash
DB_PASSWORD=Bagdash2024@Pass
DB_NAME=u592434413_bagdash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=bagdash_secure_key_2024
SITE_URL=https://bagdashsweets.com
```

غيّر القيم حسب إعدادات قاعدة البيانات والدومين عندك.

### 2) تثبيت الحزم وتشغيل التطبيق

- إن كانت الاستضافة توفّر **طرفية (SSH)**:

```bash
cd public_html
npm install
node server.js
# أو استخدم pm2 إن كان متاحاً:
# pm2 start server.js --name bagdash
```

- إن لم تتوفر طرفية، استخدم من **لوحة Node.js** في الاستضافة:
  - **Application root** أو **جذر التطبيق**: اختر مجلد **public_html** (أو المسار الكامل له).
  - **Run command** أو **أمر التشغيل**: `node server.js` أو `npm start`.
  - اضغط **Install Dependencies** (إن وُجد) ثم **Start** أو **Restart**.

---

## تشغيل Node من public_html في لوحة الاستضافة

1. من لوحة التحكم (هوستنجر أو غيرها)، ادخل إلى **تطبيقات Node.js** أو **Node.js**.
2. عند إنشاء التطبيق أو تعديله:
   - **Application root** / **جذر التطبيق**: اختر **public_html** (وليس مجلد `nodejs`).
3. احفظ ثم **أعد تشغيل (Restart)** التطبيق.

بهذا الشكل، التطبيق سيعمل من **public_html** كما طلبت.

---

## ملاحظات

- **لا ترفع** مجلد `node_modules` من جهازك؛ ثبّت الحزم على السيرفر بـ `npm install` داخل `public_html`.
- **لا ترفع** ملف `.env` من جهازك إذا كان فيه كلمات سر؛ أنشئ `.env` على السيرفر واملأ القيم هناك.
- مجلد **public/uploads** إن وُجد على السيرفر (صور، فيديوهات) **لا تستبدله** عند رفع تحديثات الكود؛ ارفع بقية الملفات فقط واحتفظ بمحتوى `uploads`.
