require('dotenv').config(); // Загружаем переменные окружения из .env
const axios = require('axios');

// Глобальная булева переменная для отслеживания состояния выполнения
let isScriptRunning = false;

// Получаем список токенов из переменных окружения
const tokens = [];
for (const key in process.env) {
    if (key.startsWith("TOKEN_")) {
        tokens.push(process.env[key]);
    }
}



// Берем только первые 10 токенов
const first10Tokens = tokens.slice(0, 80);

// URL для вызова API ВКонтакте
const apiUrl = "https://api.vk.com/method/";

// Функция для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция для проверки блокировки пользователя
async function isUserBanned(token, userID) {
    try {
        const userResponse = await axios.get(`${apiUrl}users.get`, {
            params: {
                user_ids: userID,
                fields: "deactivated", // Проверяем, заблокирован ли аккаунт
                access_token: token,
                v: "5.131"
            }
        });

        const user = userResponse.data.response[0];
        return !!user.deactivated; // Возвращаем true, если пользователь заблокирован
    } catch (error) {
        console.log(`Ошибка при проверке пользователя ${userID}: ${error.message}`);
        return false;
    }
}

// Основная асинхронная функция
async function main() {
    if (isScriptRunning) {
        console.log("Скрипт уже запущен. Пропускаем новый запуск.");
        return;
    }

    isScriptRunning = true;

    try {

        const targetUserID = 1048069000;
        ; // ID пользователя для добавления в друзья

        for (const token of tokens) { // используем все токены, а не только первые 10
            console.log(`\nИспользуется токен: ${token.slice(0, 10)}...`);

            try {
                // Проверяем, не заблокирован ли целевой пользователь
                const isBanned = await isUserBanned(token, targetUserID);
                if (isBanned) {
                    console.log(`Пользователь ${targetUserID} заблокирован. Пропускаем.`);
                    continue;
                }

                // Проверяем текущий статус дружбы
                const friendsCheckResponse = await axios.get(`${apiUrl}friends.areFriends`, {
                    params: {
                        user_ids: targetUserID,
                        access_token: token,
                        v: "5.131"
                    }
                });

                const areFriends = friendsCheckResponse.data.response?.[0]?.friend_status === 3;
                if (areFriends) {
                    console.log(`Пользователь ${targetUserID} уже в друзьях. Пропускаем.`);
                    continue;
                }

                // Пытаемся добавить в друзья
                const addResponse = await axios.get(`${apiUrl}friends.add`, {
                    params: {
                        user_id: targetUserID,
                        access_token: token,
                        v: "5.131"
                    }
                });

                const responseData = addResponse.data;

                if (responseData.response) {
                    const status = responseData.response;
                    if (status === 1 || status === 2 || status === 4) {
                        console.log(`Заявка пользователю ${targetUserID} отправлена или уже была отправлена.`);
                    } else if (status === 3) {
                        console.log(`Пользователь ${targetUserID} успешно добавлен в друзья.`);
                    }
                } else if (responseData.error) {
                    const errorCode = responseData.error.error_code;
                    const errorMsg = responseData.error.error_msg;
                    console.log(`Ошибка при добавлении пользователя ${targetUserID}: [${errorCode}] ${errorMsg}`);
                }

            } catch (error) {
                console.log(`Произошла ошибка при работе с токеном ${token.slice(0, 10)}...: ${error.message}`);
            }

            // Задержка между запросами от разных токенов
            await sleep(1000);
        }

        console.log("\nВсе токены обработаны.");
    } finally {
        isScriptRunning = false;
    }
}

// Зацикливаем выполнение скрипта раз в 30 секунд
setInterval(() => {
    console.log("\nЗапускаем новый цикл выполнения скрипта...");
    main();
}, 130000); // 30 секунд

// Первый запуск скрипта
main();



