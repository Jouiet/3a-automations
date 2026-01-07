document.addEventListener('DOMContentLoaded', async () => {
    const nameEl = document.getElementById('productName');
    const priceEl = document.getElementById('productPrice');
    const imgEl = document.getElementById('productImage');
    const webhookInput = document.getElementById('webhookUrl');
    const sendBtn = document.getElementById('sendBtn');

    let currentData = null;

    // 1. Load Settings
    chrome.storage.sync.get(['webhookUrl'], (result) => {
        if (result.webhookUrl) {
            webhookInput.value = result.webhookUrl;
        }
    });

    // 2. Save Settings on Input
    webhookInput.addEventListener('change', () => {
        const url = webhookInput.value.trim();
        if (url) {
            chrome.storage.sync.set({ webhookUrl: url });
        }
    });

    // 3. Trigger Scrape
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab?.id) {
            // Execute script just in case it wasn't injected automatically
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }, () => {
                // Send message to scraper
                chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
                    if (chrome.runtime.lastError) {
                        nameEl.textContent = "Error: Please refresh page";
                        console.error(chrome.runtime.lastError);
                        return;
                    }

                    if (response) {
                        currentData = response;
                        renderPreview(response);
                    } else {
                        nameEl.textContent = "No data found.";
                    }
                });
            });
        }
    } catch (err) {
        nameEl.textContent = "Connection Error";
        console.error(err);
    }

    function renderPreview(data) {
        nameEl.textContent = data.name || "Unknown Product";
        priceEl.textContent = data.price ? `${data.price} ${data.currency}` : "N/A";

        if (data.image) {
            imgEl.src = data.image;
            imgEl.style.display = 'block';
        }
    }

    // 4. Send to Agency
    sendBtn.addEventListener('click', async () => {
        const url = webhookInput.value.trim();
        if (!url) {
            alert("⚠️ Please configure your Destination URL first.");
            return;
        }

        if (!currentData) {
            alert("⚠️ No product data to send.");
            return;
        }

        sendBtn.textContent = "Sending...";
        sendBtn.disabled = true;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: '3A_CHROME_EXTENSION',
                    agent_id: 'GLOBAL_OPTIMUM_V1',
                    payload: currentData
                })
            });

            if (res.ok) {
                sendBtn.textContent = "✅ Sent Successfully!";
                setTimeout(() => {
                    sendBtn.textContent = "🚀 Send to Agency";
                    sendBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(`Server Error: ${res.status}`);
            }
        } catch (err) {
            alert(`❌ Failed to send: ${err.message}`);
            sendBtn.textContent = "Retry Send";
            sendBtn.disabled = false;
        }
    });
});
