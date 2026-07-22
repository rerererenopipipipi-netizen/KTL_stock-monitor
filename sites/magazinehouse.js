import axios from "axios";

export async function checkMagazinehouse(product) {

    try {

        const response = await axios.get(product.url, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const html = response.data;
        
        const inStock =
            html.includes("http://schema.org/InStock");
        
        const outOfStock =
            html.includes("http://schema.org/OutOfStock");
        
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
