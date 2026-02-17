document.addEventListener('DOMContentLoaded', function() {
    // === Mobile Menu Toggle ===
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            
            // Toggle Icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinksContainer.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navLinksContainer.contains(e.target)) {
                navLinksContainer.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking a link
        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // === Navigation Active State Logic ===
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    // 1. Click Handler for Active Class
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove active from all
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add to clicked
            this.classList.add('active');
        });
    });

    // 2. Scroll Spy (Only on Homepage)
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });

            if(current === 'products-section') {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if(link.getAttribute('href').includes('products-section')) {
                        link.classList.add('active');
                    }
                });
            } else if (scrollY < 300) {
                 navLinks.forEach(link => {
                    link.classList.remove('active');
                    if(link.getAttribute('href') === '/' || link.getAttribute('href') === '/index.html') {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // === Slider Logic ===
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next-slide');
    const prevBtn = document.querySelector('.prev-slide');
    let currentSlide = 0;

    function showSlide(index) {
        if (!slides.length) return;
        slides.forEach(slide => slide.classList.remove('active'));
        
        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        slides[currentSlide].classList.add('active');
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
        prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
        setInterval(() => showSlide(currentSlide + 1), 5000);
    }

    // === Cart Logic & State ===
    // Replace with your actual WhatsApp number
    const PHONE_NUMBER = "966502975175"; 
    
    // Global Cart State
    let cart = JSON.parse(localStorage.getItem('bagdash_cart')) || [];

    // DOM Elements
    const cartBtn = document.getElementById('cartBtn'); // Floating button on index
    // const cartModal = document.getElementById('cartModal'); // REMOVED
    // const closeCart = document.getElementById('closeCart'); // REMOVED
    // const cartItemsContainer = document.getElementById('cartItems'); // REMOVED
    const cartCountElement = document.getElementById('cartCount'); // On floating btn
    
    // Page-Specific Elements (Cart Page)
    const fullCartItemsContainer = document.getElementById('fullCartItems');
    const subTotalElement = document.getElementById('subTotal');
    const finalTotalElement = document.getElementById('finalTotal');
    const pageCheckoutBtn = document.getElementById('pageCheckoutBtn');

    // === Core Functions ===

    // 1. Save Cart
    function saveCart() {
        localStorage.setItem('bagdash_cart', JSON.stringify(cart));
        updateAllUI();
    }

    // 2. Add Item (First Time)
    function isCakeProduct(product) {
        if (product.is_cake) return true;
        const cat = (product.category || '').trim();
        return ['كيك', 'كيكات'].some(c => cat.includes(c));
    }

    window.addToCart = function(product) {
        if (isCakeProduct(product)) {
            openCakeModal(product);
            return;
        }

        const existingItem = cart.find(item => item.id === product.id && !item.cakeOptions);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
            const card = document.querySelector(`.product-card[data-id="${product.id}"], .product-item[data-id="${product.id}"]`);
            if(card) {
                const img = card.querySelector('.product-image img');
                if(img) animateFlyToCart(img);
            }
        }
        
        const card = document.querySelector(`.product-card[data-id="${product.id}"], .product-item[data-id="${product.id}"]`);
        if(card) {
            const btn = card.querySelector('.add-to-cart-btn');
            if(btn) {
                const originalContent = btn.innerHTML;
                btn.classList.add('added');
                btn.innerHTML = '<i class="fas fa-check"></i> تم الإضافة';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = originalContent;
                }, 2000);
            }
        }

        saveCart();
    };

    window.openCakeModal = function(product) {
        window._pendingCakeProduct = product;
        document.getElementById('cakeModalProductName').textContent = product.name;
        document.getElementById('cakeProductData').value = JSON.stringify(product);
        document.getElementById('cakeOrderForm').reset();
        document.getElementById('cakeFileName').textContent = '';
        document.getElementById('cakeFormModal').classList.add('active');
    };

    window.closeCakeModal = function() {
        document.getElementById('cakeFormModal').classList.remove('active');
        window._pendingCakeProduct = null;
    };

    (function initCakeForm() {
        const cakeForm = document.getElementById('cakeOrderForm');
        const cakeModal = document.getElementById('cakeFormModal');
        if (cakeForm) {
            cakeForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const product = window._pendingCakeProduct;
                if (!product) return;

                const cakeOptions = {
                    size: document.getElementById('cakeSize').value,
                    sponge: document.getElementById('cakeSponge').value,
                    filling: document.getElementById('cakeFilling').value,
                    addon: document.getElementById('cakeAddon').value,
                    date: document.getElementById('cakeDate').value,
                    writing: document.getElementById('cakeWriting').value,
                    note: document.getElementById('cakeNote').value,
                    imageUrl: null
                };

                const fileInput = document.getElementById('cakeAttachment');
                if (fileInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    try {
                        const res = await fetch('/api/upload-cake-image', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) cakeOptions.imageUrl = data.url;
                    } catch (err) { console.error(err); }
                }

                cart.push({ ...product, quantity: 1, cakeOptions });
                saveCart();
                closeCakeModal();

                const card = document.querySelector(`.product-card[data-id="${product.id}"], .product-item[data-id="${product.id}"]`);
                if (card) {
                    const img = card.querySelector('.product-image img');
                    if (img) animateFlyToCart(img);
                }
            });
        }
        if (cakeModal) {
            cakeModal.addEventListener('click', function(e) {
                if (e.target === cakeModal) closeCakeModal();
            });
            const attInput = document.getElementById('cakeAttachment');
            if (attInput) attInput.addEventListener('change', function() {
                document.getElementById('cakeFileName').textContent = this.files[0] ? this.files[0].name : '';
            });
        }
    })();

    // Helper: Fly Animation - انيميشن طيران المنتج للسلة
    function animateFlyToCart(sourceElement) {
        if(!sourceElement) return;

        const clone = sourceElement.cloneNode(true);
        const rect = sourceElement.getBoundingClientRect();
        const cartBtn = document.getElementById('cartBtn');
        
        let targetRect;
        if(cartBtn && window.getComputedStyle(cartBtn).display !== 'none') {
            targetRect = cartBtn.getBoundingClientRect();
        } else {
            const topCart = document.querySelector('.nav-links a[href="/cart"]');
            if(topCart) targetRect = topCart.getBoundingClientRect();
            else targetRect = { top: 50, left: 50, width: 40, height: 40 };
        }

        const targetX = targetRect.left + (targetRect.width / 2) - 25;
        const targetY = targetRect.top + (targetRect.height / 2) - 25;

        clone.classList.add('fly-item');
        clone.style.cssText = 'position:fixed;top:' + rect.top + 'px;left:' + rect.left + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;z-index:99999;border-radius:12px;object-fit:cover;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,0.2);transition:all 0.7s cubic-bezier(0.25,0.46,0.45,0.94);';
        
        document.body.appendChild(clone);
        clone.offsetHeight;

        requestAnimationFrame(function() {
            clone.style.top = targetY + 'px';
            clone.style.left = targetX + 'px';
            clone.style.width = '50px';
            clone.style.height = '50px';
            clone.style.borderRadius = '50%';
            clone.style.opacity = '0.4';
        });

        setTimeout(function() {
            clone.remove();
            if(cartBtn) {
                cartBtn.style.transform = 'scale(1.25)';
                cartBtn.style.transition = 'transform 0.2s ease';
                setTimeout(function() { cartBtn.style.transform = 'scale(1)'; }, 200);
            }
        }, 750);
    }

    // 3. Update Quantity (From Card or Cart Page)
    window.updateItemQty = function(id, change) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex === -1) return;
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) cart.splice(itemIndex, 1);
        saveCart();
    };

    window.updateItemQtyByIndex = function(index, change) {
        if (index < 0 || index >= cart.length) return;
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        saveCart();
    };

    // 4. Remove Item Completely
    window.removeItem = function(index) {
        cart.splice(index, 1);
        saveCart();
    };

    // === UI Update Functions ===

    function updateAllUI() {
        updateFloatingCartBadge();
        updateProductCards();
        updateCartPage(); // Only if on cart page
    }

    // Update Floating Cart Badge (Index Page)
    function updateFloatingCartBadge() {
        let count = 0;
        cart.forEach(item => count += item.quantity);
        
        if(cartCountElement) {
            cartCountElement.textContent = count;
            // Hide badge if 0? Optional.
        }
        
        // Also update nav cart count if we add one later
    }

    // Update Cart Page (Cart Page Only)
    function updateCartPage() {
        if (!fullCartItemsContainer) return; // Not on cart page

        fullCartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            fullCartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon-wrap">
                        <i class="fas fa-shopping-basket"></i>
                    </div>
                    <h3>سلتك فارغة حالياً</h3>
                    <p>لم تضف أي منتجات بعد. تصفح تشكيلتنا واختر ما يناسب ذوقك</p>
                    <div class="empty-cart-actions">
                        <a href="/products" class="empty-cart-btn primary">
                            <i class="fas fa-box-open"></i> تصفح المنتجات
                        </a>
                        <a href="/" class="empty-cart-btn secondary">
                            <i class="fas fa-home"></i> العودة للرئيسية
                        </a>
                    </div>
                </div>
            `;
            const summarySection = document.querySelector('.cart-summary-section');
            if(summarySection) summarySection.style.display = 'none';
            const cartLayout = document.getElementById('cartLayout');
            if(cartLayout) cartLayout.classList.add('cart-is-empty');
            const sectionTitle = document.querySelector('.cart-section-title-products');
            if(sectionTitle) sectionTitle.style.display = 'none';

            if(pageCheckoutBtn) pageCheckoutBtn.disabled = true;
        } else {
            const summarySection = document.querySelector('.cart-summary-section');
            if(summarySection) summarySection.style.display = 'block';
            const cartLayout = document.getElementById('cartLayout');
            if(cartLayout) cartLayout.classList.remove('cart-is-empty');
            const sectionTitle = document.querySelector('.cart-section-title-products');
            if(sectionTitle) sectionTitle.style.display = 'flex';

            if(pageCheckoutBtn) pageCheckoutBtn.disabled = false;
            
            cart.forEach((item, index) => {
                total += item.price * item.quantity;

                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item-row');
                const baseUrl = window.location.origin;
                const imgUrl = item.image_url 
                    ? (item.image_url.startsWith('http') ? item.image_url : baseUrl + (item.image_url.startsWith('/') ? '' : '/') + item.image_url)
                    : 'https://via.placeholder.com/200x200?text=صورة';
                const safeName = (item.name || '').replace(/"/g, '&quot;');
                
                const cakeInfo = item.cakeOptions ? '<div class="cart-item-cake-options"><small>' +
                    [item.cakeOptions.size && 'الحجم: ' + item.cakeOptions.size,
                     item.cakeOptions.sponge && 'السبونج: ' + item.cakeOptions.sponge,
                     item.cakeOptions.date && 'الموعد: ' + item.cakeOptions.date].filter(Boolean).join(' | ') +
                    '</small></div>' : '';
                itemEl.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${imgUrl}" alt="${safeName}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/200x200?text=صورة';this.onerror=null;">
                    </div>
                    
                    <div class="cart-item-details">
                        <h4 class="item-name">${item.name}</h4>
                        <span class="item-price-unit">${item.price} ر.س × ${item.quantity}</span>
                        ${cakeInfo}
                    </div>

                    <div class="cart-item-actions">
                        <div class="qty-selector">
                            <button class="qty-btn minus" onclick="updateItemQtyByIndex(${index}, -1)"><i class="fas fa-minus"></i></button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn plus" onclick="updateItemQtyByIndex(${index}, 1)"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>

                    <div class="cart-item-subtotal">
                        ${(item.price * item.quantity).toFixed(2)} <small>ر.س</small>
                    </div>

                    <button onclick="removeItem(${index})" class="remove-btn" title="حذف المنتج">
                        <i class="far fa-trash-alt"></i>
                    </button>
                `;
                fullCartItemsContainer.appendChild(itemEl);
            });
        }

        if(subTotalElement) subTotalElement.textContent = total.toFixed(2) + ' ر.س';
        const taxEl = document.getElementById('taxAmount');
        if(taxEl) taxEl.textContent = '0.00 ر.س';
        if(finalTotalElement) finalTotalElement.textContent = total.toFixed(2) + ' ر.س';
    }

    // Update Product Cards (Switch between "Add" and "Qty Controls")
    function updateProductCards() {
        const cards = document.querySelectorAll('.product-card, .product-item');
        
        cards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const item = cart.find(i => i.id === id);
            
            const addBtn = card.querySelector('.add-to-cart-btn');
            const qtyWidget = card.querySelector('.qty-control-widget');
            const qtyDisplay = card.querySelector('.qty-display');

            if (item) {
                // Item is in cart -> Show controls
                if(addBtn) addBtn.style.display = 'none';
                if(qtyWidget) {
                    qtyWidget.style.display = 'flex';
                    qtyDisplay.textContent = item.quantity;
                }
                card.classList.add('in-cart');
            } else {
                // Item not in cart -> Show add button
                if(addBtn) addBtn.style.display = 'block';
                if(qtyWidget) qtyWidget.style.display = 'none';
                card.classList.remove('in-cart');
            }
        });
    }

    // === Event Listeners ===

    // Checkout Button (Cart Page)
    if(pageCheckoutBtn) {
        pageCheckoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;

            let message = "*طلب جديد من موقع حلويات بقداش* 🧁\n\n";
            message += "*تفاصيل الطلب:*\n";
            const baseUrl = window.location.origin;
            
            cart.forEach(item => {
                message += `- ${item.name} (${item.quantity}x): ${(item.price * item.quantity).toFixed(2)} ر.س\n`;
                if (item.cakeOptions) {
                    const co = item.cakeOptions;
                    if (co.size) message += `  • الحجم: ${co.size}\n`;
                    if (co.sponge) message += `  • السبونج: ${co.sponge}\n`;
                    if (co.filling) message += `  • الحشوة: ${co.filling}\n`;
                    if (co.addon) message += `  • الإضافة: ${co.addon}\n`;
                    if (co.date) message += `  • الموعد: ${co.date}\n`;
                    if (co.writing) message += `  • الكتابة على القاعدة: ${co.writing}\n`;
                    if (co.note) message += `  • ملاحظة: ${co.note}\n`;
                    if (co.imageUrl) message += `  • صورة التصميم: ${baseUrl}${co.imageUrl}\n`;
                }
            });

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            message += `\n*المجموع الكلي: ${total.toFixed(2)} ر.س*`;
            message += "\n\nالرجاء تأكيد الطلب.";
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }

    // Initialize UI on load
    updateAllUI();

});
