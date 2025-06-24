const path = require("path");
const TelegramBot = require('node-telegram-bot-api');
const ACCOUNTS = require("./accounts.json");
const axios = require("axios"); // Импортируем axios
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Указываем путь к .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_THREAD = process.env.TELEGRAM_THREAD;
const { v4: uuidv4 } = require("uuid"); // Для уникальных ID задач
const express = require("express");
const multer = require("multer");
const fs = require("fs"); // Импортируем fs
const { writePost, uploadPhotoToVK, uploadVideoToVK } = require("./vk-api");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Статические файлы
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

console.log("Telegram Bot Token:", process.env.TELEGRAM_BOT_TOKEN);
console.log("Chat ID:", process.env.TELEGRAM_CHAT_ID);
console.log("Thread ID:", process.env.TELEGRAM_THREAD);

// === Отправка сообщения в Telegram ===

const { initTelegramClients, getClientByVkToken } = require('./telegramClients');

// === Подключение Telegram клиентов при запуске сервера ===
initTelegramClients().catch(err => {
    console.error("❌ Ошибка при инициализации Telegram-аккаунтов:", err.message);
});

async function sendToTelegram(usernames, links, type = 'post') {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("⚠️ Telegram API данные не указаны");
        return;
    }

    const header = type === 'post' ? 'Сделаны посты от:' : 'Сделаны репосты от:';
    const usernamesText = usernames.join(', ');
    const linksText = "```\n" + links.join("\n") + "\n```";
    const message = `${header}\n${usernamesText}\nСсылки:\n${linksText}`;

    try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
            parse_mode: 'MarkdownV2',
            message_thread_id: TELEGRAM_THREAD
        });
        console.log("✅ Успешно отправлено в ТГ");
    } catch (error) {
        console.error("❌ Ошибка при отправке в ТГ:", error.message);
        if (error.response && error.response.body) {
            console.error("📨 Подробности ошибки:", error.response.body);
        }
    }
}

// === Отправка ссылки с конкретного Telegram-аккаунта ===
const { StringSession } = require("telegram/sessions");
const { Api, TelegramClient } = require("telegram");

async function sendLinkFromTelegramAccount(vkToken, link) {
    try {
        const account = ACCOUNTS.find(acc => acc.vk_token === vkToken);
        if (!account) {
            console.warn(`🚫 Аккаунт не найден для токена ${vkToken}`);
            return;
        }

        const client = new TelegramClient(
            new StringSession(account.session),
            parseInt(process.env.API_ID),
            process.env.API_HASH,
            { connectionRetries: 3 }
        );

        await client.connect();
        await client.sendMessage(account.telegram_chat_id, { message: link });
        console.log(`📨 [Аккаунт ${account.id}] Ссылка отправлена: ${link}`);
        await client.disconnect();

    } catch (err) {
        console.error(`❌ Ошибка при отправке ссылки:`, err.message);
    }
}

// === GET маршруты ===
app.get("/ksadwqe213x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe213x.html");
    res.sendFile(filePath);
});

app.get("/ksadwqe216x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe216x.html");
    res.sendFile(filePath);
});

app.get("/ksadwqe214x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe214x.html");
    res.sendFile(filePath);
});

app.get("/ksadwqe215x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe215x.html");
    res.sendFile(filePath);
});

app.get("/ksadwqe217x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe217x.html");
    res.sendFile(filePath);
});

app.get("/ksadwqe218x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe218x.html");
    res.sendFile(filePath);
});

app.get("/like", (req, res) => {
    const filePath = path.join(__dirname, "../public/like.html");
    res.sendFile(filePath);
});

