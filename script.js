const PAGE_SLUGS = {
    home: '/',
    preorder: '/preorder',
    katalog: '/katalog',
    arsip: '/arsip',
    galeri: '/galeri',
    tentang: '/tentang'
};

const SLUG_TO_PAGE = {
    '': 'home',
    'preorder': 'preorder',
    'katalog': 'katalog',
    'arsip': 'arsip',
    'galeri': 'galeri',
    'tentang': 'tentang'
};

function updateMeta(title, description) {
    document.title = title;
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
}

const META = {
    home: { title: 'Gloriam | Make a Stand with Pride', desc: 'Soccer culture, street attitude.' },
    katalog: { title: 'Katalog | Gloriam', desc: 'Koleksi lengkap Gloriam Store.' },
    preorder: { title: 'Pre Order | Gloriam', desc: 'Pre order produk terbaru Gloriam.' },
    arsip: { title: 'Arsip | Gloriam', desc: 'Koleksi arsip Gloriam Store.' },
    galeri: { title: 'Galeri | Gloriam', desc: 'Galeri foto Gloriam Store.' },
    tentang: { title: 'Tentang Kami | Gloriam', desc: 'Gloriam, built for those who carry football into everyday life.' }
};

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
}

let galleryImages = []; // Untuk menyimpan link dari kolom Q

const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5wyzEXxKbCeS8SQWZQ7oz5lmPwszeLtW-TuQ5uzCV6GWcXP5IqOzjTqhIRg5yyLuRd86yLtXGMnoL/pub?output=csv';
let products = [];
let cart = { prod: null, size: '', color: '' };
let lastPage = 'home'; // Default ke home

let tipeBayar = 'lunas'; // default lunas

function pilihBayar(tipe) {
    tipeBayar = tipe;
    if (tipe === 'lunas') {
        document.getElementById('btnLunas').style.cssText = 'padding:16px; border:1.5px solid #fff; border-radius:12px; text-align:center; font-weight:700; font-size:13px; cursor:pointer; background:#fff; color:#000;';
        document.getElementById('btnDP').style.cssText = 'padding:16px; border:1.5px solid #1a1a1a; border-radius:12px; text-align:center; font-weight:700; font-size:13px; cursor:pointer; background:#050505; color:#fff;';
        document.getElementById('dpArea').style.display = 'none';
    } else {
        document.getElementById('btnDP').style.cssText = 'padding:16px; border:1.5px solid #fff; border-radius:12px; text-align:center; font-weight:700; font-size:13px; cursor:pointer; background:#fff; color:#000;';
        document.getElementById('btnLunas').style.cssText = 'padding:16px; border:1.5px solid #1a1a1a; border-radius:12px; text-align:center; font-weight:700; font-size:13px; cursor:pointer; background:#050505; color:#fff;';
        document.getElementById('dpArea').style.display = 'block';
    }
}

let uploadedBuktiURL = null;

async function previewBukti(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const img = document.getElementById('previewImg');
        img.src = e.target.result;
        img.style.display = 'block';
        img.style.opacity = '0.4';
        img.style.filter = 'blur(3px)';
    };
    reader.readAsDataURL(file);

    document.getElementById('labelBukti').innerText = '⏳ Mengupload...';

    const { uploadGambar } = await import('./firebase.js');
    uploadedBuktiURL = await uploadGambar(file, 'bukti');

    const previewImg = document.getElementById('previewImg');
    if (uploadedBuktiURL) {
        previewImg.style.opacity = '1';
        previewImg.style.filter = 'none';
        document.getElementById('labelBukti').innerText = '✓ Upload berhasil!';
    } else {
        previewImg.style.display = 'none';
        previewImg.style.opacity = '1';
        previewImg.style.filter = 'none';
        document.getElementById('labelBukti').innerText = '✗ Gagal upload, coba lagi';
        uploadedBuktiURL = null;
    }
}

