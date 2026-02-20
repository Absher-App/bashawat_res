const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs');

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Debugging Environment Variables
console.log('--- Environment Variables Check ---');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : '0');
console.log('-----------------------------------');

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy when behind reverse proxy (Hostinger, Nginx) - ضروري لتحميل الملفات الثابتة
app.set('trust proxy', 1);

// robots.txt ديناميكي (قبل static حتى يُخدم من المسار)
app.get('/robots.txt', (req, res) => {
    const base = (process.env.SITE_URL || '').replace(/\/$/, '') || (req.protocol + '://' + req.get('host'));
    const body = `User-agent: *
Allow: /

Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;
    res.type('text/plain').send(body);
});

// إعداد ملفات الاستاتيك أولاً (قبل أي middleware) - مهم لتحميل CSS و JS على السيرفر
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// نسخة للملفات الثابتة - تتغير عند كل تشغيل لتفريغ الكاش (تحديث سريع بعد الرفع)
app.locals.assetVersion = Date.now();
// رابط الموقع للـ SEO (يُضاف في .env على الاستضافة: SITE_URL=https://yourdomain.com)
app.locals.siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

// إعداد body-parser المدمج في express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// إعداد اتصال قاعدة البيانات (Connection Pool)
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'u592434413_bagdash',
    password: process.env.DB_PASSWORD || 'Bagdash2024@Pass',
    database: process.env.DB_NAME || 'u592434413_bagdash',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// إعداد الجلسة - استخدام MySQL store لتجنب تحذير MemoryStore (يعمل في dev و production)
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({ ...dbConfig, createDatabaseTable: true });

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'bagdash_secret_key',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: process.env.NODE_ENV === 'production' }
};

app.use(session(sessionConfig));

// إعداد Multer لرفع الصور
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) // تسمية فريدة
    }
});
const upload = multer({ storage: storage });

console.log('Initializing DB Pool with:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    passwordLength: dbConfig.password ? dbConfig.password.length : 0
});

const pool = mysql.createPool(dbConfig);
const db = pool; // For backward compatibility with existing code

// Helper function to query database
function queryDb(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// تشغيل المايجريشن تلقائياً عند بدء السيرفر (لا يحتاج تيرمينال)
async function runAutoMigrations() {
    try {
        await queryDb("ALTER TABLE products ADD COLUMN details TEXT DEFAULT NULL");
        console.log('✓ تم إضافة عمود تفاصيل المنتج (details)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود details موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN is_cake TINYINT(1) DEFAULT 0");
        console.log('✓ تم إضافة عمود is_cake');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود is_cake موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN images TEXT DEFAULT NULL");
        console.log('✓ تم إضافة عمود صور متعددة (images)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود images موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN variant_type VARCHAR(50) DEFAULT NULL");
        console.log('✓ تم إضافة عمود variant_type (أحجام/أوزان)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود variant_type موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN variants TEXT DEFAULT NULL");
        console.log('✓ تم إضافة عمود variants (الأحجام/الأوزان والأسعار)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود variants موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN is_most_requested TINYINT(1) DEFAULT 0");
        console.log('✓ تم إضافة عمود is_most_requested (الأكثر طلباً)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود is_most_requested موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2) DEFAULT NULL");
        console.log('✓ تم إضافة عمود sale_price (سعر بعد الخصم)');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود sale_price موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
    try {
        await queryDb("ALTER TABLE slides ADD COLUMN button_text VARCHAR(255) DEFAULT NULL");
        console.log('✓ تم إضافة عمود button_text للسلايدر');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') console.log('✓ عمود button_text موجود مسبقاً');
        else console.error('تحذير:', err.message);
    }
}

// رفع صورة تصميم الكيك (لعملاء الموقع)
app.post('/api/upload-cake-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'لم يتم رفع أي ملف' });
    }
    const url = '/uploads/' + req.file.filename;
    res.json({ success: true, url });
});

// مساعد: تحويل صور المنتج والأحجام/الأوزان من JSON
function parseProductImages(products) {
    return (products || []).map(p => {
        let images = [];
        try {
            images = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [];
        } catch (e) {}
        if (!images.length && p.image_url) images = [p.image_url];
        p.images = images;

        let variants = [];
        try {
            variants = p.variants ? (typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants) : [];
        } catch (e) {}
        p.variants = variants;
        p.variant_type = p.variant_type || null;
        return p;
    });
}

// خيارات الكيك (أحجام، سبونج، حشوة، إضافة) من جدول الإعدادات
const DEFAULT_CAKE_OPTIONS = {
    sizes: ['صغير', 'وسط', 'كبير'],
    sponge: ['فانيلا', 'شوكولاتة', 'مشمش'],
    filling: ['كريمة', 'شوكولاتة', 'فراولة'],
    addon: ['بدون', 'فراولة', 'شوكولاتة']
};

async function getCakeOptions() {
    try {
        const rows = await queryDb(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('cake_sizes', 'cake_sponge', 'cake_filling', 'cake_addon')"
        );
        const opts = { ...DEFAULT_CAKE_OPTIONS };
        rows.forEach(r => {
            try {
                const arr = JSON.parse(r.setting_value || '[]');
                if (Array.isArray(arr) && arr.length > 0) {
                    if (r.setting_key === 'cake_sizes') opts.sizes = arr;
                    else if (r.setting_key === 'cake_sponge') opts.sponge = arr;
                    else if (r.setting_key === 'cake_filling') opts.filling = arr;
                    else if (r.setting_key === 'cake_addon') opts.addon = arr;
                }
            } catch (e) {}
        });
        return opts;
    } catch (err) {
        return { ...DEFAULT_CAKE_OPTIONS };
    }
}

// الصفحة الرئيسية - عرض المينو
app.get('/', async (req, res) => {
    try {
        let products = await queryDb('SELECT * FROM products ORDER BY id DESC');
        products = parseProductImages(products);
        let mostRequestedProducts = await queryDb('SELECT * FROM products WHERE is_most_requested = 1 ORDER BY id DESC');
        mostRequestedProducts = parseProductImages(mostRequestedProducts);
        const categories = await queryDb('SELECT * FROM categories');
        const slides = await queryDb('SELECT * FROM slides ORDER BY display_order');
        const stories = await queryDb('SELECT * FROM stories ORDER BY created_at DESC');
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key IN ('offer_banner', 'banner_1', 'banner_2')");
        const offer_text = (settings.find(s => s.setting_key === 'offer_banner') || {}).setting_value || '';
        const banner1 = (settings.find(s => s.setting_key === 'banner_1') || {}).setting_value || '';
        const banner2 = (settings.find(s => s.setting_key === 'banner_2') || {}).setting_value || '';
        const cakeOptions = await getCakeOptions();

        res.render('index', { products, mostRequestedProducts, categories, slides, stories, offer_text, banner1, banner2, cakeOptions, error: null });
    } catch (err) {
        console.error(err);
        const cakeOptions = await getCakeOptions().catch(() => ({ ...DEFAULT_CAKE_OPTIONS }));
        res.render('index', { products: [], mostRequestedProducts: [], categories: [], slides: [], stories: [], offer_text: '', banner1: '', banner2: '', cakeOptions, error: 'خطأ في جلب البيانات' });
    }
});

// صفحة المنتجات
app.get('/products', async (req, res) => {
    try {
        let products = await queryDb('SELECT * FROM products ORDER BY id DESC');
        products = parseProductImages(products);
        const categories = await queryDb('SELECT * FROM categories');
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key = 'offer_banner'");
        const offer_text = settings.length > 0 ? settings[0].setting_value : '';
        const cakeOptions = await getCakeOptions();

        res.render('products', { products, categories, offer_text, cakeOptions, error: null });
    } catch (err) {
        console.error(err);
        const cakeOptions = await getCakeOptions().catch(() => ({ ...DEFAULT_CAKE_OPTIONS }));
        res.render('products', { products: [], categories: [], offer_text: '', cakeOptions, error: 'خطأ في جلب البيانات' });
    }
});

// صفحة الحفلات
app.get('/parties', async (req, res) => {
    try {
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key = 'offer_banner'");
        const offer_text = settings.length > 0 ? settings[0].setting_value : '';
        res.render('parties', { offer_text });
    } catch (err) {
        res.render('parties', { offer_text: '' });
    }
});

// صفحة السلة
app.get('/cart', async (req, res) => {
    try {
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key = 'offer_banner'");
        const offer_text = settings.length > 0 ? settings[0].setting_value : '';
        res.render('cart', { offer_text });
    } catch (err) {
        res.render('cart', { offer_text: '' });
    }
});

// Middleware للتحقق من تسجيل الدخول
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// صفحة تسجيل الدخول
app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUser && password === adminPass) {
        req.session.userId = 1;
        req.session.username = username;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
});

// تسجيل الخروج
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

// خيارات الكيك — استخدام regex لأن Express 5 قد لا يطابق المسار الذي فيه شرطة
app.get(/^\/admin\/cake-options\/?$/i, (req, res) => res.redirect(302, '/admin/cakeoptions'));
app.get('/admin/cakeoptions', requireAuth, async (req, res) => {
    try {
        const cakeOptions = await getCakeOptions();
        return res.render('admin/cake-options', { cakeOptions, activePage: 'cake-options' });
    } catch (err) {
        console.error(err);
        return res.send('خطأ في جلب البيانات');
    }
});
app.post('/admin/cakeoptions', requireAuth, async (req, res) => {
    const { sizes, sponge, filling, addon } = req.body;
    const toArray = (v) => {
        if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
        if (typeof v === 'string') return v.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        return [];
    };
    const sizesArr = toArray(sizes);
    const spongeArr = toArray(sponge);
    const fillingArr = toArray(filling);
    const addonArr = toArray(addon);
    const query = "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?";
    try {
        await queryDb(query, ['cake_sizes', JSON.stringify(sizesArr.length ? sizesArr : DEFAULT_CAKE_OPTIONS.sizes), JSON.stringify(sizesArr.length ? sizesArr : DEFAULT_CAKE_OPTIONS.sizes)]);
        await queryDb(query, ['cake_sponge', JSON.stringify(spongeArr.length ? spongeArr : DEFAULT_CAKE_OPTIONS.sponge), JSON.stringify(spongeArr.length ? spongeArr : DEFAULT_CAKE_OPTIONS.sponge)]);
        await queryDb(query, ['cake_filling', JSON.stringify(fillingArr.length ? fillingArr : DEFAULT_CAKE_OPTIONS.filling), JSON.stringify(fillingArr.length ? fillingArr : DEFAULT_CAKE_OPTIONS.filling)]);
        await queryDb(query, ['cake_addon', JSON.stringify(addonArr.length ? addonArr : DEFAULT_CAKE_OPTIONS.addon), JSON.stringify(addonArr.length ? addonArr : DEFAULT_CAKE_OPTIONS.addon)]);
        res.redirect('/admin/cakeoptions');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cakeoptions');
    }
});
app.post(/^\/admin\/cake-options\/?$/i, requireAuth, async (req, res) => {
    const { sizes, sponge, filling, addon } = req.body;
    const toArray = (v) => {
        if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
        if (typeof v === 'string') return v.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
        return [];
    };
    const sizesArr = toArray(sizes);
    const spongeArr = toArray(sponge);
    const fillingArr = toArray(filling);
    const addonArr = toArray(addon);
    const query = "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?";
    try {
        await queryDb(query, ['cake_sizes', JSON.stringify(sizesArr.length ? sizesArr : DEFAULT_CAKE_OPTIONS.sizes), JSON.stringify(sizesArr.length ? sizesArr : DEFAULT_CAKE_OPTIONS.sizes)]);
        await queryDb(query, ['cake_sponge', JSON.stringify(spongeArr.length ? spongeArr : DEFAULT_CAKE_OPTIONS.sponge), JSON.stringify(spongeArr.length ? spongeArr : DEFAULT_CAKE_OPTIONS.sponge)]);
        await queryDb(query, ['cake_filling', JSON.stringify(fillingArr.length ? fillingArr : DEFAULT_CAKE_OPTIONS.filling), JSON.stringify(fillingArr.length ? fillingArr : DEFAULT_CAKE_OPTIONS.filling)]);
        await queryDb(query, ['cake_addon', JSON.stringify(addonArr.length ? addonArr : DEFAULT_CAKE_OPTIONS.addon), JSON.stringify(addonArr.length ? addonArr : DEFAULT_CAKE_OPTIONS.addon)]);
        res.redirect('/admin/cakeoptions');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/cakeoptions');
    }
});

// البانرين — مسجّل مبكراً مع regex لتفادي Cannot GET في Express 5
app.get(/^\/admin\/banners\/?$/i, requireAuth, async (req, res) => {
    try {
        const rows = await queryDb("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('banner_1', 'banner_2')");
        const banner1 = (rows.find(r => r.setting_key === 'banner_1') || {}).setting_value || '';
        const banner2 = (rows.find(r => r.setting_key === 'banner_2') || {}).setting_value || '';
        return res.render('admin/banners', { banner1, banner2, activePage: 'banners' });
    } catch (err) {
        console.error(err);
        return res.send('خطأ في جلب البيانات');
    }
});
app.post(/^\/admin\/banners\/?$/i, requireAuth, upload.fields([{ name: 'banner1', maxCount: 1 }, { name: 'banner2', maxCount: 1 }]), async (req, res) => {
    const query = "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?";
    try {
        const rows = await queryDb("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('banner_1', 'banner_2')");
        let banner1 = (rows.find(r => r.setting_key === 'banner_1') || {}).setting_value || '';
        let banner2 = (rows.find(r => r.setting_key === 'banner_2') || {}).setting_value || '';
        if (req.files && req.files['banner1'] && req.files['banner1'][0]) {
            banner1 = '/uploads/' + req.files['banner1'][0].filename;
            await queryDb(query, ['banner_1', banner1, banner1]);
        }
        if (req.files && req.files['banner2'] && req.files['banner2'][0]) {
            banner2 = '/uploads/' + req.files['banner2'][0].filename;
            await queryDb(query, ['banner_2', banner2, banner2]);
        }
        res.redirect('/admin/banners');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/banners');
    }
});

// لوحة التحكم - الرئيسية (الإحصائيات)
app.get('/admin', requireAuth, async (req, res) => {
    try {
        const productsCount = await queryDb('SELECT COUNT(*) as count FROM products');
        const categoriesCount = await queryDb('SELECT COUNT(*) as count FROM categories');
        const slidesCount = await queryDb('SELECT COUNT(*) as count FROM slides');
        const storiesCount = await queryDb('SELECT COUNT(*) as count FROM stories');
        const stats = {
            products: productsCount[0].count,
            categories: categoriesCount[0].count,
            slides: slidesCount[0].count,
            stories: storiesCount[0].count,
            orders: 150,
            customers: 1250,
            sales: 45000
        };

        res.render('admin/dashboard', { stats, activePage: 'dashboard' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

// إدارة المنتجات
app.get('/admin/products', requireAuth, async (req, res) => {
    try {
        const products = await queryDb('SELECT * FROM products ORDER BY id DESC');
        const categories = await queryDb('SELECT * FROM categories');
        res.render('admin/products', { products, categories, activePage: 'products' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

// إدارة التصنيفات
app.get('/admin/categories', requireAuth, async (req, res) => {
    try {
        const categories = await queryDb('SELECT * FROM categories');
        res.render('admin/categories', { categories, activePage: 'categories' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

// إدارة السلايدر
app.get('/admin/slider', requireAuth, async (req, res) => {
    try {
        const slides = await queryDb('SELECT * FROM slides ORDER BY display_order');
        res.render('admin/slider', { slides, activePage: 'slider' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

// إدارة الإعدادات (شريط العروض)
app.get('/admin/settings', requireAuth, async (req, res) => {
    try {
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key = 'offer_banner'");
        const offer_text = settings.length > 0 ? settings[0].setting_value : '';
        res.render('admin/settings', { offer_text, activePage: 'settings' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

// إضافة عدة منتجات دفعة واحدة
app.post('/admin/add-products-bulk', requireAuth, upload.array('images', 50), async (req, res) => {
    let names = req.body.names;
    let descriptions = req.body.descriptions;
    let details = req.body.details;
    let prices = req.body.prices;
    let categories = req.body.categories;
    const files = req.files || [];

    if (!Array.isArray(names)) names = names ? [names] : [];
    if (!Array.isArray(descriptions)) descriptions = descriptions ? [descriptions] : [];
    if (!Array.isArray(details)) details = details ? [details] : [];
    if (!Array.isArray(prices)) prices = prices ? [prices] : [];
    if (!Array.isArray(categories)) categories = categories ? [categories] : [];

    const count = Math.min(names.length, prices.length, categories.length, files.length);
    if (count === 0) return res.redirect('/admin/products');

    try {
        for (let i = 0; i < count; i++) {
            const name = (names[i] || '').trim();
            const description = (descriptions[i] || '').trim();
            const productDetails = (details[i] || '').trim();
            const price = parseFloat(prices[i]) || 0;
            const category = (categories[i] || '').trim();
            const image_url = files[i] ? '/uploads/' + files[i].filename : '';
            const imagesJson = image_url ? JSON.stringify([image_url]) : null;
            const is_cake = (req.body['is_cake_' + i] === '1') ? 1 : 0;
            const is_most_requested = (req.body['is_most_requested_' + i] === '1') ? 1 : 0;
            if (!name || !category) continue;
            await queryDb('INSERT INTO products (name, description, details, price, category, image_url, images, is_cake, is_most_requested) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, description, productDetails, price, category, image_url, imagesJson, is_cake, is_most_requested]);
        }
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/products');
    }
});

// إضافة منتج جديد (صور متعددة + أحجام/أوزان)
app.post('/admin/add-product', requireAuth, upload.array('images', 10), (req, res) => {
    const { name, description, details, price, category, variants_json, variant_type, sale_price } = req.body;
    const files = req.files || [];
    const is_cake = req.body.is_cake === 'on' || req.body.is_cake === '1' ? 1 : 0;
    const is_most_requested = req.body.is_most_requested === 'on' || req.body.is_most_requested === '1' ? 1 : 0;

    let image_url = '';
    const imagesArr = [];
    if (files.length > 0) {
        files.forEach(f => {
            const url = '/uploads/' + f.filename;
            imagesArr.push(url);
            if (!image_url) image_url = url;
        });
    }
    const imagesJson = imagesArr.length > 0 ? JSON.stringify(imagesArr) : null;

    let variantsJson = null;
    let variantTypeVal = null;
    let finalPrice = price;
    if (variants_json && req.body.has_variants === '1') {
        try {
            const v = typeof variants_json === 'string' ? JSON.parse(variants_json) : variants_json;
            if (Array.isArray(v) && v.length > 0) {
                variantsJson = JSON.stringify(v);
                variantTypeVal = (variant_type === 'weight' ? 'weight' : 'size');
                if (!finalPrice || parseFloat(finalPrice) === 0) {
                    const minP = Math.min(...v.map(x => parseFloat(x.price) || 0));
                    if (minP > 0) finalPrice = minP;
                }
            }
        } catch (e) {}
    }

    const salePriceVal = (sale_price != null && String(sale_price).trim() !== '') ? parseFloat(sale_price) : null;
    const query = 'INSERT INTO products (name, description, details, price, sale_price, category, image_url, images, variant_type, variants, is_cake, is_most_requested) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, description || '', details || '', finalPrice, salePriceVal, category, image_url, imagesJson, variantTypeVal, variantsJson, is_cake, is_most_requested], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/products');
    });
});

// حذف منتج
app.post('/admin/delete-product/:id', requireAuth, (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM products WHERE id = ?';
    db.query(query, [productId], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/products');
    });
});

// تحديث منتج (صور متعددة + أحجام/أوزان)
app.post('/admin/update-product/:id', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 9 }]), async (req, res) => {
    const { name, description, details, price, category, existing_images, variants_json, variant_type, sale_price } = req.body;
    const productId = req.params.id;
    const is_cake = req.body.is_cake === 'on' || req.body.is_cake === '1' ? 1 : 0;
    const is_most_requested = req.body.is_most_requested === 'on' || req.body.is_most_requested === '1' ? 1 : 0;

    let existingArr = [];
    if (existing_images) {
        try {
            existingArr = typeof existing_images === 'string' ? JSON.parse(existing_images) : (Array.isArray(existing_images) ? existing_images : []);
        } catch (e) { existingArr = []; }
    }

    const newUrls = [];
    if (req.files) {
        if (req.files['image'] && req.files['image'][0]) {
            newUrls.unshift('/uploads/' + req.files['image'][0].filename);
        }
        if (req.files['images']) {
            req.files['images'].forEach(f => newUrls.push('/uploads/' + f.filename));
        }
    }

    const allImages = [...existingArr, ...newUrls];
    const image_url = allImages.length > 0 ? allImages[0] : '';
    const imagesJson = allImages.length > 0 ? JSON.stringify(allImages) : null;

    let variantsJson = null;
    let variantTypeVal = null;
    if (variants_json && req.body.has_variants === '1') {
        try {
            const v = typeof variants_json === 'string' ? JSON.parse(variants_json) : variants_json;
            if (Array.isArray(v) && v.length > 0) {
                variantsJson = JSON.stringify(v);
                variantTypeVal = (variant_type === 'weight' ? 'weight' : 'size');
            }
        } catch (e) {}
    }

    const salePriceVal = (sale_price != null && String(sale_price).trim() !== '') ? parseFloat(sale_price) : null;
    const query = 'UPDATE products SET name = ?, description = ?, details = ?, price = ?, sale_price = ?, category = ?, image_url = ?, images = ?, variant_type = ?, variants = ?, is_cake = ?, is_most_requested = ? WHERE id = ?';
    try {
        await queryDb(query, [name, description || '', details || '', price, salePriceVal, category, image_url, imagesJson, variantTypeVal, variantsJson, is_cake, is_most_requested, productId]);
    } catch (err) { console.error(err); }
    res.redirect('/admin/products');
});

// إدارة الستوريات (Stories)
app.get('/admin/stories', requireAuth, async (req, res) => {
    try {
        const stories = await queryDb('SELECT * FROM stories ORDER BY created_at DESC');
        res.render('admin/stories', { stories, activePage: 'stories' });
    } catch (err) {
        console.error(err);
        res.send('خطأ في جلب البيانات');
    }
});

app.post('/admin/add-story', requireAuth, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'video', maxCount: 1 }]), (req, res) => {
    const { title } = req.body;
    
    if (!req.files || !req.files['cover'] || !req.files['video']) {
        return res.send('يجب رفع صورة الغلاف والفيديو');
    }

    const cover_url = '/uploads/' + req.files['cover'][0].filename;
    const video_url = '/uploads/' + req.files['video'][0].filename;

    const query = 'INSERT INTO stories (title, cover_url, video_url) VALUES (?, ?, ?)';
    db.query(query, [title, cover_url, video_url], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/stories');
    });
});

app.post('/admin/delete-story/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM stories WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/stories');
    });
});

// تحديث شريط العروض
app.post('/admin/update-offer', requireAuth, (req, res) => {
    const { offer_text } = req.body;
    const query = "INSERT INTO settings (setting_key, setting_value) VALUES ('offer_banner', ?) ON DUPLICATE KEY UPDATE setting_value = ?";
    db.query(query, [offer_text, offer_text], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/settings');
    });
});

// إضافة عدة تصنيفات دفعة واحدة
app.post('/admin/add-categories-bulk', requireAuth, async (req, res) => {
    let names = req.body.names;
    if (!Array.isArray(names)) names = names ? [names] : [];
    names = names.map(n => (n || '').trim()).filter(n => n.length > 0);
    if (names.length === 0) return res.redirect('/admin/categories');

    try {
        for (const name of names) {
            await queryDb('INSERT INTO categories (name) VALUES (?)', [name]);
        }
        res.redirect('/admin/categories');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/categories');
    }
});

// إضافة تصنيف
app.post('/admin/add-category', requireAuth, (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO categories (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/categories');
    });
});

// تحديث تصنيف
app.post('/admin/update-category/:id', requireAuth, (req, res) => {
    const { name } = req.body;
    const id = req.params.id;
    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    db.query(query, [name, id], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/categories');
    });
});

// حذف تصنيف
app.post('/admin/delete-category/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM categories WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/categories');
    });
});

// إضافة سلايد
app.post('/admin/add-slide', requireAuth, upload.single('image'), (req, res) => {
    const { title, subtitle, link_url, button_text, display_order } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';

    const query = 'INSERT INTO slides (title, subtitle, image_url, link_url, button_text, display_order) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [title, subtitle, image_url, link_url || null, (button_text && button_text.trim()) || null, display_order || 0], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/slider');
    });
});

// تحديث سلايد
app.post('/admin/update-slide/:id', requireAuth, upload.single('image'), (req, res) => {
    const { title, subtitle, link_url, button_text, display_order } = req.body;
    const slideId = req.params.id;
    const btnText = (button_text && button_text.trim()) || null;
    let query, params;
    if (req.file) {
        const image_url = '/uploads/' + req.file.filename;
        query = 'UPDATE slides SET title = ?, subtitle = ?, link_url = ?, button_text = ?, display_order = ?, image_url = ? WHERE id = ?';
        params = [title, subtitle, link_url || null, btnText, display_order || 0, image_url, slideId];
    } else {
        query = 'UPDATE slides SET title = ?, subtitle = ?, link_url = ?, button_text = ?, display_order = ? WHERE id = ?';
        params = [title, subtitle, link_url || null, btnText, display_order || 0, slideId];
    }
    db.query(query, params, (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/slider');
    });
});

// حذف سلايد
app.post('/admin/delete-slide/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM slides WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/slider');
    });
});

(async () => {
    await runAutoMigrations();
    app.listen(port, () => {
        console.log(`الخادم يعمل على الرابط: http://localhost:${port}`);
    });
})();
