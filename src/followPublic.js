require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// Список ссылок на паблики
const PUBLICS = ["https://vk.com/tikoktvladimir "];

// Функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция для извлечения всех токенов из env
function getTokens() {
    const tokens = [];
    let i = 1;
    while (process.env[`TOKEN_${i}`]) {
        tokens.push(process.env[`TOKEN_${i}`]);
        i++;
    }
    return tokens;
}

// Получаем ID паблика из URL
async function getPublicId(token, url) {
    try {
        const response = await axios.get('https://api.vk.com/method/utils.resolveScreenName ', {
            params: {
                screen_name: url.split('/').pop(),
                v: '5.199',
                access_token: token,
            },
        });

        const { object_id } = response.data.response || {};
        if (!object_id) throw new Error(`Не удалось получить ID паблика для ${url}`);
        return object_id;
    } catch (error) {
        console.error(`Ошибка при получении ID паблика для ${url}:`, error.message);
        return null;
    }
}

// Подписываемся на паблик
async function subscribeToPublic(token, publicId) {
    try {
        const response = await axios.post(
            'https://api.vk.com/method/groups.join ',
            null,
            {
                params: {
                    group_id: publicId,
                    v: '5.199',
                    access_token: token,
                },
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error.error_msg);
        }

        console.log(`Подписано (ID: ${publicId}) с токеном: ${token.substring(0, 10)}...`);
    } catch (error) {
        console.error(`Ошибка подписки для токена ${token.substring(0, 10)}... :`, error.message);
    }

    // Задержка 500 мс перед следующей операцией
    await delay(500);
}

// Основная функция
async function main() {
    const tokens = getTokens();
    if (tokens.length === 0) {
        console.log('Токены не найдены в .env');
        return;
    }

    for (const url of PUBLICS) {
        // Берем первый токен, чтобы получить ID паблика
        const publicId = await getPublicId(tokens[0], url);
        if (!publicId) continue;

        // Подписываем все аккаунты на этот паблик
        for (const token of tokens) {
            await subscribeToPublic(token, publicId);
        }
    }
}

main();