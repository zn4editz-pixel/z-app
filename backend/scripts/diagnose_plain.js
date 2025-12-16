
import 'dotenv/config';

console.log("DIAGNOSTICS START");

const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
keys.forEach(key => {
    const val = process.env[key];
    if (!val || val.length === 0) {
        console.log("MISSING: " + key);
    } else {
        console.log("PRESENT: " + key);
        if (key === 'CLOUDINARY_API_KEY') {
            console.log("VAL_DEBUG: " + val.substring(0, 3) + "...");
        }
    }
});

console.log("DIAGNOSTICS END");
