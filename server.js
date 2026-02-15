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

// إعداد الجلسة
app.use(session({
    secret: process.env.SESSION_SECRET || 'bagdash_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// إعداد body-parser المدمج في express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// إعداد ملفات الاستاتيك (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

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

// الصفحة الرئيسية - عرض المينو
app.get('/', async (req, res) => {
    try {
        const products = await queryDb('SELECT * FROM products ORDER BY id DESC');
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
        const products = await queryDb('SELECT * FROM products ORDER BY id DESC');
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
app.get('/parties', (req, res) => {
    res.render('parties');
});

// صفحة السلة
app.get('/cart', (req, res) => {
    res.render('cart');
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

// إضافة منتج جديد
app.post('/admin/add-product', requireAuth, upload.single('image'), (req, res) => {
    const { name, description, price, category } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : '';

    const query = 'INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, description, price, category, image_url], (err, result) => {
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

// تحديث منتج
app.post('/admin/update-product/:id', requireAuth, upload.single('image'), (req, res) => {
    const { name, description, price, category } = req.body;
    const productId = req.params.id;
    let query, params;
    if (req.file) {
        const image_url = '/uploads/' + req.file.filename;
        query = 'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?';
        params = [name, description, price, category, image_url, productId];
    } else {
        query = 'UPDATE products SET name = ?, description = ?, price = ?, category = ? WHERE id = ?';
        params = [name, description, price, category, productId];
    }
    db.query(query, params, (err, result) => {
        if (err) console.error(err);
        res.redirect('/admin/products');
    });
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

app.listen(port, () => {
    console.log(`الخادم يعمل على الرابط: http://localhost:${port}`);
});
