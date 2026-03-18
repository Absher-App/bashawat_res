CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    image_url VARCHAR(255) NOT NULL,
    link_url VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (name) SELECT DISTINCT category FROM products WHERE category IS NOT NULL;

INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('offer_banner', '✨ عروض حصرية لفترة محدودة! اطلب الآن واحصل على توصيل مجاني للطلبات فوق 200 ريال 🔥');

INSERT INTO slides (title, subtitle, image_url, link_url, display_order) VALUES 
('أشهى المأكولات الشرقية', 'نكهات أصيلة وتجربة راقية', 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', '#products-section', 1),
('مشاوي تركية على الأصول', 'اختيارات متنوعة تناسب كل الأذواق', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', '/products', 2),
('مطعم الباشوات', 'انتعاش لا يقاوم في كل قضمة', 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', '#products-section', 3);
