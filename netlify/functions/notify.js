exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Allow": "POST" }, body: "Method Not Allowed" };
  }

  // لا نقبل ولا نمرر أي قيم حقول من المتصفح.
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  if (payload.event !== "awareness_demo_submission") {
    return { statusCode: 400, body: "Invalid event" };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { statusCode: 500, body: "Missing server configuration" };
  }

  const forwarded = event.headers["x-nf-client-connection-ip"] ||
                    event.headers["x-forwarded-for"] || "";
  const ip = String(forwarded).split(",")[0].trim() || "غير متاح";
  const userAgent = String(event.headers["user-agent"] || "غير متاح").slice(0, 250);
  const timestamp = new Date().toISOString();

  const message =
    "إشعار محاكاة توعوية\\n" +
    "الحدث: إرسال نموذج تدريبي\\n" +
    "IP: " + ip + "\\n" +
    "الوقت: " + timestamp + "\\n" +
    "المتصفح: " + userAgent + "\\n" +
    "ملاحظة: لم يتم استلام أو إرسال قيم الحقول.";

  const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });

  if (!tg.ok) {
    return { statusCode: 502, body: "Telegram notification failed" };
  }
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: '{"ok":true}' };
};
