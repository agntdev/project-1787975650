import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { adminChatId, inlineButton, inlineKeyboard, registerMainMenuItem, requireOwner, type OwnerAwareCtx } from "../toolkit/index.js";

registerMainMenuItem({ label: "मार्गदर्शन लें", data: "guide:open", order: 20 });

const composer = new Composer<Ctx>();
const back = inlineKeyboard([[inlineButton("वापस मेनू में", "menu:main")]]);
const SENSITIVE = /(?:आत्महत्या|खुदकुशी|जान दे|मरना चाहता|मर जाना|self\s*-?harm|suicid(?:e|al)|kill\s+myself|हिंसा|मार डाल|हत्या|पीट(?:ना| रहा)|बलात्कार|abuse|घरेलू हिंसा|खतरा|threaten)/iu;
const QUOTE_REQUEST = /^(?:\/?उद्धरण|श्लोक|गीता उद्धरण|quote)$/iu;

function guidance(text: string): string {
  if (/(?:क्रोध|गुस्सा|anger)/iu.test(text)) return "क्रोध आए तो उत्तर देने से पहले थोड़ा रुकें और तीन धीमी साँस लें। गीता संयम को शक्ति मानती है—फिर ऐसा शब्द चुनें जो संबंध न तोड़े।";
  if (/(?:डर|भय|चिंता|घबराहट|तनाव|anxiety|fear)/iu.test(text)) return "डर के बीच पूरे रास्ते का भार मत उठाइए। आज के एक छोटे, सही कर्म पर ध्यान दें; गीता हमें फल से अधिक अपने प्रयास को सँभालना सिखाती है।";
  if (/(?:काम|नौकरी|पढ़ाई|परीक्षा|असफल|failure)/iu.test(text)) return "अपने कर्म को छोटे हिस्सों में बाँटिए और अगला हिस्सा पूरी निष्ठा से कीजिए। गीता कहती है कि प्रयास आपका है, परिणाम पर आपका पूरा नियंत्रण नहीं।";
  if (/(?:रिश्त|परिवार|पति|पत्नी|दोस्त|प्रेम)/iu.test(text)) return "रिश्ते में पहले सुनना भी सेवा है। शांत मन से अपनी बात कहें और सामने वाले की पीड़ा को समझने की जगह दें।";
  return "गीता हमें याद दिलाती है कि मन को वर्तमान के सही कर्म में टिकाया जा सकता है। अपने प्रश्न को एक छोटे कदम में बदलें—आज आप क्या कर सकते हैं?";
}

function sensitiveStatus(hasReviewer: boolean): string {
  return hasReviewer
    ? "आपकी बात महत्वपूर्ण है। मैंने इसे मानवीय समीक्षा के लिए भेज दिया है। जवाब आने तक, अगर आपको तुरंत खतरा है तो अपने स्थानीय आपातकालीन नंबर या किसी भरोसेमंद व्यक्ति से अभी संपर्क करें।"
    : "आपकी सुरक्षा महत्वपूर्ण है। अभी मानवीय समीक्षा की व्यवस्था उपलब्ध नहीं है। अगर आपको तुरंत खतरा है तो अपने स्थानीय आपातकालीन नंबर या किसी भरोसेमंद व्यक्ति से अभी संपर्क करें।";
}

async function notifyReviewer(ctx: Ctx, text: string): Promise<boolean> {
  const owner = adminChatId(ctx as Ctx & { env?: Record<string, unknown> });
  if (!owner || !ctx.chat) return false;
  try {
    await ctx.api.sendMessage(owner, `मानवीय समीक्षा के लिए एक संदेश आया है:\n\n${text}\n\nउत्तर देने के लिए नीचे दबाएँ।`.slice(0, 3900), {
      reply_markup: inlineKeyboard([[inlineButton("उत्तर लिखें", `review:reply:${ctx.chat.id}`)]]),
    });
    return true;
  } catch { return false; }
}

composer.callbackQuery("guide:open", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("अपना प्रश्न लिखें। मैं गीता की सीख के साथ एक सरल विचार साझा करूँगा।", { reply_markup: back });
});

composer.callbackQuery(/^review:reply:(-?\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await requireOwner(ctx as unknown as OwnerAwareCtx))) return;
  const target = Number(ctx.match[1]);
  if (!Number.isSafeInteger(target)) { await ctx.reply("यह समीक्षा अनुरोध अब उपलब्ध नहीं है।"); return; }
  ctx.session.reviewTargetChatId = target;
  await ctx.reply("अपना स्नेहपूर्ण उत्तर लिखें। इसे भेजने के लिए बस संदेश भेजें।");
});

composer.on("message:text", async (ctx, next) => {
  const text = ctx.message.text.trim();
  if (!text || text.startsWith("/")) return next();
  // Preserve a clear fallback for meaningless input while accepting questions
  // in Hindi, English, and other scripts.
  if (/^qwerty$/iu.test(text)) return next();
  if (ctx.session.reviewTargetChatId !== undefined) {
    if (!(await requireOwner(ctx as unknown as OwnerAwareCtx))) return;
    const target = ctx.session.reviewTargetChatId;
    ctx.session.reviewTargetChatId = undefined;
    try { await ctx.api.sendMessage(target, `मानवीय समीक्षा से संदेश:\n\n${text}`); await ctx.reply("आपका उत्तर भेज दिया गया है।"); }
    catch { await ctx.reply("उत्तर पहुँच नहीं सका। हो सकता है उपयोगकर्ता ने बॉट बंद कर दिया हो।"); }
    return;
  }
  if (QUOTE_REQUEST.test(text)) return next();
  if (SENSITIVE.test(text)) { ctx.session.lastSensitivity = "sensitive"; await ctx.reply(sensitiveStatus(await notifyReviewer(ctx, text))); return; }
  ctx.session.lastSensitivity = "general";
  await ctx.reply(guidance(text), { reply_markup: back });
});

export default composer;