window.onload = async () => {
    history.replaceState({ page: 'home' }, '', window.location.pathname);
    await fetchProducts();
    setTimeout(() => document.getElementById('loader').classList.add('hide'), 1000);

    const path = window.location.pathname.replace(/^\//, '').toLowerCase();

    // Cek apakah path adalah order page
    const orderMatch = path.match(/^order\/(.+?)\/(detail|form|summary)$/) || 
                   (path.match(/^order\/([^/]+)$/) ? [null, path.replace('order/', ''), 'detail'] : null);
    if (orderMatch) {
        const productSlug = orderMatch[1]; // contoh: soccer-madness
        const pageId = orderMatch[2];      // detail, form, atau summary

        // Cari produk berdasarkan slug
        const found = products.find(p => slugify(p.name) === productSlug);

        if (found) {
            // Set cart dari data produk
            cart = { 
                prod: found, 
                size: '', 
                color: found.colors.length === 1 ? found.colors[0] : '' 
            };
            // Render ulang detail produk
            goDetailSilent(found);
            // Tampilkan halaman yang sesuai
            showPageSilent(pageId);
        } else {
            // Produk tidak ditemukan, redirect home
            history.replaceState({ page: 'home' }, '', '/');
            showPage('home');
        }
    } else {
        const targetPage = SLUG_TO_PAGE[path] || 'home';
        if (targetPage !== 'home') {
            showPage(targetPage);
        }
    }

    const orderPages = ['detail', 'form', 'summary'];
    window.addEventListener('popstate', (e) => {
        const page = e.state?.page || 'home';
        const menuBtn = document.querySelector('.menu-btn');

        if (orderPages.includes(page) && !cart.prod) {
            history.replaceState({ page: 'home' }, '', '/');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('home').classList.add('active');
            menuBtn.style.display = 'flex';
            return;
        }

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        document.getElementById(page).scrollTop = 0;

        if (orderPages.includes(page)) {
            menuBtn.style.display = 'none';
        } else {
            menuBtn.style.display = 'flex';
            lastPage = page;
        }
    });
};

async function fetchProducts() {
    try {
        const response = await fetch(SHEET_CSV);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        
        galleryImages = []; // Reset galeri setiap kali ambil data baru

        products = rows.map(row => {
            const col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ""));

            // --- TAMBAHAN UNTUK GALERI (KOLOM Q / INDEX 16) ---
            if (col[16] && col[16].startsWith("http")) {
                galleryImages.push(col[16]);
            }

            return {
                id: parseInt(col[0]), 
                name: col[1], 
                price: col[2],
                badge: col[3] ? col[3].toLowerCase() : "", 
                status: col[4],
                colors: col[5] ? col[5].split('/').map(c => c.trim()) : [],
                stock: col[6] ? col[6].split('/').map(s => s.trim()) : [],
                thumbnail: col[7],
                details: [col[8], col[9], col[10], col[11], col[12]].filter(i => i && i.trim() !== ""),
                specs: col[13], 
                showcase: col[14] ? col[14].toLowerCase().trim() : "" 
            };
        });

        renderAllSections(); 
        renderGallery(); // <--- Panggil fungsi render galeri di sini
    } catch (err) { console.error("Gagal ambil data:", err); }
}

function renderAllSections() { 
    // Beranda: Hanya produk yang kolom Showcase-nya diisi 'yes'
    renderList(products.filter(p => p.showcase === 'yes'), 'list-home');

    // Halaman lain tetap berdasarkan Badge
    renderList(products.filter(p => p.badge === 'pre'), 'list-preorder');
    renderList(products.filter(p => p.badge === 'ready'), 'list-katalog');
    renderList(products.filter(p => p.badge === 'sold'), 'list-arsip');

    injectFooters();
}

function renderList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(p => {
        const isSold = p.badge === 'sold';
        container.innerHTML += `
            <div class="card ${isSold ? 'sold-out-display' : ''}">
                <div class="badge ${p.badge}">${p.status}</div>
                <img src="${p.thumbnail}" loading="lazy"> <div style="padding:25px">
                    <h3>${p.name}</h3>
                    <p style="opacity:0.5; font-weight:600;">${isSold ? 'OUT OF STOCK' : 'Rp' + p.price}</p>
                    <button onclick="vibrate(40); goDetail(${p.id})" ${isSold ? 'disabled' : ''}>${isSold ? 'SOLD' : 'SELECT'}</button>
                </div>
            </div>`;
    });
}

function renderGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    
    container.innerHTML = '';
    galleryImages.forEach(img => {
        // Kita tambahkan onclick="openImage('${img}')" agar saat diklik gambar membesar
        container.innerHTML += `<img src="${img}" loading="lazy" onclick="vibrate(20); openImage('${img}')">`;
    });
}

// Fungsi untuk membuka modal
function openImage(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    modalImg.src = src;
    modal.style.display = 'flex'; // Mengubah display menjadi flex agar muncul
    vibrate(20);
}

// Fungsi untuk menutup modal (dipanggil saat klik area gelap)
function closeImage() {
    document.getElementById('imageModal').style.display = 'none';
}

function injectFooters() {
    const footerHTML = `
        <footer>
            <div class="footer-logo">GLORIAM</div>
            <div class="footer-slogan">MAKE STAND WITH PRIDE</div>
            <div class="footer-socials">
                <a href="https://www.instagram.com/gloriam____?igsh=d2Z5dTFiMHdxMHgy" target="_blank" onclick="vibrate(30)"><i class="fab fa-instagram"></i></a>
                <a href="https://wa.me/6283898588562" target="_blank" onclick="vibrate(30)"><i class="fab fa-whatsapp"></i></a>
                <a href="https://shopee.co.id/gloriam__" target="_blank" onclick="vibrate(30)"><i class="fas fa-shopping-bag"></i></a>
            </div>
            <div class="footer-contact-title">KONTAK KAMI :</div>
            <div class="footer-contact-info">
                Saluran WhatsApp : <a href="https://whatsapp.com/channel/0029Vb7jjbj8vd1GK8ZiTz0y" target="_blank"><i class="fab fa-whatsapp"></i> Klik Disini</a><br>
                WhatsApp : <a href="https://wa.me/6283898588562">083898588562</a><br>
                Email : <a href="mailto:gloriammakestand@gmail.com">gloriammakestand@gmail.com</a>
            </div>
            <p class="copyright">© 2026 Gloriam Store. All rights reserved.</p>
        </footer>`;

    // Daftar ID footer yang ada di HTML kamu
    ['home', 'pre', 'kat', 'ars', 'about', 'galeri'].forEach(id => {
        const el = document.getElementById(`footer-${id}`);
        if(el) el.innerHTML = footerHTML;
    });
}

function toggleSidebar() {
    vibrate(20);
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
}

function navTo(pageId) { toggleSidebar(); showPage(pageId); }

function showPage(id) {
    if (META[id]) updateMeta(META[id].title, META[id].desc);
    const menuBtn = document.querySelector('.menu-btn');
    const mainMenus = ['home', 'preorder', 'katalog', 'arsip', 'galeri', 'tentang'];
    const orderPages = ['detail', 'form', 'summary'];

    if (orderPages.includes(id) && !cart.prod) {
        history.pushState({ page: 'home' }, '', '/');
        id = 'home';
    }

    if (mainMenus.includes(id)) {
        lastPage = id;
        const slug = PAGE_SLUGS[id] || '/';
        history.pushState({ page: id }, '', slug);
    }

    // URL dinamis untuk order pages
    if (orderPages.includes(id) && cart.prod) {
        const productSlug = slugify(cart.prod.name);
        history.pushState({ page: id, product: productSlug }, '', `/order/${productSlug}/${id}`);
    }

    if (orderPages.includes(id)) {
        menuBtn.style.display = 'none';
    } else {
        menuBtn.style.display = 'flex';
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id).scrollTop = 0;
}

function goDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    if (document.getElementById('sidebar').classList.contains('open')) {
        toggleSidebar();
    }
    
    cart = { prod: p, size: '', color: p.colors.length === 1 ? p.colors[0] : '' };

    document.getElementById('detName').innerText = p.name;
    document.getElementById('detPrice').innerText = 'Rp' + p.price;

    const slider = document.getElementById('detImgs');

    // Cek apakah ada gambar detail (I-M)
    if (p.details && p.details.length > 0) {
        // Hanya tampilkan gambar detail 1-5
        slider.innerHTML = p.details.map(i => `<img src="${i}">`).join('');
    } else {
        // Kalau detail kosong, thumbnail baru muncul sebagai cadangan
        slider.innerHTML = `<img src="${p.thumbnail}">`;
    }

    slider.scrollLeft = 0; 

    // Render Warna
    let cHTML = `<div class="section-label">PILIH WARNA</div><div class="option-box">`;
    p.colors.forEach(c => {
        cHTML += `<div class="${cart.color === c ? 'active' : ''}" onclick="selOpt('color','${c}',this)">${c}</div>`;
    });
    document.getElementById('colorArea').innerHTML = cHTML + `</div>`;

    // Render Ukuran
    let sHTML = `<div class="section-label">PILIH UKURAN</div><div class="option-box">`;
    ["S", "M", "L", "XL", "XXL", "XXXL"].forEach(s => {
        const isAvail = p.stock.includes(s);
        sHTML += `<div class="${isAvail ? '' : 'disabled'}" onclick="${isAvail ? `selOpt('size','${s}',this)` : ''}">${s}</div>`;
    });
    document.getElementById('sizeArea').innerHTML = sHTML + `</div>`;

    // Pindah halaman
    showPage('detail');
}

function selOpt(type, val, el) { vibrate(20); cart[type] = val; el.parentElement.querySelectorAll('div').forEach(d => d.classList.remove('active')); el.classList.add('active'); }
function triggerAlert(msg) {
    // Getar: 50ms, diam 50ms, getar 50ms (pola error)
    vibrate([50, 50, 50]); 
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show', 'shake');

    // Hapus efek goyang setelah 0.4 detik
    setTimeout(() => toast.classList.remove('shake'), 400);
    // Mengubah durasi toast
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function validateDetail() {
    if (!cart.color && !cart.size) return triggerAlert("PILIH WARNA & UKURAN!");
    if (!cart.color) return triggerAlert("PILIH WARNA!");
    if (!cart.size) return triggerAlert("PILIH UKURAN!");
    vibrate(40);
    showPage('form');
}

function validateForm() { vibrate(40);
    const n = document.getElementById('inName').value, p = document.getElementById('inPhone').value, a = document.getElementById('inAddress').value;
    if(!n || !p || !a) return triggerAlert("LENGKAPI DATA!");
    document.getElementById('sumProd').innerText = cart.prod.name;
    document.getElementById('sumVar').innerText = `${cart.color} | ${cart.size}`;
    document.getElementById('sumPrice').innerText = 'Rp' + cart.prod.price;
    document.getElementById('sumCust').innerHTML = `<strong>${n}</strong><br>${p}<br>${a}`;
    showPage('summary');
}

async function sendWA() { 
    vibrate(40);

    const n = document.getElementById('inName').value;
    const p = document.getElementById('inPhone').value;
    const a = document.getElementById('inAddress').value;
    const buktiFile = document.getElementById('inputBukti').files[0];
    const dp = tipeBayar === 'dp' ? document.getElementById('inDP').value : '';

    // Validasi bukti
    if (!buktiFile) return triggerAlert("UPLOAD BUKTI BAYAR DULU!");
if (tipeBayar === 'dp' && !dp) return triggerAlert("ISI NOMINAL DP!");
if (tipeBayar === 'dp' && parseInt(dp) < 60000) return triggerAlert("DP MINIMAL Rp60.000!");

    // Tampilkan loading
    const btn = document.querySelector('#summary button[onclick="sendWA()"]');
    btn.innerText = 'UPLOADING...';
    btn.disabled = true;

    try {
        // 1. Upload bukti ke Cloudinary
        const { saveOrder } = await import('./firebase.js');
const buktiURL = uploadedBuktiURL;
if (!buktiURL) throw new Error("Gagal upload bukti");

        // 2. Data order
        const orderData = {
            nama: n,
            wa: p,
            alamat: a,
            produk: cart.prod.name,
            warna: cart.color,
            size: cart.size,
            harga: cart.prod.price,
            tipeBayar: tipeBayar,
            dp: dp,
            buktiURL: buktiURL
        };

        // 3. Simpan ke Firebase
        await saveOrder(orderData);

        // 4. Kirim ke Google Sheets
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwXBtryzfkaN2skkCDNAsv0jYV3i5UI7vdjTn1-opSGymVOTBNAPtBqbRvVC2ZnjQM2BA/exec';
        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({...orderData, buktiURL})
        }).catch(err => console.error("Gagal kirim ke spreadsheet:", err));

        // 5. Arahkan ke WhatsApp
        const infoBayar = tipeBayar === 'lunas' 
    ? 'LUNAS' 
    : `DP Rp${parseInt(dp).toLocaleString('id-ID')} dari Rp${parseInt(cart.prod.price).toLocaleString('id-ID')}`;

const text = `*GLORIAM ORDER*\n\n*Produk:* ${cart.prod.name}\n*Warna:* ${cart.color}\n*Size:* ${cart.size}\n*Harga:* Rp${parseInt(cart.prod.price).toLocaleString('id-ID')}\n*Pembayaran:* ${infoBayar}\n\n*Data Pengiriman*\n*Nama:* ${n}\n*WhatsApp:* ${p}\n*Alamat:* ${a}\n\n*Bukti Bayar:*\n${buktiURL}`;
        window.open(`https://wa.me/6283898588562?text=${encodeURIComponent(text)}`);

    } catch (err) {
        console.error(err);
        triggerAlert("GAGAL! COBA LAGI.");
    } finally {
        btn.innerText = 'CHECKOUT (WA)';
        btn.disabled = false;
    }
}

