# कृष्ण — भागवद्गीता आध्यात्मिक मार्गदर्शन — Bot specification

**Archetype:** custom

**Voice:** स्नेहपूर्ण और संवेदनशील — write every user-facing message, button label, error, and empty state in this voice.

एक स्नेहपूर्ण हिन्दी चैटबॉट जो भागवद्गीता के सिद्धांतों से आध्यात्मिक मार्गदर्शन, प्रेरणादायक उद्धरण और संवेदनशील प्रश्नों की मानव समीक्षा सुविधा प्रदान करता है। सामान्य प्रश्नों पर तुरंत स्वचालित उत्तर, जबकि मानसिक स्वास्थ्य/हिंसा संबंधी मामले एक निर्वाचित चैट में भेजे जाते हैं।

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- हिन्दी बोलने वाले भक्त
- आध्यात्मिक मार्गदर्शन चाहने वाले
- भागवद्गीता उद्धरण चाहने वाले

## Success criteria

- उपयोगकर्ता को सही श्लोक/व्याख्या प्रदान करें
- संवेदनशील प्रश्नों को मानव समीक्षा में भेजें
- सभी संदेश सरल हिन्दी में स्नेहपूर्ण टोन में भेजे जाएं
- मानव समीक्षा के लिए नोटिफिकेशन भेजे जाएं

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — मुख्य मेनू खोलें
- **उद्धरण प्राप्त करें** (message, actor: user, command: /उद्धरण) — गीता के यादृच्छिक श्लोक प्रदान करें

## Flows

### उद्धरण अनुरोध
_Trigger:_ मैसेज: 'उद्धरण' या समान शब्द

1. श्लोक चुनें
2. सरल हिन्दी व्याख्या जोड़ें
3. उत्तर भेजें

_Data touched:_ Quote

### सामान्य प्रश्न
_Trigger:_ मैसेज: आध्यात्मिक/दैनिक प्रश्न

1. प्रश्न वर्गीकृत करें
2. स्वचालित उत्तर तैयार करें
3. उत्तर भेजें

_Data touched:_ Message, Response Draft

### संवेदनशील मामला
_Trigger:_ मैसेज: मानसिक स्वास्थ्य/हिंसा संबंधी शब्द

1. संवेदनशीलता फ्लैग करें
2. प्रश्न अडमिन चैट में भेजें
3. यूजर को समीक्षा स्थिति बताएं

_Data touched:_ Message, Response Draft

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — संवेदनशील अनुरोधों के लिए नोटिफ़िकेशन भेजने के लिए चैट आईडी
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **User** _(retention: session)_ — भक्त उपयोगकर्ता प्रोफ़ाइल
  - fields: chat_id, name, language
- **Message** _(retention: session)_ — उपयोगकर्ता संदेश और विश्लेषण
  - fields: text, timestamp, sensitivity_flag
- **Quote** _(retention: persistent)_ — भागवद्गीता श्लोक और व्याख्या
  - fields: shlok_text, context, hindi_explanation
- **Response Draft** _(retention: session)_ — स्वचालित या मानव-समीक्षा उत्तर
  - fields: bot_response, human_response, status

## Integrations

- **Telegram** (required) — बॉट API संवाद
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- ADMIN_CHAT_ID (संवेदनशील अनुरोधों के लिए नोटिफ़िकेशन चैट)

## Notifications

- संवेदनशील प्रश्नों के लिए अडमिन चैट में नोटिफ़िकेशन
- उपयोगकर्ता को समीक्षा स्थिति अपडेट

## Permissions & privacy

- सीमित वार्तालाप इतिहास संग्रहीत करें (डेटा सुरक्षा के लिए)
- संवेदनशील संदेश एन्क्रिप्ट करें
- उपयोगकर्ता डेटा केवल निर्धारित अवधि तक रखें

## Edge cases

- अन्य भाषाओं में संदेश का संसाधन
- अस्पष्ट संवेदनशीलता निर्धारण
- अडमिन द्वारा उत्तर न देने पर यूजर अनुभव

## Required tests

- उद्धरण फ़ीचर के लिए 100+ प्रश्न टेस्ट करें
- संवेदनशील फ़ीडबैक फ़िल्टरिंग टेस्ट
- मानव समीक्षा टोकन के साथ वार्तालाप टेस्ट

## Assumptions

- संवेदनशीलता निर्धारण नियम: मानसिक स्वास्थ्य/आत्महत्या/हिंसा संबंधी शब्दों पर
- हिन्दी उत्तर के लिए शास्त्रीय स्रोतों का उपयोग करें
- कोई भुगतान या विज्ञापन फ़ीचर नहीं
- मानव समीक्षा केवल निर्धारित अवधि तक सक्रिय रहेगी
