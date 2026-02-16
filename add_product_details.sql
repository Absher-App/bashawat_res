-- إضافة عمود تفاصيل المنتج (للعرض عند تمرير الماوس)
ALTER TABLE products ADD COLUMN IF NOT EXISTS details TEXT DEFAULT NULL;
-- إذا كان خادم MySQL لا يدعم IF NOT EXISTS:
-- ALTER TABLE products ADD COLUMN details TEXT DEFAULT NULL;