// === Маршрут /add-likes ===
app.get('/add-likes', async (req, res) => {
    const { link } = req.query;
    if (!link) return res.status(400).json({ error: 'Ссылка обязательна' });

    let ownerId, postId;
    try {
        const parsedLink = parsePostLink(link);
        if (!parsedLink) return res.status(400).json({ error: 'Некорректный формат ссылки' });
        ({ ownerId, postId } = parsedLink);
    } catch (e) {
        return res.status(400).json({ error: `Ошибка парсинга ссылки: ${e.message}` });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const allTokens = Object.entries(process.env)
        .filter(([key]) => key.startsWith('TOKEN_'))
        .map(([, value]) => value);

    const taskId = addTaskToQueue(ownerId, postId, allTokens, (update) => {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
    });

    console.log(`[Очередь] Задача добавлена в очередь с ID: ${taskId}`);
});

// === Multer загрузка файлов ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

// === Вспомогательные функции ===
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// === Лайкинг ===
async function likePost(token, ownerId, postId, isRepost = false) {
    if (!ownerId || !postId) {
        console.error(`Ошибка: ownerId или postId не определены`);
        return { success: false, error: 'ownerId или postId не определены' };
    }

    try {
        const response = await axios.get('https://api.vk.com/method/likes.add',  {
            params: {
                access_token: token,
                type: 'post',
                owner_id: ownerId,
                item_id: postId,
                v: '5.131'
            }
        });

        console.log(`✅ Лайк успешно добавлен для wall${ownerId}_${postId}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Ошибка при лайке: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// === Парсинг ссылок wall... ===
function parsePostLink(link) {
    try {
        const url = new URL(link);
        const pathParts = url.pathname.split('/');
        const object = pathParts[1];

        if (!/^wall-\d+_\d+$/.test(object) && !/^wall\d+_\d+$/.test(object)) {
            throw new Error('Некорректный формат ссылки');
        }

        const [ownerId, postId] = object.replace('wall', '').split('_').map(Number);
        return { ownerId, postId };

    } catch (error) {
        console.error(`Ошибка при парсинге ссылки ${link}: ${error.message}`);
        return null;
    }
}

// === Маршрут /send-repost ===
app.post('/send-repost', async (req, res) => {
    try {
        const { token, comment, link } = req.body;
        if (!token || !comment || !link) {
            return res.status(400).json({ error: 'Не хватает обязательных параметров' });
        }

        let ownerId, postId;

        try {
            const parsedLink = parsePostLink(link);
            if (!parsedLink) return res.status(400).json({ error: 'Некорректный формат ссылки' });
            ({ ownerId, postId } = parsedLink);
        } catch (e) {
            return res.status(400).json({ error: 'Неверный формат ссылки' });
        }

        try {
            await delay(500);
            const response = await axios.get('https://api.vk.com/method/wall.repost',  {
                params: {
                    access_token: token,
                    object: `wall${ownerId}_${postId}`,
                    message: comment,
                    v: '5.131'
                }
            });

            const userInfo = await getUserInfo(token);
            const repostOwnerId = response.data.response.owner_id || userInfo.id;
            const repostPostId = response.data.response.post_id;
            const repostUrl = `https://vk.com/wall${repostOwnerId}_${repostPostId}`; 
            console.log(`✅ Репост создан: ${repostUrl}`);

            const username = `${userInfo.firstName} ${userInfo.lastName}`.trim();
            await sendToTelegram([username], [repostUrl]);

            setTimeout(async () => {
                const parsedRepostLink = parsePostLink(repostUrl);
                if (!parsedRepostLink) return;

                const { ownerId: likeOwnerId, postId: likePostId } = parsedRepostLink;
                const allTokens = getRandomTokens("(1-40)");

                for (const likeToken of allTokens) {
                    try {
                        await delay(700);
                        await likePost(likeToken, likeOwnerId, likePostId);
                    } catch (error) {
                        console.error(`❌ Ошибка при лайке: ${error.message}`);
                    }
                }
            }, 0);

            // Отправляем ссылку в Telegram с нужного аккаунта
            await sendLinkFromTelegramAccount(token, repostUrl);

            res.json({ success: true, repostUrl });

        } catch (apiError) {
            res.status(500).json({ error: `Ошибка API: ${apiError.message}` });
        }

    } catch (error) {
        res.status(500).json({ error: `Серверная ошибка: ${error.message}` });
    }
});

