import { chromium } from "playwright";

export async function checkAmazon(product) {
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

        const hasStock = text.includes("在庫あり");
        const hasCart = text.includes("カートに入れる");
        const hasBuyNow = text.includes("今すぐ買う");
        const hasAmazon = text.includes("Amazon.co.jp");
        const hasPrice = text.includes("￥880");

        const outOfStock =
            text.includes("現在在庫切れ") ||
            text.includes("一時的に在庫切れ") ||
            text.includes("現在お取り扱いできません");

        console.log("Amazon 在庫あり:", hasStock);
        console.log("Amazon カート:", hasCart);
        console.log("Amazon 今すぐ買う:", hasBuyNow);
        console.log("Amazon Amazon.co.jp:", hasAmazon);
        console.log("Amazon ￥880:", hasPrice);
        console.log("Amazon 在庫切れ:", outOfStock);

        const inStock =
            (hasCart || hasBuyNow) &&
            hasAmazon &&
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
