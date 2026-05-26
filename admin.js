import { auth, loginAdmin, logoutAdmin, getOrders, updateOrderStatus, getProduk, saveProduk, updateProduk, deleteProduk, getGaleri, saveGaleri, deleteGaleri, uploadGambar } from './firebase.js';
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

    let allOrders = [];
    let allProduk = [];
    let allGaleri = [];
    let currentFilter = 'semua';
    let editingProdukId = null;

    // ===== AUTH =====
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('adminPage').style.display = 'block';
            await Promise.all([loadOrders(), loadProduk(), loadGaleri()]);
        } else {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('adminPage').style.display = 'none';
        }
    });

    window.doLogin = async () => {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminPass').value;
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginErr');
        err.style.display = 'none';
        btn.disabled = true;
        btn.innerText = 'MASUK...';
        const ok = await loginAdmin(email, pass);
        if (!ok) {
            err.style.display = 'block';
            btn.disabled = false;
            btn.innerText = 'MASUK';
        }
    };

    window.doLogout = async () => {
        await logoutAdmin();
    };

    // ===== TOAST =====
    window.showToast = (msg, isErr = false) => {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.className = 'toast' + (isErr ? ' err' : '');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2500);
    };

    // ===== TABS =====
    window.switchTab = (tab) => {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        const navEl = document.getElementById('nav-' + tab);
        const mobEl = document.getElementById('mob-' + tab);
        if (navEl) navEl.classList.add('active');
        if (mobEl) mobEl.classList.add('active');
    };

    // ===== ORDER =====
    async function loadOrders() {
        allOrders = await getOrders();
        renderOrders();
    }

    window.filterOrder = (filter, el) => {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        renderOrders();
    };

    function renderOrders() {
        const list = document.getElementById('orderList');
        const filtered = currentFilter === 'semua' ? allOrders : allOrders.filter(o => o.status === currentFilter);

        if (filtered.length === 0) {
            list.innerHTML = `<div class="empty"><i class="fas fa-box-open"></i><p>Belum ada order</p></div>`;
            return;
        }

        list.innerHTML = filtered.map(o => {
            const date = new Date(o.createdAt).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
            const bayar = o.tipeBayar === 'lunas' ? 'LUNAS' : `DP Rp${parseInt(o.dp).toLocaleString('id-ID')}`;
            const sc = o.status === 'approved' ? 's-approved' : o.status === 'rejected' ? 's-rejected' : 's-pending';
            const st = o.status === 'approved' ? 'APPROVED' : o.status === 'rejected' ? 'DITOLAK' : 'PENDING';

            return `<div class="order-card">
                <div class="order-top">
                    <div>
                        <div class="order-name">${o.nama}</div>
                        <div class="order-time">${date}</div>
                    </div>
                    <div class="status-badge ${sc}">${st}</div>
                </div>
                <div class="order-info">
                    <div class="info-item">Produk <span>${o.produk}</span></div>
                    <div class="info-item">Warna / Size <span>${o.warna} / ${o.size}</span></div>
                    <div class="info-item">Harga <span>Rp${parseInt(o.harga).toLocaleString('id-ID')}</span></div>
                    <div class="info-item">Pembayaran <span>${bayar}</span></div>
                    <div class="info-item">WhatsApp <span>${o.wa}</span></div>
                    <div class="info-item">Alamat <span>${o.alamat}</span></div>
                </div>
                <div class="order-actions">
                    <a href="${o.buktiURL}" target="_blank" class="btn-sm btn-bukti"><i class="fas fa-image"></i> BUKTI</a>
                    ${o.status === 'pending' ? `
                    <button class="btn-sm btn-approve" onclick="approveOrder('${o.id}')"><i class="fas fa-check"></i> APPROVE</button>
                    <button class="btn-sm btn-reject" onclick="rejectOrder('${o.id}')"><i class="fas fa-times"></i> TOLAK</button>
                    ` : ''}
                </div>
            </div>`;
        }).join('');
    }

    window.approveOrder = async (id) => {
        const ok = await updateOrderStatus(id, 'approved');
        if (ok) {
            allOrders = allOrders.map(o => o.id === id ? {...o, status: 'approved'} : o);
            renderOrders();
            showToast('ORDER DIAPPROVE ✓');
        }
    };

    window.rejectOrder = async (id) => {
        const ok = await updateOrderStatus(id, 'rejected');
        if (ok) {
            allOrders = allOrders.map(o => o.id === id ? {...o, status: 'rejected'} : o);
            renderOrders();
            showToast('ORDER DITOLAK', true);
        }
    };

    // ===== PRODUK =====
    async function loadProduk() {
        allProduk = await getProduk();
        renderProduk();
    }

    function renderProduk() {
        const list = document.getElementById('produkList');
        if (allProduk.length === 0) {
            list.innerHTML = `<div class="empty"><i class="fas fa-tshirt"></i><p>Belum ada produk</p></div>`;
            return;
        }
        list.innerHTML = `<div class="produk-grid">${allProduk.map(p => `
            <div class="produk-card">
                <img src="${p.thumbnail || ''}" onerror="this.src=''">
                <div class="produk-info">
                    <div class="produk-badge badge-${p.badge}">${p.status || p.badge}</div>
                    <div class="produk-name">${p.nama}</div>
                    <div class="produk-price">Rp${parseInt(p.harga).toLocaleString('id-ID')}</div>
                    <div class="produk-actions">
                        <div class="btn-icon" onclick="editProduk('${p.id}')"><i class="fas fa-pen"></i></div>
                        <div class="btn-icon del" onclick="hapusProduk('${p.id}')"><i class="fas fa-trash"></i></div>
                    </div>
                </div>
            </div>
        `).join('')}</div>`;
    }

    window.openModalProduk = () => {
        editingProdukId = null;
        document.getElementById('modalProdukTitle').innerText = 'TAMBAH PRODUK';
        document.getElementById('pNama').value = '';
        document.getElementById('pHarga').value = '';
        document.getElementById('pBadge').value = 'pre';
        document.getElementById('pStatus').value = '';
        document.getElementById('pWarna').value = '';
        document.getElementById('pStok').value = '';
        document.getElementById('pSpecs').value = '';
        document.getElementById('pShowcase').value = 'yes';
        document.getElementById('prevThumb').style.display = 'none';
        [0,1,2,3,4].forEach(i => {
            const img = document.getElementById('prevDet'+i);
            img.src = '';
            img.style.display = 'none';
        });
        document.getElementById('modalProduk').classList.add('show');
    };

    window.closeModalProduk = () => {
        document.getElementById('modalProduk').classList.remove('show');
    };

    window.editProduk = (id) => {
        const p = allProduk.find(x => x.id === id);
        if (!p) return;
        editingProdukId = id;
        document.getElementById('modalProdukTitle').innerText = 'EDIT PRODUK';
        document.getElementById('pNama').value = p.nama || '';
        document.getElementById('pHarga').value = p.harga || '';
        document.getElementById('pBadge').value = p.badge || 'pre';
        document.getElementById('pStatus').value = p.status || '';
        document.getElementById('pWarna').value = p.warna || '';
        document.getElementById('pStok').value = p.stok || '';
        document.getElementById('pSpecs').value = p.specs || '';
        document.getElementById('pShowcase').value = p.showcase || 'yes';

        const thumb = document.getElementById('prevThumb');
        if (p.thumbnail) { thumb.src = p.thumbnail; thumb.style.display = 'block'; }

        const details = p.details || [];
        [0,1,2,3,4].forEach(i => {
            const img = document.getElementById('prevDet'+i);
            if (details[i]) { img.src = details[i]; img.style.display = 'block'; }
            else { img.src = ''; img.style.display = 'none'; }
        });

        document.getElementById('modalProduk').classList.add('show');
    };

    window.saveProdukData = async () => {
        const btn = document.getElementById('btnSaveProduk');
        btn.disabled = true;
        btn.innerText = 'MENYIMPAN...';

        try {
            // Upload thumbnail
            let thumbnailURL = editingProdukId ? (allProduk.find(x => x.id === editingProdukId)?.thumbnail || '') : '';
            const thumbFile = document.getElementById('inputThumb').files[0];
            if (thumbFile) thumbnailURL = await uploadGambar(thumbFile, 'produk');

            // Upload detail images
            const details = [];
            const existing = editingProdukId ? (allProduk.find(x => x.id === editingProdukId)?.details || []) : [];
            for (let i = 0; i < 5; i++) {
                const file = document.getElementById('inputDet'+i).files[0];
                if (file) {
                    const url = await uploadGambar(file, 'produk');
                    if (url) details.push(url);
                } else if (existing[i]) {
                    details.push(existing[i]);
                }
            }

            const data = {
                nama: document.getElementById('pNama').value,
                harga: document.getElementById('pHarga').value,
                badge: document.getElementById('pBadge').value,
                status: document.getElementById('pStatus').value,
                warna: document.getElementById('pWarna').value,
                stok: document.getElementById('pStok').value,
                specs: document.getElementById('pSpecs').value,
                showcase: document.getElementById('pShowcase').value,
                thumbnail: thumbnailURL,
                details
            };

            if (editingProdukId) {
                await updateProduk(editingProdukId, data);
                showToast('PRODUK DIUPDATE ✓');
            } else {
                await saveProduk(data);
                showToast('PRODUK DITAMBAHKAN ✓');
            }

            closeModalProduk();
            await loadProduk();
        } catch (err) {
            console.error(err);
            showToast('GAGAL SIMPAN!', true);
        }

        btn.disabled = false;
        btn.innerText = 'SIMPAN';
    };

    window.hapusProduk = async (id) => {
        if (!confirm('Hapus produk ini?')) return;
        await deleteProduk(id);
        allProduk = allProduk.filter(p => p.id !== id);
        renderProduk();
        showToast('PRODUK DIHAPUS');
    };

    // ===== GALERI =====
    async function loadGaleri() {
        allGaleri = await getGaleri();
        renderGaleri();
    }

    function renderGaleri() {
        const grid = document.getElementById('galeriGrid');
        grid.innerHTML = allGaleri.map(g => `
            <div class="galeri-item">
                <img src="${g.url}" loading="lazy">
                <div class="galeri-del" onclick="hapusGaleri('${g.id}')"><i class="fas fa-times"></i></div>
            </div>
        `).join('');
    }

    window.uploadGaleriFoto = async (input) => {
        const files = Array.from(input.files);
        if (!files.length) return;
        showToast('MENGUPLOAD...');
        for (const file of files) {
            const url = await uploadGambar(file, 'galeri');
            if (url) await saveGaleri(url);
        }
        await loadGaleri();
        showToast('GALERI DIUPDATE ✓');
        input.value = '';
    };

    window.hapusGaleri = async (id) => {
        await deleteGaleri(id);
        allGaleri = allGaleri.filter(g => g.id !== id);
        renderGaleri();
        showToast('FOTO DIHAPUS');
    };

    // ===== IMG PREVIEW =====
    window.prevImgSlot = (input, previewId) => {
        const file = input.files[0];
        if (!file) return;
        const img = document.getElementById(previewId);
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; img.style.display = 'block'; };
        reader.readAsDataURL(file);
    };