// === Маршрут /send-multiple-reposts ===
app.post('/send-multiple-reposts', async (req, res) => {
    const { tokens, reposts } = req.body;
    if (!Array.isArray(tokens) || !Array.isArray(reposts)) {
        return res.status(400).json({ error: 'Неверный формат данных' });
    }

    if (tokens.length !== reposts.length) {
        return res.status(400).json({ error: 'Количество токенов должно совпадать с количеством репостов' });
    }

    const results = [];
    const usernames = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const { comment, link } = reposts[i];

        try {
            const parsedLink = parsePostLink(link);
            if (!parsedLink) throw new Error('Некорректный формат ссылки');

            const { ownerId, postId } = parsedLink;
            const response = await axios.get('https://api.vk.com/method/wall.repost',  {
                params: {
                    access_token: token,
                    object: `wall${ownerId}_${postId}`,
                    message: comment,
                    v: '5.131'
                }
            });

            const userInfo = await getUserInfo(token);
            const repostOwnerId = response.data.response.owner_id || userInfo.id;
            const repostPostId = response.data.response.post_id;
            const repostUrl = `https://vk.com/wall${repostOwnerId}_${repostPostId}`; 

            results.push(repostUrl);
            usernames.push(`${userInfo.firstName} ${userInfo.lastName}`.trim());

            setTimeout(async () => {
                const parsedRepostLink = parsePostLink(repostUrl);
                if (!parsedRepostLink) return;

                const { ownerId: likeOwnerId, postId: likePostId } = parsedRepostLink;
                const allTokens = getRandomTokens("(1-70)");

                for (const likeToken of allTokens) {
                    try {
                        await delay(700);
                        await likePost(likeToken, likeOwnerId, likePostId);
                    } catch (error) {
                        console.error(`❌ Ошибка при лайке: ${error.message}`);
                    }
                }
            }, 0);

        } catch (e) {
            console.error(`❌ Ошибка при репосте: ${e.message}`);
        }
    }

    if (results.length > 0) {
        await sendToTelegram(usernames, results, 'repost');

        for (let i = 0; i < results.length; i++) {
            await sendLinkFromTelegramAccount(tokens[i], results[i]);
        }
    }

    res.json({ success: true, count: results.length, links: results });
});

// === Функция получения информации о пользователе ===
async function getUserInfo(token) {
    try {
        const response = await axios.get("https://api.vk.com/method/users.get",  {
            params: {
                access_token: token,
                v: "5.131"
            }
        });

        const user = response.data.response?.[0];
        if (!user) throw new Error("Некорректный ответ от API VK");

        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name
        };

    } catch (error) {
        console.error("❌ Ошибка при получении информации о пользователе:", error.message);
        throw error;
    }
}

// === getRandomTokens ===
function getRandomTokens(range = null) {
    let tokens = Object.entries(process.env)
        .filter(([key]) => key.startsWith('TOKEN_'))
        .map(([key, value]) => ({
            token: value,
            number: parseInt(key.replace("TOKEN_", ""), 10)
        }))
        .sort((a, b) => a.number - b.number);

    if (range) {
        const [min, max] = range.match(/^\((\d+)-(\d+)\)$/).slice(1).map(Number);
        tokens = tokens.filter(({ number }) => number >= min && number <= max);
    }

    return tokens.sort(() => Math.random() - 0.5).slice(0, 50).map(({ token }) => token);
}

// === taskQueue для лайков ===
const taskQueue = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || taskQueue.length === 0) return;
    isProcessing = true;

    const task = taskQueue.shift();
    const { id, ownerId, postId, tokens, callback } = task;

    console.log(`[Очередь] Выполнение задачи ID: ${id}`);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        try {
            await likePost(token, ownerId, postId);
        } catch (error) {
            console.error(`❌ Ошибка при лайке: ${error.message}`);
        }

        const progress = Math.round(((i + 1) / tokens.length) * 100);
        if (callback) callback({ progress });
        await delay(700);
    }

    isProcessing = false;
    processQueue();
}

function addTaskToQueue(ownerId, postId, tokens, callback) {
    const id = uuidv4();
    taskQueue.push({ id, ownerId, postId, tokens, callback });
    processQueue();
    return id;
}

// === Запуск сервера ===
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});