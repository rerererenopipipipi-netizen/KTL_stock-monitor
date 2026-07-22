import { chromium } from "playwright";

export async function checkSevennet(product) {
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

        const productInfo = await page.evaluate(() => {
            return window.product_info_json?.[0] || null;
        });

        const stockFlg = productInfo?.stock_flg === true;
        const btnLabel = productInfo?.item?.btn_label || "";
        const stockInfo = productInfo?.item?.cart_info?.stock_status?.info || "";
        
        console.log("sevennet stock_flg:", productInfo?.stock_flg);
        console.log("sevennet btn_label:", btnLabel);
        console.log("sevennet stock_info:", stockInfo);

        const inStock =
            stockFlg &&
            btnLabel !== "在庫切れ";
        
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
