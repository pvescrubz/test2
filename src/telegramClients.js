// telegramClients.js
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");

let clients = [];

async function initTelegramClients() {
    console.log("🔄 Подключаю Telegram-аккаунты...");

    const accounts = require("./accounts.json");

    for (const acc of accounts) {
        const client = new TelegramClient(
            new StringSession(acc.session),
            parseInt(process.env.API_ID),
            process.env.API_HASH,
            {
                connectionRetries: 5,
            }
        );

        await client.connect();

        const isAuthorized = await client.isUserAuthorized();
        if (!isAuthorized) {
            console.warn(`⚠️ Аккаунт ${acc.id} не авторизован`);
            await client.disconnect();
            continue;
        }

        const self = await client.getMe();
        console.log(`✅ Аккаунт ${acc.id} (${self.username}) подключен`);

        let vkUserId = null;
        if (acc.vk_token) {
            vkUserId = await getVkUserId(acc.vk_token);
        }

        clients.push({
            id: acc.id,
            client,
            username: self.username,
            vk_token: acc.vk_token,
            vk_user_id: vkUserId,
        });

        await delay(500); // Задержка между подключениями
    }

    if (clients.length === 0) {
        console.error("❌ Нет подключённых Telegram-аккаунтов");
        process.exit(1);
    }

    console.log("✅ Telegram клиенты готовы к работе");
}

function getClientByVkToken(vkToken) {
    return clients.find(acc => acc.vk_token === vkToken);
}

async function getVkUserId(vkToken) {
    try {
        const res = await axios.get("https://api.vk.com/method/users.get",  {
            params: {
                access_token: vkToken,
                v: "5.199"
            }
        });

        return res.data.response?.[0]?.id || null;

    } catch (err) {
        console.error("❌ Ошибка получения ID из ВК:", err.message);
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    initTelegramClients,
    getClientByVkToken
};