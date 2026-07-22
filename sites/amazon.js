import { chromium } from "playwright";

export async function checkAmazon(product) {
    let browser;

    try {
        browser = await chromium.launch({
            headless: true
        });

        const page = await browser.newPage({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/138.0.0.0 Safari/537.36",
            locale: "ja-JP"
        });

        await page.goto(product.url, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await page.waitForTimeout(3000);

        // Amazonの「ショッピングを続ける」画面が出た場合
        const continueButton = page.getByText("ショッピングを続ける", {
            exact: true
        });

        if (await continueButton.count() > 0) {
            console.log("Amazon 続行画面を検出");

            await continueButton.first().click();

            await page.waitForLoadState("domcontentloaded", {
                timeout: 60000
            }).catch(() => {});

            await page.waitForTimeout(5000);
        }

        const text = await page.locator("body").innerText();

        console.log("Amazon ページ先頭:");
        console.log(text.substring(0, 500));

        const hasStock = text.includes("在庫あり");
        const hasCart = text.includes("カートに入れる");
        const hasBuyNow = text.includes("今すぐ買う");
        const hasAmazon = text.includes("Amazon.co.jp");

        const outOfStock =
            text.includes("現在在庫切れ") ||
            text.includes("一時的に在庫切れ") ||
            text.includes("現在お取り扱いできません");

        console.log("Amazon 在庫あり:", hasStock);
        console.log("Amazon カート:", hasCart);
        console.log("Amazon 今すぐ買う:", hasBuyNow);
        console.log("Amazon Amazon.co.jp:", hasAmazon);
        console.log("Amazon 在庫切れ:", outOfStock);

        const inStock =
            (hasCart || hasBuyNow) &&
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
