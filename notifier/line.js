import axios from "axios";
import "dotenv/config";

export async function sendLine(message) {

    try {

        await axios.post(
            "https://api.line.me/v2/bot/message/broadcast",
            {
                messages: [
                    {
                        type: "text",
                        text: message
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ LINE配信成功");

    } catch (error) {

        console.log("❌ LINE配信失敗");

        console.log(error.response?.data || error.message);

    }

}