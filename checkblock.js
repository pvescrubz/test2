require('dotenv').config();
const axios = require('axios');

async function checkVkAccount(token) {
    try {
        // Шаг 1: Проверяем базовую информацию о пользователе
        const userResponse = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                access_token: token,
                v: '5.199'
            }
        });

        const userData = userResponse.data;

        if (!userData.response || userData.response.length === 0) {
            return { status: 'unknown' };
        }

        const userId = userData.response[0].id;
        const firstName = userData.response[0].first_name;
        const lastName = userData.response[0].last_name;

        // Формируем ссылку на страницу (исправляем пробел в ссылке)
        const profileLink = `https://vk.com/id${userId}`;

        // Шаг 2: Проверяем доступ к стене пользователя
        const wallResponse = await axios.get('https://api.vk.com/method/wall.get', {
            params: {
                owner_id: userId,
                count: 1, // получаем всего одну запись
                access_token: token,
                v: '5.199'
            }
        });

        const wallData = wallResponse.data;

        // Шаг 3: Получаем количество друзей
        let friendsCount = 0;
        try {
            const friendsResponse = await axios.get('https://api.vk.com/method/friends.get', {
                params: {
                    user_id: userId,
                    count: 0, // только количество, без списка
                    access_token: token,
                    v: '5.199'
                }
            });
            friendsCount = friendsResponse.data.response?.count || 0;
        } catch (friendsError) {
            // Если ошибка (например, приватный профиль), оставляем 0
        }

        if (wallData.response && wallData.response.items) {
            return { 
                status: 'active', 
                id: userId, 
                firstName, 
                lastName, 
                profileLink,
                friendsCount  // Добавляем количество друзей
            };
        } else {
            return { status: 'banned_or_deleted' };
        }

    } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
            const vkError = error.response.data.error;
            const errorCode = vkError.error_code;

            switch (errorCode) {
                case 5:
                    return { status: 'invalid_token' };
                case 15:
                    return { status: 'access_denied' };
                case 18:
                    return { status: 'banned_or_deleted' };
                default:
                    return { status: 'vk_error', code: errorCode, message: vkError.error_msg };
            }
        } else {
            return { status: 'network_error', error: error.message };
        }
    }
}

// Основная функция
async function main() {
    console.log('🔍 Начинаем проверку токенов...\n');

    const results = [];

    for (let i = 1; i <= 15; i++) {
        const tokenKey = `TOKEN_${i}`;
        const token = process.env[tokenKey];

        if (!token) {
            results.push({ tokenNumber: i, status: 'missing_in_env' });
            continue;
        }

        console.log(`Проверяем токен #${i}...`);

        const result = await checkVkAccount(token);
        results.push({ tokenNumber: i, status: result.status, details: result });
    }

    // Вывод результатов
console.log('\n📊 Результаты проверки:');
results.forEach(r => {
    let msg = `Токен #${r.tokenNumber}: `;
    switch (r.status) {
        case 'active':
            msg += `✅ Активный | Имя: ${r.details.firstName} ${r.details.lastName} | Друзей: ${r.details.friendsCount} | Ссылка: ${r.details.profileLink}`;
            break;
        case 'invalid_token':
            msg += `❌ Неверный или истёкший токен`;
            break;
        case 'access_denied':
            msg += `🚫 Доступ запрещён (возможно приватный/ограниченный профиль)`;
            break;
        case 'banned_or_deleted':
            msg += `🛑 Удалён или заблокирован`;
            break;
        case 'missing_in_env':
            msg += `⚠️ Не найден в .env`;
            break;
        case 'network_error':
            msg += `🌐 Ошибка сети: ${r.details.error}`;
            break;
        default:
            msg += `❓ Неизвестный статус: ${r.status}`;
    }
    console.log(msg);
});
}

main();