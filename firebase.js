import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkssGDiofEbjyrl2ODOIak9qnFGbQTJBE",
    authDomain: "gloriam-store.firebaseapp.com",
    projectId: "gloriam-store",
    storageBucket: "gloriam-store.firebasestorage.app",
    messagingSenderId: "170877114918",
    appId: "1:170877114918:web:561cc1a634a83a937c24e7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Cloudinary config
export const CLOUDINARY_CLOUD = "dekjgqu7q";
export const CLOUDINARY_PRESET = "gloriam-bukti";

// Simpan order ke Firestore
export async function saveOrder(orderData) {
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            status: "pending",
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (err) {
        console.error("Gagal simpan order:", err);
        return null;
    }
}

// Upload bukti ke Cloudinary
export async function uploadBukti(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", "bukti-bayar");

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        return data.secure_url;
    } catch (err) {
        console.error("Gagal upload bukti:", err);
        return null;
    }
}

// Ambil semua order (untuk admin)
export async function getOrders() {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error("Gagal ambil order:", err);
        return [];
    }
}

// Update status order
export async function updateOrderStatus(orderId, status) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status });
        return true;
    } catch (err) {
        console.error("Gagal update status:", err);
        return false;
    }
}

// Login admin
export async function loginAdmin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (err) {
        console.error("Login gagal:", err);
        return false;
    }
}

// Logout admin
export async function logoutAdmin() {
    await signOut(auth);
}