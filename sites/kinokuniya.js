import axios from "axios";

export async function checkKinokuniya(product) {

    try {

        const response = await axios.get(product.url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const html = response.data;
        
        const inStock =
            html.includes('value="カートに入れる"') ||
            html.includes("ウェブストアに") && html.includes("在庫がございます");
        
        const outOfStock =
            html.includes("ただいまウェブストアではご注文を受け付けておりません。");
        
        return {
            success: true,
            inStock: inStock && !outOfStock
        };

    } catch (error) {

        return {
            success: false,
            inStock: false,
            error: error.message
        };

    }

}
