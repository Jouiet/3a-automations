import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const APP_KEY = process.env.ALIBABA_APP_KEY;
const APP_SECRET = process.env.ALIBABA_APP_SECRET;
const API_URL = process.env.ALIBABA_API_URL || "https://api-sg.aliexpress.com/rest";

if (!APP_KEY || !APP_SECRET) {
    console.error("❌ CRITICAL FAIL: Missing Credentials in .env");
    process.exit(1);
}

console.log(`🔍 [VERIFY] Testing Credentials: Key=${APP_KEY}`);

// --- 1. TEST SIGNATURE LOGIC ---
function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let str = secret;
    for (const key of sortedKeys) {
        if (params[key] !== undefined && params[key] !== null) {
            str += key + params[key];
        }
    }
    str += secret;
    return crypto.createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

function getTimestamp(offsetHours = 0) {
    const d = new Date(Date.now() + offsetHours * 3600 * 1000);
    return d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

async function testTimestamp(tsLabel, tsValue) {
    console.log(`\n🕒 Testing Timestamp: ${tsLabel} -> ${tsValue}`);

    const params = {
        method: "aliexpress.affiliate.product.query",
        app_key: APP_KEY,
        timestamp: tsValue,
        format: "json",
        v: "2.0",
        sign_method: "md5",
        keywords: "watch",
        target_currency: "USD",
        target_language: "EN",
        tracking_id: "verify_123",
        page_size: 1
    };

    const signature = signRequest(params, APP_SECRET);
    const requestParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        requestParams.append(key, String(value));
    }
    requestParams.append("sign", signature);

    try {
        const response = await axios.post(API_URL, requestParams);
        if (response.data.error_response) {
            console.log(`   ❌ Failed: ${response.data.error_response.msg} (SubCode: ${response.data.error_response.sub_code})`);
            return false;
        } else {
            console.log(`   ✅ SUCCESS!`);
            const p = response.data?.resp_result?.result?.products?.product?.[0];
            if (p) console.log(`   Found: ${p.product_title}`);
            else console.log("   (Response OK, but no products)");
            return true;
        }
    } catch (e) {
        console.log(`   ❌ HTTP Error: ${e.message}`);
        return false;
    }
}

(async () => {
    // Test 1: UTC
    if (await testTimestamp("UTC", getTimestamp(0))) process.exit(0);

    // Test 2: Singapore (UTC+8)
    if (await testTimestamp("Singapore (UTC+8)", getTimestamp(8))) process.exit(0);

    // Test 3: PST (UTC-8)
    if (await testTimestamp("PST (UTC-8)", getTimestamp(-8))) process.exit(0);

    console.error("\n❌ ALL TIMESTAMP FORMATS FAILED.");
    process.exit(1);
})();
