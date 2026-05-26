<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBkssGDiofEbjyrl2ODOIak9qnFGbQTJBE",
    authDomain: "gloriam-store.firebaseapp.com",
    projectId: "gloriam-store",
    storageBucket: "gloriam-store.firebasestorage.app",
    messagingSenderId: "170877114918",
    appId: "1:170877114918:web:561cc1a634a83a937c24e7",
    measurementId: "G-GZR10ZN5VJ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>