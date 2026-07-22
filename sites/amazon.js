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

        // 実際に表示されている「ショッピングを続ける」だけを探す
        const continueButton = page.locator(
            'button:visible:has-text("ショッピングを続ける"), ' +
            'a:visible:has-text("ショッピングを続ける"), ' +
            'input:visible[value="ショッピングを続ける"]'
        );

        if (await continueButton.count() > 0) {
            console.log("Amazon 続行画面を検出");

            await continueButton.first().click({
                timeout: 10000
            });

            await page.waitForLoadState("domcontentloaded", {
                timeout: 60000
            }).catch(() => {});

            await page.waitForTimeout(5000);
        }

        console.log("Amazon 現在URL:", page.url());
        console.log("Amazon タイトル:", await page.title());

        // HTML確認
        const html = await page.content();

        console.log(
            "add-to-cart:",
            html.includes("add-to-cart-button")
        );

        console.log(
            "submit.add-to-cart:",
            html.includes("submit.add-to-cart")
        );

        console.log(
            "buy-now:",
            html.includes("buy-now-button")
        );

        // ページ上の実際の購入ボタンを確認
        const cartButton = page.locator(
            '#add-to-cart-button, input[name="submit.add-to-cart"]'
        );

        const buyNowButton = page.locator(
            '#buy-now-button, input[name="submit.buy-now"]'
        );

        const hasCartButton =
            await cartButton.count() > 0 &&
            await cartButton.first().isVisible().catch(() => false);

        const hasBuyNowButton =
            await buyNowButton.count() > 0 &&
            await buyNowButton.first().isVisible().catch(() => false);

        // テキスト確認
        const text = await page.locator("body").innerText();

        console.log("Amazon ページ先頭:");
        console.log(text.substring(0, 500));

        const hasStock = text.includes("在庫あり");

        const outOfStock =
            text.includes("現在在庫切れ") ||
            text.includes("一時的に在庫切れ") ||
            text.includes("現在お取り扱いできません") ||
            text.includes("現在ご注文いただけません");

        console.log("Amazon 在庫あり表示:", hasStock);
        console.log("Amazon カートボタン:", hasCartButton);
        console.log("Amazon 今すぐ買うボタン:", hasBuyNowButton);
        console.log("Amazon 在庫切れ表示:", outOfStock);

        const inStock =
            (hasCartButton || hasBuyNowButton) &&
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
