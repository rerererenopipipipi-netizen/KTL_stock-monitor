import products from "./config/products.json" with { type: "json" };
import { checkTower } from "./sites/tower.js";
import { checkMagazinehouse } from "./sites/magazinehouse.js";
import { checkSevennet } from "./sites/sevennet.js";
import { checkKinokuniya } from "./sites/kinokuniya.js";
import { checkAmazon } from "./sites/amazon.js";
import { checkHmv } from "./sites/hmv.js";
import { checkMaruzen } from "./sites/maruzen.js";
import { sendLine } from "./notifier/line.js";
import { createClient } from "@supabase/supabase-js";

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


    // 前回の在庫状態を取得
    const { data: oldStatus, error: selectError } = await supabase
    .from("stock_status")
    .select("*")
    .eq("product_id", product.id);


    if (selectError) {

        console.log("前回状態取得エラー");
        console.log(selectError);

    }


    // 在庫なし → 在庫ありになった時だけ通知
    if (
    oldStatus.length > 0 &&
    oldStatus[0].in_stock === false &&
    result.inStock === true
    )
    
    {

    const { data: setting } = await supabase
        .from("settings")
        .select("notify_enabled")
        .eq("id", 1)
        .single();
    if (setting?.notify_enabled) {
    
    await sendLine(
`📦 再入荷通知

販売サイト：${
    product.site === "tower"
    ? "タワレコオンライン"
    : product.site === "magazinehouse"
    ? "マガジンハウス"
    : product.site === "sevennet"
    ? "セブンネット"
    : product.site === "kinokuniya"
    ? "紀伊國屋WEBストア"
    : product.site === "amazon"
    ? "Amazon"
    : product.site === "hmv"
    ? "HMV&BOOKS online"
    : product.site === "maruzen"
}
商品：${product.name}

🔗 ${product.url}`
    );

    console.log("再入荷通知送信");

} else {

    console.log("通知OFFのため送信しません");

}
}

    // stock_status更新
    const { error: updateError } = await supabase
    .from("stock_status")
    .update({
        site: product.site,
        name: product.name,
        url: product.url,
        in_stock: result.inStock,
        updated_at: new Date()
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
