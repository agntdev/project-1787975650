import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

// /help — plain-language explanation for non-technical users. This bot is
// button-driven: tell the user to tap /start to open the menu rather than listing
// slash commands. The same text is shown when the user taps the Help button on the
// main menu (`menu:help`). Enhance the copy for your specific bot; keep it short.
const composer = new Composer<Ctx>();

const HELP =
  "मैं गीता के श्लोक और रोज़मर्रा के प्रश्नों पर सरल मार्गदर्शन देता हूँ।\n\n" +
  "उद्धरण पाने के लिए बटन दबाएँ, या अपना प्रश्न सीधे लिखें।\n\n" +
  "अगर बात मन की सुरक्षा या हिंसा से जुड़ी है, तो उसे मानवीय समीक्षा के लिए भेजा जाता है।";

const backToMenu = inlineKeyboard([[inlineButton("वापस मेनू में", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
