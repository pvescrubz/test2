require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// Задержка между действиями
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Получение всех токенов
function getTokens() {
    const tokens = [];
    let i = 116;
    while (process.env[`TOKEN_${i}`]) {
        tokens.push(process.env[`TOKEN_${i}`]);
        i++;
    }
    return tokens;
}

// Вызов метода VK API
async function vkApiCall(method, params, token) {
    try {
        const response = await axios.get(`https://api.vk.com/method/${method}`, {
            params: {
                v: '5.199',
                access_token: token,
                ...params
            }
        });

        if (response.data.error) {
            throw new Error(response.data.error.error_msg);
        }

        return response.data.response;
    } catch (error) {
        console.error(`Ошибка при вызове ${method} с токеном ${token.substring(0, 10)}... :`, error.message);
        return null;
    }
}

// Принять все входящие заявки в друзья
async function acceptFriendRequests(token) {
    const data = await vkApiCall('friends.getRequests', { out: 0, count: 100 }, token);
    if (!data || !data.items) return;

    for (const userId of data.items) {
        await vkApiCall('friends.add', { user_id: userId }, token);
        console.log(`Заявка от пользователя ${userId} принята.`);
        await delay(700);
    }
}

// Добавить друзей текущего пользователя
async function addFriendsOfUser(token) {
    
}

// Добавить подписчиков текущего пользователя
async function addFollowersOfUser(token) {
    const followersData = await vkApiCall('users.getFollowers', { count: 100 }, token);
    if (!followersData || !followersData.items) return;

    for (const followerId of followersData.items) {
        const statusData = await vkApiCall('friends.areFriends', { user_ids: followerId }, token);
        if (!statusData || statusData[0]?.is_friend === true) continue;

        await vkApiCall('friends.add', { user_id: followerId }, token);
        console.log(`Заявка отправлена подписчику ${followerId}`);
        await delay(700);
    }
}

// Основная функция
async function main() {
    const tokens = getTokens();
    if (tokens.length === 0) {
        console.log('Токены не найдены в .env');
        return;
    }

    for (const token of tokens) {
        console.log(`\n=== Работаем с токеном: ${token.substring(0, 10)}... ===`);

        // 1. Принять входящие заявки
        await acceptFriendRequests(token);

        // 2. Добавить друзей пользователя
        await addFriendsOfUser(token);

        // 3. Добавить подписчиков пользователя
        await addFollowersOfUser(token);

        await delay(2000); // пауза между аккаунтами
    }

    console.log('\n✅ Все операции завершены.');
}

main();