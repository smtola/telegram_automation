import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const BOT_TOKEN = "7314683639:AAE7D556JD3AJL8sd9bmXsiVYZt7wz1ht3M";
const GROUP_CHAT_ID = "-1002355773121";

// Replace these with your AppSheet info
const APPSHEET_API_URL =
  "https://api.appsheet.com/api/v2/apps/0a8af6f9-8b8a-4fc8-a4f4-d125d4852bfd/tables/Point/Action";
const APPSHEET_API_KEY = "V2-QKgXJ-kpOoL-uI7Ah-YEr3o-Je72R-QU07D-darL4-vnudE";

// Function to fetch data from AppSheet
async function fetchAppSheetData() {
  try {
    const response = await axios.post(
      APPSHEET_API_URL,
      {
        Action: "Find",
        Properties: {},
        Rows: [],
      },
      {
        headers: {
          ApplicationAccessKey: APPSHEET_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching AppSheet data:", err.message);
    throw err;
  }
}

// Format AppSheet record into text message
function formatSelectedFieldsMarkdown(record) {
  const fields = ["UUID", "Tel_ID", "Username", "Point"];

  // Escape special characters and ensure proper Markdown formatting
  return fields
    .map((field) => {
      const value = record[field] || "";
      // Escape special characters that could break Markdown
      const escapedValue = value
        .toString()
        .replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
      return `*${field}:* ${escapedValue}`;
    })
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  console.log("=== Incoming Webhook Request ===");
  console.log("Headers:", req.headers);
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const message = req.body.message;
  // console.log("Message text:", message?.text);
  // console.log("Chat ID:", message?.chat?.id);

  if (
    message?.text === "/mypoint" ||
    message?.text === "/mypoint@harulaid_bot"
  ) {
    console.log("Command matched, sending messages...");

    try {
      // Fetch data from AppSheet
      const appSheetData = await fetchAppSheetData();
      if (!appSheetData || appSheetData.length === 0) {
        throw new Error("No data found in AppSheet");
      }

      // Find the matching record
      const matchingRecord = appSheetData.find(
        (element) => element.Tel_ID == message?.from?.id
      );

      if (matchingRecord) {
        const formattedText = formatSelectedFieldsMarkdown(matchingRecord);
        // Send message to Telegram group
        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            chat_id: GROUP_CHAT_ID,
            text: formattedText,
            parse_mode: "Markdown",
          }
        );
      } else {
        // Send message only if no matching record is found
        await axios.post(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            chat_id: GROUP_CHAT_ID,
            text: "No found data record!",
            parse_mode: "Markdown",
          }
        );
      }
    } catch (err) {
      console.error("=== Telegram or AppSheet API Error ===");
      console.error("Error details:", err.response?.data || err.message);

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
  }
  if (message?.text === "/address@harulaid_bot") {
    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: GROUP_CHAT_ID,
        text: "K Mall Veng Sreng Blvd, Phnom Penh",
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error("=== Telegram or AppSheet API Error ===");
      console.error("Error details:", err.response?.data || err.message);

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

  res.status(200).json({ message: "OK" });
}

// Use the handler as middleware
app.post("/webhook", handler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
