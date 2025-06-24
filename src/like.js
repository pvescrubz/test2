const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');
const express = require('express');

// Настройки VK
const OWNER_ID = '-229000453'; // ID паблика (отрицательное число)
const POST_COUNT = 10; // Количество последних постов для проверки
const INTERVAL = 10000 * 60; // Интервал между запусками (10 секунд)

// Настройки Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = 123;

// Загрузка токенов из .env
const ACCESS_TOKENS = Object.keys(process.env)
    .filter(key => key.startsWith('TOKEN_') && process.env[key])
    .map(key => process.env[key]);

let VALID_ACCESS_TOKENS = [];

// Функция для добавления задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Логирование времени
function formatTimestamp(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}


// Проверка валидности токена
async function isValidToken(token) {
    try {
        const res = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                access_token: token,
                v: '5.131'
            }
        });

        if (res.data.response?.length > 0) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

// Получение постов
async function getPosts(ownerId, count) {
    try {
        const response = await axios.get('https://api.vk.com/method/wall.get', {
            params: {
                access_token: VALID_ACCESS_TOKENS[0] || ACCESS_TOKENS[0],
                owner_id: ownerId,
                count: count,
                filter: 'owner',
                v: '5.131'
            }
        });

        if (!response.data.response || !Array.isArray(response.data.response.items)) {
            throw new Error('Некорректный ответ от API VK');
        }

        return response.data.response.items;

    } catch (error) {
        console.error(`[${formatTimestamp(new Date())}] Ошибка получения постов:`, error.message);
        return [];
    }
}

// Проверка, есть ли лайк
async function isLiked(token, ownerId, postId) {
    try {
        const response = await axios.get('https://api.vk.com/method/likes.isLiked', {
            params: {
                access_token: token,
                type: 'post',
                owner_id: ownerId,
                item_id: postId,
                v: '5.131'
            }
        });

        return response.data.response?.liked === 1;

    } catch (error) {
        console.error(`[${formatTimestamp(new Date())}] Ошибка проверки лайка:`, error.message);
        return true; // Если ошибка — пропускаем этот пост
    }
}

// Ставим лайк
async function addLike(token, ownerId, postId) {
    try {
        await axios.get('https://api.vk.com/method/likes.add', {
            params: {
                access_token: token,
                type: 'post',
                owner_id: ownerId,
                item_id: postId,
                v: '5.131'
            }
        });
        return true;
    } catch (error) {
        console.error(`[${formatTimestamp(new Date())}] Ошибка простановки лайка:`, error.message);
        return false;
    }
}

// Получаем имя пользователя
async function getUserInfo(token) {
    try {
        const res = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                access_token: token,
                v: '5.131'
            }
        });

        const user = res.data.response[0];
        return `${user.first_name} ${user.last_name}`;
    } catch (e) {
        return 'Неизвестный';
    }
}

// Флаг блокировки
let isRunning = false;

// Основная функция
async function runScript() {
    if (isRunning) {
        console.log(`[${formatTimestamp(new Date())}] Скрипт уже выполняется.`);
        return;
    }

    try {
        isRunning = true;
        console.log(`[${formatTimestamp(new Date())}] Начинаю выполнение скрипта...`);
        await console.log('🚀 Начало работы скрипта');

        // Проверяем все токены
        VALID_ACCESS_TOKENS = await Promise.all(
            ACCESS_TOKENS.map(async token => {
                const valid = await isValidToken(token);
                if (!valid) {
                    console.warn(`[${formatTimestamp(new Date())}] Токен не прошёл проверку: ${token.slice(0, 20)}...`);
                }
                return valid ? token : null;
            })
        ).then(tokens => tokens.filter(Boolean));

        if (VALID_ACCESS_TOKENS.length === 0) {
            await console.log('❌ Нет валидных токенов!');
            throw new Error('Нет ни одного валидного токена');
        }

        // Получаем посты
        const posts = await getPosts(OWNER_ID, POST_COUNT);

        if (posts.length === 0) {
            await console.log('⚠️ Нет постов для обработки');
            return;
        }

        for (const post of posts) {
            const postId = post.id;
            const postUrl = `https://vk.com/wall${OWNER_ID}_${postId}`;

            for (const token of VALID_ACCESS_TOKENS) {
                const userInfo = await getUserInfo(token);
                const isPostLiked = await isLiked(token, OWNER_ID, postId);

                if (!isPostLiked) {
                    const success = await addLike(token, OWNER_ID, postId);

                    if (success) {
                        const message = `✅ Пост (${postUrl}) — Лайк поставлен — ${userInfo}`;
                        console.log(`[${formatTimestamp(new Date())}] ${message}`);
                        await console.log(message);
                    } else {
                        const message = `❌ Не удалось поставить лайк на пост: ${postUrl} — ${userInfo}`;
                        console.log(`[${formatTimestamp(new Date())}] ${message}`);
                        await console.log(message);
                    }
                } else {
                    console.log(`[${formatTimestamp(new Date())}] Пост уже лайкнут: ${postUrl}`);
                }

                await delay(4500); // 4.5 секунды между аккаунтами
            }
        }

        await console.log('✅ Скрипт успешно завершил работу');
    } catch (error) {
        console.error(`[${formatTimestamp(new Date())}] Ошибка в работе скрипта:`, error.message);
        await console.log(`❌ Ошибка: ${error.message}`);
    } finally {
        isRunning = false;
    }
}

// Express-сервер
const app = express();

app.get('/run', async (req, res) => {
    if (isRunning) {
        return res.status(400).send('Скрипт уже выполняется');
    }

    try {
        await runScript();
        res.send('✅ Скрипт успешно выполнен');
    } catch (e) {
        res.status(500).send('❌ Ошибка при выполнении скрипта');
    }
});

// Запуск по расписанию
setInterval(runScript, INTERVAL);

// Запуск сервера
const PORT = process.env.PORT || 3005;
app.listen(PORT, async () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📌 Всего токенов: ${ACCESS_TOKENS.length}`);
    
    // Автоматически запускаем проверку токенов при старте
    VALID_ACCESS_TOKENS = await Promise.all(
        ACCESS_TOKENS.map(async token => await isValidToken(token) ? token : null)
    ).then(tokens => tokens.filter(Boolean));

    console.log(`✅ Валидных токенов: ${VALID_ACCESS_TOKENS.length}`);
});