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

// إعداد ملفات الاستاتيك أولاً (قبل أي middleware) - مهم لتحميل CSS و JS على السيرفر
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// نسخة للملفات الثابتة - تتغير عند كل تشغيل لتفريغ الكاش (تحديث سريع بعد الرفع)
app.locals.assetVersion = Date.now();

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

// الصفحة الرئيسية - عرض المينو
app.get('/', async (req, res) => {
    try {
        let products = await queryDb('SELECT * FROM products ORDER BY id DESC');
        products = parseProductImages(products);
        const categories = await queryDb('SELECT * FROM categories');
        const slides = await queryDb('SELECT * FROM slides ORDER BY display_order');
        const stories = await queryDb('SELECT * FROM stories ORDER BY created_at DESC');
        const settings = await queryDb("SELECT * FROM settings WHERE setting_key = 'offer_banner'");
        
        const offer_text = settings.length > 0 ? settings[0].setting_value : '';

        res.render('index', { products, categories, slides, stories, offer_text, error: null });
    } catch (err) {
        console.error(err);
        res.render('index', { products: [], categories: [], slides: [], stories: [], offer_text: '', error: 'خطأ في جلب البيانات' });
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

        res.render('products', { products, categories, offer_text, error: null });
    } catch (err) {
        console.error(err);
        res.render('products', { products: [], categories: [], offer_text: '', error: 'خطأ في جلب البيانات' });
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
            if (!name || !category) continue;
            await queryDb('INSERT INTO products (name, description, details, price, category, image_url, images, is_cake) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [name, description, productDetails, price, category, image_url, imagesJson, is_cake]);
        }
        res.redirect('/admin/products');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/products');
    }
});

// إضافة منتج جديد (صور متعددة + أحجام/أوزان)
app.post('/admin/add-product', requireAuth, upload.array('images', 10), (req, res) => {
    const { name, description, details, price, category, variants_json, variant_type } = req.body;
    const files = req.files || [];
    const is_cake = req.body.is_cake === 'on' || req.body.is_cake === '1' ? 1 : 0;

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

    const query = 'INSERT INTO products (name, description, details, price, category, image_url, images, variant_type, variants, is_cake) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, description || '', details || '', finalPrice, category, image_url, imagesJson, variantTypeVal, variantsJson, is_cake], (err, result) => {
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
    const { name, description, details, price, category, existing_images, variants_json, variant_type } = req.body;
    const productId = req.params.id;
    const is_cake = req.body.is_cake === 'on' || req.body.is_cake === '1' ? 1 : 0;

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

    const query = 'UPDATE products SET name = ?, description = ?, details = ?, price = ?, category = ?, image_url = ?, images = ?, variant_type = ?, variants = ?, is_cake = ? WHERE id = ?';
    try {
        await queryDb(query, [name, description || '', details || '', price, category, image_url, imagesJson, variantTypeVal, variantsJson, is_cake, productId]);
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
    const { title, subtitle, link_url, display_order } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';

    const query = 'INSERT INTO slides (title, subtitle, image_url, link_url, display_order) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, subtitle, image_url, link_url, display_order || 0], (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/slider');
    });
});

// تحديث سلايد
app.post('/admin/update-slide/:id', requireAuth, upload.single('image'), (req, res) => {
    const { title, subtitle, link_url, display_order } = req.body;
    const slideId = req.params.id;
    let query, params;
    if (req.file) {
        const image_url = '/uploads/' + req.file.filename;
        query = 'UPDATE slides SET title = ?, subtitle = ?, link_url = ?, display_order = ?, image_url = ? WHERE id = ?';
        params = [title, subtitle, link_url, display_order || 0, image_url, slideId];
    } else {
        query = 'UPDATE slides SET title = ?, subtitle = ?, link_url = ?, display_order = ? WHERE id = ?';
        params = [title, subtitle, link_url, display_order || 0, slideId];
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
