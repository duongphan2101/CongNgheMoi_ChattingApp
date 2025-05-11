const axios = require("axios");

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data, // dữ liệu kèm theo (optional)
    });
    console.log(`✅ Push sent to ${expoPushToken}`);
  } catch (error) {
    console.error("❌ Push error:", error.response?.data || error.message);
  }
}

module.exports = sendPushNotification;