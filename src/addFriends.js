require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// Ссылки на профили, которых нужно добавить в друзья
const FRIENDS =[
"https://vk.com/id1052174923"
,
"https://vk.com/id1052176982"
]

// Задержка между действиями
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Получение всех токенов
function getTokens() {
    const tokens = [];
    let i = 1;
    while (process.env[`TOKEN_${i}`]) {
        tokens.push(process.env[`TOKEN_${i}`]);
        i++;
    }
    return tokens;
}

// Получаем user_id из ссылки
async function getUserId(token, url) {
    try {
        const screen_name = url.split('/').pop();
        const response = await axios.get('https://api.vk.com/method/utils.resolveScreenName ', {
            params: {
                screen_name,
                v: '5.199',
                access_token: token
            }
        });

        const { object_id } = response.data.response || {};
        if (!object_id) throw new Error(`Не удалось получить ID пользователя для ${url}`);
        return object_id;
    } catch (error) {
        console.error(`Ошибка при получении ID для ${url}:`, error.message);
        return null;
    }
}

// Добавление в друзья
async function addToFriends(token, userId) {
    try {
        const response = await axios.post(
            'https://api.vk.com/method/friends.add ',
            null,
            {
                params: {
                    user_id: userId,
                    v: '5.199',
                    access_token: token
                }
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error.error_msg);
        }

        console.log(`Заявка в друзья отправлена пользователю https://vk.com/id${userId} с токеном: ${token.substring(0, 10)}...`);
    } catch (error) {
        console.error(`Ошибка при добавлении в друзья для токена ${token.substring(0, 10)}... :`, error.message);
    }

    await delay(700); // задержка между заявками
}

// Основная функция
async function main() {
    const tokens = getTokens();
    if (tokens.length === 0) {
        console.log('Токены не найдены в .env');
        return;
    }

    for (const url of FRIENDS) {
        const userId = await getUserId(tokens[0], url); // используем первый токен для получения ID
        if (!userId) continue;

        for (const token of tokens) {
            await addToFriends(token, userId);
        }
    }
}

main();