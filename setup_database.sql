-- هذا الملف يقوم بإنشاء قاعدة البيانات والمستخدم الجديد
-- يرجى تشغيل هذا الملف في برنامج إدارة قواعد البيانات لديك (مثل HeidiSQL أو phpMyAdmin)

-- 1. إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS sweets_shop;
USE sweets_shop;

-- 2. إنشاء جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. إدخال بيانات تجريبية
INSERT INTO products (name, description, price, image_url, category) VALUES 
('كنافة نابلسية', 'كنافة بالجبنة النابلسية الساخنة', 25.00, 'https://example.com/kunafa.jpg', 'حلويات شرقية'),
('بسبوسة بالقشطة', 'بسبوسة طرية محشوة بالقشطة الطازجة', 15.00, 'https://example.com/basbousa.jpg', 'حلويات شرقية'),
('تشيز كيك فراولة', 'تشيز كيك بارد مع صوص الفراولة', 18.00, 'https://example.com/cheesecake.jpg', 'كيك'),
('بقلاوة مشكل', 'صحن بقلاوة مشكل فاخر', 40.00, 'https://example.com/baklava.jpg', 'حلويات شرقية');

-- 4. إنشاء مستخدم خاص للموقع (لحل مشكلة الاتصال)
-- نقوم بإنشاء مستخدم اسمه 'bagdash_user' وكلمة المرور 'bagdash123'
CREATE USER IF NOT EXISTS 'bagdash_user'@'localhost' IDENTIFIED BY 'bagdash123';
GRANT ALL PRIVILEGES ON sweets_shop.* TO 'bagdash_user'@'localhost';
FLUSH PRIVILEGES;
