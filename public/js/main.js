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
    window.addToCart = function(product) {
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        // Animation feedback
        const card = document.querySelector(`.product-card[data-id="${product.id}"]`);
        if(card) {
            const img = card.querySelector('img');
            animateFlyToCart(img);

            // Button Feedback
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

    // Helper: Fly Animation
    function animateFlyToCart(sourceElement) {
        if(!sourceElement) return;

        // Clone the image
        const clone = sourceElement.cloneNode(true);
        const rect = sourceElement.getBoundingClientRect();
        const cartBtn = document.getElementById('cartBtn');
        
        // If cart button is not visible (e.g. desktop topbar), target the topbar cart link
        let targetRect;
        // Check if floating btn is visible
        if(cartBtn && window.getComputedStyle(cartBtn).display !== 'none') {
             targetRect = cartBtn.getBoundingClientRect();
        } else {
             // Fallback to topbar cart icon
             const topCart = document.querySelector('.nav-links a[href="/cart"] i');
             if(topCart) targetRect = topCart.getBoundingClientRect();
             else targetRect = { top: 50, left: 50, width: 0, height: 0 }; // Fallback
        }

        clone.classList.add('fly-item');
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        
        document.body.appendChild(clone);

        // Trigger animation
        setTimeout(() => {
            clone.style.top = `${targetRect.top}px`;
            clone.style.left = `${targetRect.left}px`;
            clone.style.width = '50px';
            clone.style.height = '50px';
            clone.style.opacity = '0.5';
        }, 10);

        // Cleanup
        setTimeout(() => {
            clone.remove();
            // Optional: Shake cart button
            if(cartBtn) {
                cartBtn.style.transform = 'scale(1.2)';
                setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
            }
        }, 810);
    }

    // 3. Update Quantity (From Card or Cart Page)
    window.updateItemQty = function(id, change) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex === -1) return;

        cart[itemIndex].quantity += change;

        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }

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
                
                itemEl.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${imgUrl}" alt="${safeName}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/200x200?text=صورة';this.onerror=null;">
                    </div>
                    
                    <div class="cart-item-details">
                        <h4 class="item-name">${item.name}</h4>
                        <span class="item-price-unit">${item.price} ر.س × ${item.quantity}</span>
                    </div>

                    <div class="cart-item-actions">
                        <div class="qty-selector">
                            <button class="qty-btn minus" onclick="updateItemQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn plus" onclick="updateItemQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
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

    // Checkout via WhatsApp
    if(pageCheckoutBtn) {
        pageCheckoutBtn.addEventListener('click', () => {
            if(cart.length === 0) return;

            let message = "مرحباً، أود طلب المنتجات التالية:\n\n";
            let total = 0;

            cart.forEach(item => {
                message += `- *${item.name}* (العدد: ${item.quantity}) - السعر: ${item.price * item.quantity} ر.س\n`;
                total += item.price * item.quantity;
            });

            message += `\n*الإجمالي: ${total} ر.س*`;
            message += "\n\nالرجاء تأكيد الطلب.";

            const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        });
    }

    // Update Product Cards (Switch between "Add" and "Qty Controls")
    function updateProductCards() {
        const cards = document.querySelectorAll('.product-card');
        
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

    // Animation Effect
    function animateFlyToCart(sourceElement) {
        if (!sourceElement) return;
        
        // Target the cart icon in the topbar or floating button
        let cartIcon = document.querySelector('.topbar .fa-shopping-cart');
        // If on mobile or if floating button is visible, maybe target that instead?
        // For now, let's target the nav icon.
        
        if (!cartIcon) return;

        const flyer = sourceElement.cloneNode();
        flyer.classList.add('flying-img');
        
        const srcRect = sourceElement.getBoundingClientRect();
        const destRect = cartIcon.getBoundingClientRect();

        flyer.style.left = `${srcRect.left}px`;
        flyer.style.top = `${srcRect.top}px`;
        flyer.style.width = `${srcRect.width}px`;
        flyer.style.height = `${srcRect.height}px`;

        document.body.appendChild(flyer);

        // Force reflow
        flyer.offsetHeight;

        // Start animation
        requestAnimationFrame(() => {
            flyer.style.transform = `translate(${destRect.left - srcRect.left}px, ${destRect.top - srcRect.top}px) scale(0.1)`;
            flyer.style.opacity = '0.5';
        });

        setTimeout(() => {
            flyer.remove();
            cartIcon.parentElement.classList.add('bump');
            setTimeout(() => cartIcon.parentElement.classList.remove('bump'), 300);
        }, 800); // Match CSS transition time
    }

    // === Event Listeners ===

    // Checkout Button (Cart Page)
    if(pageCheckoutBtn) {
        pageCheckoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;

            let message = "*طلب جديد من موقع حلويات بقداش* 🧁\n\n";
            message += "*تفاصيل الطلب:*\n";
            
            cart.forEach(item => {
                message += `- ${item.name} (${item.quantity}x): ${(item.price * item.quantity).toFixed(2)} ر.س\n`;
            });

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            message += `\n*المجموع الكلي: ${total.toFixed(2)} ر.س*`;
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }

    // Initialize UI on load
    updateAllUI();

    // === Stories Logic ===
    window.openStory = function(videoUrl, title) {
        const modal = document.getElementById('storyModal');
        const video = document.getElementById('storyVideo');
        const titleEl = document.getElementById('storyTitle');

        if(modal && video) {
            video.src = videoUrl;
            if(titleEl) titleEl.textContent = title;
            modal.classList.add('active');
            
            // Play video
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play prevented");
                });
            }
        }
    };

    window.closeStory = function() {
        const modal = document.getElementById('storyModal');
        const video = document.getElementById('storyVideo');
        
        if(modal && video) {
            modal.classList.remove('active');
            video.pause();
            video.currentTime = 0;
            video.src = "";
        }
    };

    // Close modal when clicking outside video
    const storyModal = document.getElementById('storyModal');
    if(storyModal) {
        storyModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeStory();
            }
        });
    }
});
