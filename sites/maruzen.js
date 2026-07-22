import { chromium } from "playwright";

export async function checkMaruzen(product) {

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

        const netstoreText = await page
            .locator("#netstore-stock")
            .innerText()
            .catch(() => "");

        console.log("丸善ネットストア在庫:");
        console.log(netstoreText);

        const inStock =
            netstoreText.includes("提携倉庫在庫あり") ||
            netstoreText.includes("在庫△") ||
            netstoreText.includes("在庫○") ||
            netstoreText.includes("在庫あり");

        const outOfStock =
            netstoreText.includes("在庫なし") ||
            netstoreText.includes("お取り扱いできません");

        await browser.close();

        return {
            success: true,
            inStock: inStock && !outOfStock
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
