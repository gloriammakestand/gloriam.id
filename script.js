const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5wyzEXxKbCeS8SQWZQ7oz5lmPwszeLtW-TuQ5uzCV6GWcXP5IqOzjTqhIRg5yyLuRd86yLtXGMnoL/pub?output=csv';
let products = [];
let cart = { prod: null, size: '', color: '' };

async function initApp() {
    try {
        const res = await fetch(SHEET_URL);
        const data = await res.text();
        const rows = data.split('\n').map(r => r.trim()).filter(r => r !== '');
        const header = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ""));
        const idx = (n) => header.indexOf(n);

        products = rows.slice(1).map((row, i) => {
            const col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ""));
            return {
                id: parseInt(col[idx('id')]) || (i + 1),
                name: col[idx('name')],
                price: parseInt(col[idx('price')].replace(/[^\d]/g, "")),
                dp: parseInt((col[idx('dp')] || "0").replace(/[^\d]/g, "")),
                badge: col[idx('badge')].toLowerCase(),
                status: col[idx('status')],
                colors: col[idx('colors')].split('/').map(c => c.trim()),
                stock: col[idx('stock')].split('/').map(s => s.trim()),
                imgs: [col[idx('thumbnail')], col[idx('details1')]]
            };
        });
        renderHome();
        setTimeout(() => document.getElementById('loader').classList.add('hide'), 1000);
    } catch (e) { console.error(e); }
}

function renderHome() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    products.forEach(p => {
        const isSold = p.badge === 'sold';
        list.innerHTML += `
            <div class="card" style="background:#0a0a0a; border-radius:20px; border:1px solid #1a1a1a; overflow:hidden; position:relative;">
                <div class="badge ${p.badge}">${p.status}</div>
                <img src="${p.imgs[0]}" style="width:100%; aspect-ratio:1/1; object-fit:cover;">
                <div style="padding:25px">
                    <h3 style="margin:0; font-size:20px;">${p.name}</h3>
                    <p style="color:#00c853; font-weight:700; margin:10px 0 20px;">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <button ${isSold ? 'disabled' : ''} onclick="goDetail(${p.id})">${isSold ? 'HABIS' : 'SELECT'}</button>
                </div>
            </div>`;
    });
}

function triggerError(msg) {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    const t = document.getElementById('toast');
    t.innerText = msg; t.classList.add('show');
    document.querySelector('.page.active').classList.add('vibrate-screen');
    setTimeout(() => {
        t.classList.remove('show');
        document.querySelector('.page.active').classList.remove('vibrate-screen');
    }, 2000);
}

function goDetail(id) {
    const p = products.find(x => x.id === id);
    cart = { prod: p, size: '', color: p.colors.length === 1 ? p.colors[0] : '' };
    document.getElementById('detName').innerText = p.name;
    document.getElementById('detPrice').innerText = `Rp ${p.price.toLocaleString('id-ID')}`;
    document.getElementById('detImgs').innerHTML = p.imgs.filter(i => i).map(i => `<img src="${i}">`).join('');
    
    let cHTML = `<div class="section-label" style="margin-top:30px; font-size:11px; font-weight:700; color:#555;">WARNA</div><div class="option-box" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px;">`;
    p.colors.forEach(c => cHTML += `<div style="padding:16px; border:1.5px solid #1a1a1a; text-align:center; border-radius:12px;" onclick="selOpt('color','${c}',this)">${c}</div>`);
    document.getElementById('colorArea').innerHTML = cHTML + `</div>`;

    let sHTML = `<div class="section-label" style="margin-top:25px; font-size:11px; font-weight:700; color:#555;">UKURAN</div><div class="option-box" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px;">`;
    ["S", "M", "L", "XL", "XXL", "XXXL"].forEach(s => {
        const isAvail = p.stock.includes(s);
        sHTML += `<div class="${isAvail ? '' : 'disabled'}" style="padding:16px; border:1.5px solid #1a1a1a; text-align:center; border-radius:12px; ${!isAvail ? 'opacity:0.1; text-decoration:line-through;' : ''}" onclick="${isAvail ? `selOpt('size','${s}',this)` : 'triggerError(\'UKURAN HABIS\')'}">${s}</div>`;
    });
    document.getElementById('sizeArea').innerHTML = sHTML + `</div>`;
    showPage('detail');
}

function selOpt(type, val, el) {
    if (navigator.vibrate) navigator.vibrate(40);
    cart[type] = val;
    el.parentElement.querySelectorAll('div').forEach(d => { d.style.background = '#050505'; d.style.color = '#fff'; d.style.borderColor = '#1a1a1a'; });
    el.style.background = '#fff'; el.style.color = '#000'; el.style.borderColor = '#fff';
}

function validateDetail() {
    if(!cart.color || !cart.size) return triggerError("PILIH WARNA & UKURAN!");
    showPage('form');
}

function validateForm() {
    const n = document.getElementById('inName').value, p = document.getElementById('inPhone').value, a = document.getElementById('inAddress').value;
    if(!n || !p || !a) return triggerError("LENGKAPI DATA!");
    document.getElementById('sumProd').innerText = cart.prod.name;
    document.getElementById('sumVar').innerText = `WARNA: ${cart.color} | SIZE: ${cart.size}`;
    // Langsung harga saja tanpa tulisan "Total"
    document.getElementById('sumPrice').innerText = `Rp ${cart.prod.price.toLocaleString('id-ID')}`;
    document.getElementById('sumCust').innerHTML = `${n}<br>${p}<br>${a}`;
    showPage('summary');
}

function sendWA() {
    const n = document.getElementById('inName').value, p = document.getElementById('inPhone').value, a = document.getElementById('inAddress').value;
    const text = `*ORDER GLORIAM*\n\nProduk: ${cart.prod.name}\nWarna: ${cart.color}\nSize: ${cart.size}\nTotal: Rp ${cart.prod.price.toLocaleString('id-ID')}\n\n*Data Pengiriman*\nNama: ${n}\nWA: ${p}\nAlamat: ${a}`;
    window.open(`https://wa.me/6283898588562?text=${encodeURIComponent(text)}`);
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

window.onload = initApp;
