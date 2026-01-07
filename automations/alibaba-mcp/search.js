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
const API_URL = process.env.ALIBABA_API_URL;

if (!APP_KEY || !APP_SECRET) { console.error("Missing Credentials"); process.exit(1); }

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

const TIME_OFFSETS = [0, 8, -8];

async function search(keywords) {
    console.log(`🔎 Searching for: "${keywords}" (Robust Mode)...`);

    for (const offset of TIME_OFFSETS) {
        // Generate Timestamp
        const d = new Date(Date.now() + offset * 3600 * 1000);
        const timestamp = d.toISOString().replace(/T/, ' ').replace(/\..+/, '');

        console.log(`   Trying Timestamp: ${timestamp} (Offset ${offset})`);

        const params = {
            method: "aliexpress.affiliate.product.query",
            app_key: APP_KEY,
            timestamp: timestamp,
            format: "json",
            v: "2.0",
            sign_method: "md5",
            keywords: keywords,
            ship_to_country: "US",
            tracking_id: "accio_robust",
            page_size: 10
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
                const code = response.data.error_response.code;
                const msg = response.data.error_response.msg;
                // Treat code 29 as invalid key/timestamp mix
                if ((code !== "IllegalTimestamp" && msg !== "The timestamp is invalid or malformed") && code !== 29) {
                    console.error("❌ API Error:", JSON.stringify(response.data.error_response, null, 2));
                    return;
                }
                console.log(`      ❌ Timestamp Rejected (${msg})`);
            } else {
                // SUCCESS
                const result = response.data?.resp_result?.result;
                const products = result?.products?.product;

                if (!products || products.length === 0) {
                    console.log("⚠️ No products found (but Auth worked!).");
                } else {
                    console.log(`✅ Found ${products.length} Results:\n`);
                    products.forEach((p, i) => {
                        console.log(`${i + 1}. [${p.target_sale_price} ${p.target_sale_price_currency}] ${p.product_title.substring(0, 60)}...`);
                    });
                }
                return;
            }

        } catch (e) {
            console.error("Network Error:", e.message);
        }
    }
    console.error("❌ All Timestamps Failed.");
}

const query = process.argv[2] || "watch";
search(query);
