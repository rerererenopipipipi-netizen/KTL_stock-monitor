import { checkTower } from "./sites/tower.js";
import { checkMagazinehouse } from "./sites/magazinehouse.js";
import { checkSevennet } from "./sites/sevennet.js";
import { checkKinokuniya } from "./sites/kinokuniya.js";
import { checkAmazon } from "./sites/amazon.js";
import { checkHmv } from "./sites/hmv.js";
import { checkMaruzen } from "./sites/maruzen.js";
import { sendLine } from "./notifier/line.js";
import { createClient } from "@supabase/supabase-js";


// ======================
// 監視対象商品をSecretから取得
// ======================

const productsJson = process.env.PRODUCTS_JSON;

if (!productsJson) {
    throw new Error("PRODUCTS_JSON が設定されていません");
}

let products;

try {
    products = JSON.parse(productsJson);
} catch (error) {
    throw new Error(
        `PRODUCTS_JSONの形式が正しくありません：${error.message}`
    );
}


// ======================
// Supabase接続
// ======================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);


console.log("=================================");
console.log(" 在庫監視ツール");
console.log("=================================\n");


for (const product of products) {

    if (!product.enabled) continue;


    console.log(
        `確認中：[${product.site}] ${product.name}`
    );


    let result;


    switch (product.site) {

        case "tower":
            result = await checkTower(product);
            break;

        case "magazinehouse":
            result = await checkMagazinehouse(product);
            break;

        case "sevennet":
            result = await checkSevennet(product);
            break;

        case "kinokuniya":
            result = await checkKinokuniya(product);
            break;

        case "amazon":
            result = await checkAmazon(product);
            break;

        case "hmv":
            result = await checkHmv(product);
            break;

        case "maruzen":
            result = await checkMaruzen(product);
            break;

        default:
            console.log("未対応サイト");
            continue;
    }


    if (!result.success) {

        console.log("ページ取得失敗");
        console.log(result.error);
        continue;
    }


    if (result.inStock) {

        console.log("🟢 注文可能");

    } else {

        console.log("🔴 現在注文不可");
    }


    // ======================
    // 前回の在庫状態を取得
    // ======================

    const {
        data: oldStatus,
        error: selectError
    } = await supabase
        .from("stock_status")
        .select("*")
        .eq("product_id", product.id);


    if (selectError) {

        console.log("前回状態取得エラー");
        console.log(selectError);
    }


    // ======================
    // 在庫なし → 在庫ありで通知
    // ======================

    if (
        (oldStatus ?? []).length > 0 &&
        oldStatus[0].in_stock === false &&
        result.inStock === true
    ) {

        const {
            data: setting,
            error: settingError
        } = await supabase
            .from("settings")
            .select("notify_enabled")
            .eq("id", 1)
            .single();


        if (settingError) {

            console.log("通知設定取得エラー");
            console.log(settingError);

        } else if (setting?.notify_enabled) {

            const siteNames = {
                tower: "タワレコオンライン",
                magazinehouse: "マガジンハウス",
                sevennet: "セブンネット",
                kinokuniya: "紀伊國屋WEBストア",
                amazon: "Amazon",
                hmv: "HMV&BOOKS online",
                maruzen: "丸善ジュンク堂ネットストア"
            };


            const siteName =
                siteNames[product.site] ?? product.site;


            const notificationUrl =
                product.notifyUrl || product.url;


            await sendLine(
`📦 再入荷通知

販売サイト：${siteName}
商品：${product.name}

🔗 ${notificationUrl}`
            );


            console.log("再入荷通知送信");

        } else {

            console.log("通知OFFのため送信しません");
        }
    }


    // ======================
    // stock_status更新
    // ======================

    const { error: updateError } = await supabase
        .from("stock_status")
        .update({
            site: product.site,
            name: product.name,
            url: product.url,
            in_stock: result.inStock,
            updated_at: new Date().toISOString()
        })
        .eq("product_id", product.id);


    if (updateError) {

        console.log("状態更新エラー");
        console.log(updateError);

    } else {

        console.log("状態更新OK");
    }


    console.log("");
}
