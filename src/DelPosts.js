require('dotenv').config({ path: '../.env' });
const axios = require('axios');

// Задержка между запросами (в миллисекундах)
const DELAY = 700;

// Получение всех токенов из .env
function getTokens() {
    const tokens = [];
    let i = 131;
    while (process.env[`TOKEN_${i}`]) {
        tokens.push(process.env[`TOKEN_${i}`]);
        i++;
    }
    return tokens;
}

// Вызов метода VK API с обработкой ошибок
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
        console.error(`Ошибка при вызове ${method}:`, error.message);
        return null;
    }
}

// Очистка стены пользователя
async function clearUserWall(token) {
    console.log(`\nНачинаем очистку стены для токена ${token.substring(0, 10)}...`);

    // Получаем ID пользователя
    const userInfo = await vkApiCall('users.get', {}, token);
    if (!userInfo || userInfo.length === 0) {
        console.log('Не удалось получить информацию о пользователе');
        return;
    }

    const ownerId = userInfo[0].id;
    let deletedCount = 0;
    let offset = 0;
    let hasMorePosts = true;

    while (hasMorePosts) {
        // Получаем записи со стены
        const wallData = await vkApiCall('wall.get', {
            owner_id: ownerId,
            count: 100,
            offset: offset
        }, token);

        if (!wallData || !wallData.items || wallData.items.length === 0) {
            hasMorePosts = false;
            continue;
        }

        // Удаляем каждую запись
        for (const post of wallData.items) {
            const result = await vkApiCall('wall.delete', {
                owner_id: ownerId,
                post_id: post.id
            }, token);

            if (result === 1) {
                deletedCount++;
                console.log(`Удалена запись ID: ${post.id} (${deletedCount} всего)`);
            }

            await new Promise(resolve => setTimeout(resolve, DELAY));
        }

        offset += wallData.items.length;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Очистка стены завершена. Удалено записей: ${deletedCount}`);
}

// Основная функция
async function main() {
    const tokens = getTokens();
    if (tokens.length === 0) {
        console.log('Токены не найдены в .env');
        return;
    }

    for (const token of tokens) {
        await clearUserWall(token);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза между аккаунтами
    }

    console.log('\n✅ Очистка стен всех аккаунтов завершена.');
}

main().catch(console.error);