function openSize() { document.getElementById('sizeModal').style.display='flex'; }
function closeSize() { document.getElementById('sizeModal').style.display='none'; }
function openSpecs() { 
    const text = cart.prod.specs ? cart.prod.specs.replace(/\\n/g, '<br>') : "Spesifikasi belum tersedia.";
    document.getElementById('specContent').innerHTML = text;
    document.getElementById('specsModal').style.display = 'flex'; 
}
function closeSpecs() { document.getElementById('specsModal').style.display = 'none'; }

// Fungsi untuk membuka modal QRIS
function openQRIS() { 
    vibrate(30); 
    document.getElementById('qrisModal').style.display = 'flex'; 
}

// Fungsi untuk menutup modal QRIS
function closeQRIS() { 
    document.getElementById('qrisModal').style.display = 'none'; 
}

function goDetailSilent(p) {
    document.getElementById('detName').innerText = p.name;
    document.getElementById('detPrice').innerText = 'Rp' + p.price;

    const slider = document.getElementById('detImgs');
    if (p.details && p.details.length > 0) {
        slider.innerHTML = p.details.map(i => `<img src="${i}">`).join('');
    } else {
        slider.innerHTML = `<img src="${p.thumbnail}">`;
    }
    slider.scrollLeft = 0;

    let cHTML = `<div class="section-label">PILIH WARNA</div><div class="option-box">`;
    p.colors.forEach(c => {
        cHTML += `<div class="${cart.color === c ? 'active' : ''}" onclick="selOpt('color','${c}',this)">${c}</div>`;
    });
    document.getElementById('colorArea').innerHTML = cHTML + `</div>`;

    let sHTML = `<div class="section-label">PILIH UKURAN</div><div class="option-box">`;
    ["S", "M", "L", "XL", "XXL", "XXXL"].forEach(s => {
        const isAvail = p.stock.includes(s);
        sHTML += `<div class="${isAvail ? '' : 'disabled'}" onclick="${isAvail ? `selOpt('size','${s}',this)` : ''}">${s}</div>`;
    });
    document.getElementById('sizeArea').innerHTML = sHTML + `</div>`;
}

function showPageSilent(id) {
    if (META[id]) updateMeta(META[id].title, META[id].desc);
    const menuBtn = document.querySelector('.menu-btn');
    const orderPages = ['detail', 'form', 'summary'];

    if (orderPages.includes(id)) {
        menuBtn.style.display = 'none';
    } else {
        menuBtn.style.display = 'flex';
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id).scrollTop = 0;
}