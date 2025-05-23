import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const BOT_TOKEN = "7811188244:AAHKAHIgY56uQwSyTMISvr-9J8L3O-mQJrc"; // Replace with your bot token
const GROUP_CHAT_ID = "-1002355773121"; // Replace with your Telegram group chat ID

app.post("/webhook", async (req, res) => {
  console.log("=== Incoming Webhook Request ===");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const message = req.body.message;
  console.log("Message text:", message?.text);
  console.log("Chat ID:", message?.chat?.id);

  // Check for both /senddata and /senddata@harulaid_bot
  if (
    message?.text === "/senddata" ||
    message?.text === "/senddata@harulaid_bot"
  ) {
    console.log("Command matched, sending messages...");
    try {
      // Send message to group
      const groupResponse = await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          chat_id: GROUP_CHAT_ID,
          text: "📡 *Automation data sent to the group!*\n\n*Record ID:* 123456789\n*Timestamp:* 2025-05-23T14:35:00Z\n\n*Customer Info:*\n- ID: cust_001\n- Name: John Doe\n- Email: john.doe@example.com\n- Phone: +1234567890\n\n*Product Info:*\n- ID: prod_101\n- Name: Wireless Headphones\n- Category: Electronics\n- Quantity: 1\n- Price: 99.99 USD\n\n*Shipment Info:*\n- Tracking Number: TRACK123456789\n- Carrier: FedEx\n- Status: Shipped\n- Estimated Delivery: 2025-05-28\n\n*Notification:*\n- Message: 📡 Automation data sent to the group!\n- Sent To: Telegram Group - Customer Notifications\n- Sent At: 2025-05-23T14:36:00Z",
        }
      );
      console.log("Group message response:", groupResponse.data);

      // Send confirmation to user
    //   const userResponse = await axios.post(
    //     `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    //     {
    //       chat_id: message.chat.id,
    //       text: "✅ Automation data has been sent to the group!",
    //     }
    //   );
    //   console.log("User confirmation response:", userResponse.data);
    } catch (err) {
      console.error("=== Telegram API Error ===");
      console.error("Error details:", err.response?.data || err.message);
      console.error("Status code:", err.response?.status);
      console.error("Headers:", err.response?.headers);

      // Send error message to user
      try {
        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            chat_id: message.chat.id,
            text: "❌ Error sending data. Please try again later.",
          }
        );
      } catch (error) {
        console.error("Failed to send error message:", error.message);
      }
    }
  } else {
    console.log("Command did not match");
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
