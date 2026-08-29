import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "गीता उद्धरण", data: "quote:show", order: 10 });

type Quote = { verse: string; reference: string; explanation: string };

// Fixed, attributed primary-source verses; selection rotates without invented data.
const QUOTES: readonly Quote[] = [
  { verse: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।", reference: "भगवद्गीता 2.47", explanation: "तुम्हारा अधिकार अपने सच्चे कर्म पर है। फल की चिंता छोड़कर अगला सही कदम उठाओ।" },
  { verse: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।", reference: "भगवद्गीता 2.48", explanation: "मन को संतुलित रखकर काम करो। सफलता और असफलता दोनों में अपनी शांति न खोओ।" },
  { verse: "उद्धरेदात्मनाऽत्मानं नात्मानमवसादयेत्।", reference: "भगवद्गीता 6.5", explanation: "अपने मन को सहारा दो, उसे गिरने मत दो। आज अपने लिए एक छोटा दयालु काम चुनो।" },
  { verse: "श्रद्धावान् लभते ज्ञानं तत्परः संयतेन्द्रियः।", reference: "भगवद्गीता 4.39", explanation: "श्रद्धा, लगन और संयम से समझ गहरी होती है। धीरे-धीरे चलना भी आगे बढ़ना है।" },
  { verse: "समत्वं योग उच्यते।", reference: "भगवद्गीता 2.48", explanation: "सुख और कठिनाई के बीच मन का संतुलन ही योग है। एक शांत साँस लेकर फिर से शुरू करें।" },
];

function quoteText(ctx: Ctx): string {
  const offset = Math.abs(ctx.chat?.id ?? 0) % QUOTES.length;
  const turn = ctx.message?.message_id ?? 0;
  const quote = QUOTES[(offset + turn) % QUOTES.length] ?? QUOTES[0]!;
  return `“${quote.verse}”\n${quote.reference}\n\n${quote.explanation}`;
}

const quoteKeyboard = inlineKeyboard([
  [inlineButton("एक और उद्धरण", "quote:another")],
  [inlineButton("वापस मेनू में", "menu:main")],
]);

async function sendQuote(ctx: Ctx): Promise<void> {
  await ctx.reply(quoteText(ctx), { reply_markup: quoteKeyboard });
}

const composer = new Composer<Ctx>();

// This is the blueprint's explicit typed shortcut; the menu button is primary.
composer.command("उद्धरण", sendQuote);
composer.hears(/^(उद्धरण|श्लोक|गीता उद्धरण|quote)$/iu, sendQuote);
// Telegram command parsing is ASCII-oriented; this keeps the Hindi shortcut
// reliable when Telegram supplies it as ordinary text.
composer.hears(/^\/उद्धरण(?:@[A-Za-z0-9_]+)?$/u, sendQuote);
composer.callbackQuery(["quote:show", "quote:another"], async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(quoteText(ctx), { reply_markup: quoteKeyboard });
});

export default composer;
