import { chromium } from "playwright";

export async function checkHmv(product) {

    let browser;

    try {

        browser = await chromium.launch({
            headless: true
        });

        const page = await browser.newPage({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        });

        await page.goto(product.url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await page.waitForTimeout(5000);

        const text = await page.locator("body").innerText();

        const outOfStock =
            text.includes("現在オンラインでご注文いただけません") ||
            text.includes("注文不可");

        const inStock =
            text.includes("カートに入れる") &&
            text.includes("在庫あり");
            !outOfStock;

        await browser.close();

        return {
            success: true,
            inStock
        };

    } catch (error) {

        if (browser) {
            await browser.close();
        }

        return {
            success: false,
            inStock: false,
            error: error.message
        };

    }

}
