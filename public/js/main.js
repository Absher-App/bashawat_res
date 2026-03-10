document.addEventListener('DOMContentLoaded', function() {
    // === Burger Drawer (موبايل) ===
    const burgerBtn = document.getElementById('burgerBtn');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawer = document.getElementById('drawer');
    const drawerClose = document.getElementById('drawerClose');

    function openDrawer() {
        document.body.classList.add('drawer-open');
        if (drawerOverlay) drawerOverlay.classList.add('is-open');
        if (drawer) drawer.classList.add('is-open');
        if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'false');
    }
    function closeDrawer() {
        document.body.classList.remove('drawer-open');
        if (drawerOverlay) drawerOverlay.classList.remove('is-open');
        if (drawer) drawer.classList.remove('is-open');
        if (drawerOverlay) drawerOverlay.setAttribute('aria-hidden', 'true');
    }

    if (burgerBtn) burgerBtn.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
    if (drawer) {
        drawer.querySelectorAll('.drawer-link').forEach(link => {
            link.addEventListener('click', closeDrawer);
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) closeDrawer();
    });

    // === Mobile Menu Toggle (fallback إذا وُجد mobile-menu قديم) ===
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navLinksContainer.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target) && !navLinksContainer.contains(e.target)) {
                navLinksContainer.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
            }
        });
        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
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

    // === Slider Logic — صورة واحدة بالمنتصف، التحريك يمين للصورة التالية ===
    const sliderTrack = document.getElementById('sliderTrack');
    const slides = document.querySelectorAll('.hero-slider .slide');
    const nextBtn = document.querySelector('.slider-next');
    const prevBtn = document.querySelector('.slider-prev');
    const dotsContainer = document.getElementById('sliderDots');
    let currentSlide = 0;
    let autoplayTimer = null;
    const AUTOPLAY_INTERVAL = 5000;

    function updateSlider() {
        if (!slides.length) return;
        const n = slides.length;
        currentSlide = (currentSlide % n + n) % n;

        if (sliderTrack) {
            const heroSlider = document.getElementById('heroSlider');
            if (heroSlider) heroSlider.style.setProperty('--slides-count', n);
            sliderTrack.style.width = (n * 100) + '%';
            const offsetPct = n > 0 ? (currentSlide * (100 / n)) : 0;
            sliderTrack.style.transform = `translateX(-${offsetPct}%)`;
        }
        if (dotsContainer) {
            dotsContainer.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
        }
    }

    function goNext() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
        resetAutoplay();
    }

    function goPrev() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
        resetAutoplay();
    }

    function resetAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = setInterval(goNext, AUTOPLAY_INTERVAL);
    }

    if (slides.length && sliderTrack) {
        const heroSliderEl = document.getElementById('heroSlider');
        if (heroSliderEl) heroSliderEl.style.setProperty('--slides-count', String(slides.length));
        if (nextBtn) nextBtn.addEventListener('click', goNext);
        if (prevBtn) prevBtn.addEventListener('click', goPrev);

        if (dotsContainer && slides.length > 1) {
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'شريحة ' + (i + 1));
                dot.addEventListener('click', () => {
                    currentSlide = i;
                    updateSlider();
                    resetAutoplay();
                });
                dotsContainer.appendChild(dot);
            });
        }
        updateSlider();
        if (slides.length > 1) autoplayTimer = setInterval(goNext, AUTOPLAY_INTERVAL);
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

    window.addToCart = function(product, selectedVariant) {
        if (isCakeProduct(product)) {
            openCakeModal(product);
            return;
        }

        if (product.variants && product.variants.length > 0 && !selectedVariant) {
            openVariantModal(product);
            return;
        }

        const cartItem = selectedVariant 
            ? { ...product, quantity: 1, selectedVariant: { name: selectedVariant.name, price: selectedVariant.price } }
            : { ...product, quantity: 1 };
        const itemPrice = selectedVariant ? selectedVariant.price : product.price;
        const matchFn = item => item.id === product.id && !item.cakeOptions && 
            (JSON.stringify(item.selectedVariant || {}) === JSON.stringify(cartItem.selectedVariant || {}));
        const existingItem = cart.find(matchFn);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push(cartItem);
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

    window.addIceCreamToCart = function(iceCup, flavors) {
        const cartItem = {
            type: 'ice_cream',
            id: 'ice_' + Date.now(),
            name: 'آيسكريم',
            quantity: 1,
            iceCup: { name_ar: iceCup.name_ar, price: iceCup.price, max_scoops: iceCup.max_scoops, imageUrl: iceCup.imageUrl || '' },
            flavors: flavors.map(function(name_ar) { return { name_ar }; })
        };
        cart.push(cartItem);
        saveCart();
    };

    window.openVariantModal = function(product) {
        window._pendingVariantProduct = product;
        const modal = document.getElementById('variantModal');
        const label = document.getElementById('variantModalLabel');
        const nameEl = document.getElementById('variantModalProductName');
        const listEl = document.getElementById('variantOptionsList');
        label.textContent = product.variant_type === 'weight' ? 'الوزن' : 'الحجم';
        nameEl.textContent = product.name;
        const sar = (window.__i18n && window.__i18n.sar) || 'ر.س';
        listEl.innerHTML = product.variants.map((v, i) => 
            '<label class="variant-option"><input type="radio" name="variant_sel" value="' + i + '"><span class="v-opt-name">' + v.name + '</span> <span class="v-opt-price">' + v.price + ' ' + sar + '</span></label>'
        ).join('');
        listEl.querySelector('input') && listEl.querySelector('input').setAttribute('checked', 'checked');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeVariantModal = function() {
        document.getElementById('variantModal').classList.remove('active');
        window._pendingVariantProduct = null;
        document.body.style.overflow = '';
    };

    (function initVariantModal() {
        const modal = document.getElementById('variantModal');
        const addBtn = document.getElementById('variantModalAddBtn');
        if (modal) {
            modal.addEventListener('click', function(e) { if (e.target === modal) closeVariantModal(); });
        }
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                const product = window._pendingVariantProduct;
                if (!product) return;
                const sel = document.querySelector('input[name="variant_sel"]:checked');
                if (!sel) return;
                const v = product.variants[parseInt(sel.value, 10)];
                addToCart(product, v);
                closeVariantModal();
            });
        }
    })();

    window.openCakeModal = function(product) {
        window._pendingCakeProduct = product;
        document.getElementById('cakeModalProductName').textContent = product.name;
        document.getElementById('cakeProductData').value = JSON.stringify(product);
        document.getElementById('cakeOrderForm').reset();
        document.getElementById('cakeFileName').textContent = '';

        const sizeSelect = document.getElementById('cakeSize');
        sizeSelect.innerHTML = '<option value="">اختر</option>';
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(function(v, i) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = v.name + ' - ' + v.price + ' ' + ((window.__i18n && window.__i18n.sar) || 'ر.س');
                sizeSelect.appendChild(opt);
            });
        } else {
            ['صغير', 'وسط', 'كبير'].forEach(function(s) {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                sizeSelect.appendChild(opt);
            });
        }

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

                const sizeVal = document.getElementById('cakeSize').value;
                const cakeOptions = {
                    size: product.variants && product.variants.length ? product.variants[parseInt(sizeVal, 10)].name : sizeVal,
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

                const selectedVariant = product.variants && product.variants.length ? product.variants[parseInt(sizeVal, 10)] : null;
                const cartItem = { ...product, quantity: 1, cakeOptions };
                if (selectedVariant) cartItem.selectedVariant = { name: selectedVariant.name, price: selectedVariant.price };
                cart.push(cartItem);
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
                const i18n = window.__i18n || {};
                const emptyTitle = i18n.cartEmpty || 'سلتك فارغة حالياً';
                const emptyDesc = i18n.cartEmptyDesc || 'لم تضف أي منتجات بعد. تصفح تشكيلتنا واختر ما يناسب ذوقك';
                const browseProducts = i18n.continueShopping || 'تصفح المنتجات';
                const backHome = i18n.backToHome || 'العودة للرئيسية';
            fullCartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon-wrap">
                        <i class="fas fa-shopping-basket"></i>
                    </div>
                    <h3>${emptyTitle}</h3>
                    <p>${emptyDesc}</p>
                    <div class="empty-cart-actions">
                        <a href="/products" class="empty-cart-btn primary">
                            <i class="fas fa-box-open"></i> ${browseProducts}
                        </a>
                        <a href="/" class="empty-cart-btn secondary">
                            <i class="fas fa-home"></i> ${backHome}
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
                let unitPrice;
                if (item.type === 'ice_cream' && item.iceCup) {
                    unitPrice = parseFloat(item.iceCup.price) || 0;
                } else {
                    unitPrice = item.selectedVariant ? item.selectedVariant.price : (item.sale_price != null && item.sale_price !== '' ? parseFloat(item.sale_price) : item.price);
                }
                total += unitPrice * item.quantity;

                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item-row');
                const baseUrl = window.location.origin;
                const mainImg = (item.images && item.images[0]) || item.image_url;
                const imgUrl = mainImg 
                    ? (mainImg.startsWith('http') ? mainImg : baseUrl + (mainImg.startsWith('/') ? '' : '/') + mainImg)
                    : 'https://via.placeholder.com/200x200?text=صورة';
                const safeName = (item.name || '').replace(/"/g, '&quot;');
                const sar = (window.__i18n && window.__i18n.sar) || 'ر.س';
                const variantInfo = item.selectedVariant ? '<div class="cart-item-variant"><small>' + item.selectedVariant.name + ' - ' + item.selectedVariant.price + ' ' + sar + '</small></div>' : '';
                const cakeInfo = item.cakeOptions ? '<div class="cart-item-cake-options"><small>' +
                    [item.cakeOptions.size && 'الحجم: ' + item.cakeOptions.size,
                     item.cakeOptions.sponge && 'السبونج: ' + item.cakeOptions.sponge,
                     item.cakeOptions.date && 'الموعد: ' + item.cakeOptions.date].filter(Boolean).join(' | ') +
                    '</small></div>' : '';
                const iceCreamInfo = (item.type === 'ice_cream' && item.iceCup && item.flavors) ? '<div class="cart-item-ice-cream"><small>كوب ' + item.iceCup.name_ar + ': ' + item.flavors.map(function(f) { return f.name_ar; }).join('، ') + '</small></div>' : '';
                const displayName = item.type === 'ice_cream' ? (item.name || 'آيسكريم') : item.name;
                const displayImg = item.type === 'ice_cream' && item.iceCup && item.iceCup.imageUrl
                    ? (item.iceCup.imageUrl.startsWith('http') ? item.iceCup.imageUrl : baseUrl + (item.iceCup.imageUrl.startsWith('/') ? '' : '/') + item.iceCup.imageUrl)
                    : (item.type === 'ice_cream' ? 'https://via.placeholder.com/200x200?text=🍦' : imgUrl);
                itemEl.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${displayImg}" alt="${safeName}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/200x200?text=صورة';this.onerror=null;">
                    </div>
                    
                    <div class="cart-item-details">
                        <h4 class="item-name">${displayName}</h4>
                        ${variantInfo}
                        ${iceCreamInfo}
                        <span class="item-price-unit">${unitPrice} ${sar} × ${item.quantity}</span>
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
                        ${(unitPrice * item.quantity).toFixed(2)} <small>${sar}</small>
                    </div>

                    <button onclick="removeItem(${index})" class="remove-btn" title="حذف المنتج">
                        <i class="far fa-trash-alt"></i>
                    </button>
                `;
                fullCartItemsContainer.appendChild(itemEl);
            });
        }

        const sar2 = (window.__i18n && window.__i18n.sar) || 'ر.س';
        if(subTotalElement) subTotalElement.textContent = total.toFixed(2) + ' ' + sar2;
        const taxEl = document.getElementById('taxAmount');
        if(taxEl) taxEl.textContent = '0.00 ' + sar2;
        if(finalTotalElement) finalTotalElement.textContent = total.toFixed(2) + ' ' + sar2;
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
                let unitPrice, lineName;
                if (item.type === 'ice_cream' && item.iceCup) {
                    unitPrice = parseFloat(item.iceCup.price) || 0;
                    const flavorsStr = item.flavors && item.flavors.length ? item.flavors.map(f => f.name_ar).join('، ') : '';
                    lineName = 'آيسكريم - كوب ' + item.iceCup.name_ar + (flavorsStr ? ': ' + flavorsStr : '');
                    if (item.iceCup.imageUrl) {
                        const cupImgUrl = item.iceCup.imageUrl.startsWith('http') ? item.iceCup.imageUrl : (baseUrl + (item.iceCup.imageUrl.startsWith('/') ? '' : '/') + item.iceCup.imageUrl);
                        message += `  • صورة الكوب: ${cupImgUrl}\n`;
                    }
                } else {
                    unitPrice = item.selectedVariant ? item.selectedVariant.price : (item.sale_price != null && item.sale_price !== '' ? parseFloat(item.sale_price) : item.price);
                    lineName = item.selectedVariant ? `${item.name} - ${item.selectedVariant.name}` : item.name;
                }
                const sarMsg = (window.__i18n && window.__i18n.sar) || 'ر.س';
                message += `- ${lineName} (${item.quantity}x): ${(unitPrice * item.quantity).toFixed(2)} ${sarMsg}\n`;
                if (item.cakeOptions) {
                    const co = item.cakeOptions;
                    if (co.size) message += `  • الحجم: ${co.size}\n`;
                    if (co.sponge) message += `  • السبونج: ${co.sponge}\n`;
                    if (co.filling) message += `  • الحشوة: ${co.filling}\n`;
                    if (co.addon) message += `  • الإضافة: ${co.addon}\n`;
                    if (co.date) message += `  • الموعد: ${co.date}\n`;
                    if (co.writing) message += `  • الكتابة على القاعدة: ${co.writing}\n`;
                    if (co.note) message += `  • ملاحظة: ${co.note}\n`;
                    if (co.imageUrl) {
                        const imgFullUrl = co.imageUrl.startsWith('http') ? co.imageUrl : (baseUrl + (co.imageUrl.startsWith('/') ? '' : '/') + co.imageUrl);
                        message += `  • 🖼️ صورة التصميم (اضغط الرابط لمشاهدة الصورة):\n     ${imgFullUrl}\n`;
                    }
                }
            });

            const total = cart.reduce((sum, item) => {
                const unitPrice = item.type === 'ice_cream' && item.iceCup ? parseFloat(item.iceCup.price) || 0 : (item.selectedVariant ? item.selectedVariant.price : (item.sale_price != null && item.sale_price !== '' ? parseFloat(item.sale_price) : item.price));
                return sum + (unitPrice * item.quantity);
            }, 0);
            const totalLabel = (window.__i18n && window.__i18n.totalLabel) || 'المجموع الكلي';
            const sarFinal = (window.__i18n && window.__i18n.sar) || 'ر.س';
            message += `\n*${totalLabel}: ${total.toFixed(2)} ${sarFinal}*`;
            message += "\n\nالرجاء تأكيد الطلب.";
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }

    // Initialize UI on load
    updateAllUI();

});
