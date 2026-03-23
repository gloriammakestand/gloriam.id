const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5wyzEXxKbCeS8SQWZQ7oz5lmPwszeLtW-TuQ5uzCV6GWcXP5IqOzjTqhIRg5yyLuRd86yLtXGMnoL/pub?output=csv';
let products = [];
let cart = { prod: null, size: '', color: '' };

window.onload = async () => {
    await loadProducts();
    setTimeout(() => document.getElementById('loader').classList.add('hide'), 1000);
};

async function loadProducts() {
    try {
        const response = await fetch(SHEET_CSV);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        products = rows.map(row => {
            const col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ""));
            return {
                id: parseInt(col[0]),
                name: col[1],
                price: parseInt(col[2]),
                badge: col[3].toLowerCase(),
                status: col[4],
                colors: col[5].split('/').map(c => c.trim()),
                stock: col[6].split('/').map(s => s.trim()),
                imgs: [col[7], col[8]].filter(i => i)
            };
        });
        renderHome();
    } catch (e) { console.error("Sheet Error:", e); }
}

function renderHome() {
    const container = document.getElementById('product-list');
    container.innerHTML = '';
    products.forEach(p => {
        const isSold = p.badge === 'sold';
        container.innerHTML += `
            <div class="card"><div class="badge ${p.badge}">${p.status}</div><img src="${p.imgs[0]}"><div style="padding:25px"><h3 style="margin:0; font-size:20px;">${p.name}</h3><p style="opacity:0.5; margin:10px 0 20px;">${isSold ? 'OUT OF STOCK' : 'Rp' + p.price.toLocaleString('id-ID')}</p><button ${isSold ? 'disabled' : ''} onclick="goDetail(${p.id})">${isSold ? 'HABIS' : 'SELECT'}</button></div></div>
        `;
    });
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById(id).scrollTop = 0;
}

function goDetail(id) {
    const p = products.find(x => x.id === id);
    cart = { prod: p, size: '', color: p.colors.length === 1 ? p.colors[0] : '' };
    document.getElementById('detName').innerText = p.name;
    document.getElementById('detPrice').innerText = `Rp${p.price.toLocaleString('id-ID')}`;
    document.getElementById('detImgs').innerHTML = p.imgs.map(i => `<img src="${i}">`).join('');
    
    let cHTML = `<div class="section-label">PILIH WARNA</div><div class="option-box">`;
    p.colors.forEach(c => cHTML += `<div class="${cart.color === c ? 'active' : ''}" onclick="selOpt('color','${c}',this)">${c}</div>`);
    document.getElementById('colorArea').innerHTML = cHTML + `</div>`;

    let sHTML = `<div class="section-label">PILIH UKURAN</div><div class="option-box">`;
    ["S", "M", "L", "XL", "XXL", "XXXL"].forEach(s => {
        const isAvail = p.stock.includes(s);
        sHTML += `<div class="${isAvail ? '' : 'disabled'}" onclick="${isAvail ? `selOpt('size','${s}',this)` : ''}">${s}</div>`;
    });
    document.getElementById('sizeArea').innerHTML = sHTML + `</div>`;
    showPage('detail');
}

function selOpt(type, val, el) {
    if (navigator.vibrate) navigator.vibrate(40);
    cart[type] = val;
    el.parentElement.querySelectorAll('div').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
}

function triggerError(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg; t.classList.add('show');
    document.querySelector('.page.active').classList.add('vibrate-screen');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => { 
        t.classList.remove('show'); 
        document.querySelector('.page.active').classList.remove('vibrate-screen'); 
    }, 2500);
}

function validateDetail() {
    if(!cart.color || !cart.size) return triggerError("PILIH WARNA & UKURAN!");
    showPage('form');
}

function validateForm() {
    const n = document.getElementById('inName').value, p = document.getElementById('inPhone').value, a = document.getElementById('inAddress').value;
    if(!n || !p || !a) return triggerError("LENGKAPI DATA PENGIRIMAN!");
    document.getElementById('sumProd').innerText = cart.prod.name;
    document.getElementById('sumVar').innerText = `WARNA: ${cart.color} | SIZE: ${cart.size}`;
    document.getElementById('sumPrice').innerText = `Rp${cart.prod.price.toLocaleString('id-ID')}`;
    document.getElementById('sumCust').innerHTML = `<strong>${n}</strong><br>${p}<br>${a}`;
    showPage('summary');
}

function sendWA() {
    const n = document.getElementById('inName').value, p = document.getElementById('inPhone').value, a = document.getElementById('inAddress').value;
    const text = `*GLORIAM ORDER*\n\n${cart.prod.name}\nWarna: ${cart.color}\nSize: ${cart.size}\n\n*Data Pengiriman*\nNama: ${n}\nWhatsApp: ${p}\nAlamat: ${a}`;
    window.open(`https://wa.me/6283898588562?text=${encodeURIComponent(text)}`);
}

function openSize() { document.getElementById('sizeModal').style.display='flex'; }
function closeSize() { document.getElementById('sizeModal').style.display='none'; }
