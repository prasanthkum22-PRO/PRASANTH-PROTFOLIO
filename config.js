/**
 * ⚙️ Global App Configuration — K. Prasanth Portfolio
 * Automatically injected into window.ENV for frontend components & admin panel
 */
window.ENV = window.ENV || {
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCVr91j3aXSm1baSivq5jpcM0RDRhwGh4o",
        authDomain: "prasanth-protfilo.firebaseapp.com",
        projectId: "prasanth-protfilo",
        storageBucket: "prasanth-protfilo.firebasestorage.app",
        messagingSenderId: "41305102371",
        appId: "1:41305102371:web:9c4c57428082c8c10ff996"
    },
    CLOUDINARY_CLOUD_NAME: "dekkfy637",
    CLOUDINARY_PRESET: "prasanth_preset",
    ADMIN_EMAIL: "prasanth.kum22@gmail.com",
    ADMIN_PASSWORD: "prasanth"
};

// Sync with window.process if needed by third-party packages
if (typeof window !== 'undefined') {
    window.process = window.process || { env: window.ENV };
}
