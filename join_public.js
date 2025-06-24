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

// URL для вызова API ВКонтакте
const apiUrl = "https://api.vk.com/method/";

// ID паблика, на который нужно подписаться (замените на реальный ID)
const PUBLIC_ID = 230218725; // Убедитесь, что это положительное число (без минуса)

// Функция для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Основная асинхронная функция
async function main() {
    if (isScriptRunning) {
        console.log("Скрипт уже запущен. Пропускаем новый запуск.");
        return;
    }

    // Устанавливаем флаг, что скрипт запущен
    isScriptRunning = true;

    try {
        console.log("Начинаем обработку...");

        for (const token of tokens) {
            console.log(`\nИспользуется токен: ${token.slice(0, 10)}...`);

            try {
                // Проверяем, является ли пользователь участником паблика
                const membershipResponse = await axios.get(`${apiUrl}groups.isMember`, {
                    params: {
                        group_id: PUBLIC_ID,
                        access_token: token,
                        v: "5.131"
                    }
                });

                const isMember = membershipResponse.data.response;

                if (isMember) {
                    console.log(`Пользователь с токеном ${token.slice(0, 10)}... уже является участником паблика.`);
                } else {
                    console.log(`Пользователь с токеном ${token.slice(0, 10)}... не является участником паблика. Присоединяем...`);

                    // Присоединяем пользователя к паблику
                    const joinResponse = await axios.get(`${apiUrl}groups.join`, {
                        params: {
                            group_id: PUBLIC_ID,
                            access_token: token,
                            v: "5.131"
                        }
                    });

                    if (joinResponse.data.response === 1) {
                        console.log(`Пользователь с токеном ${token.slice(0, 10)}... успешно присоединился к паблику.`);
                    } else {
                        console.log(`Не удалось присоединить пользователя с токеном ${token.slice(0, 10)}...`);
                    }
                }
            } catch (error) {
                console.log(`Ошибка при обработке токена ${token.slice(0, 10)}...: ${error.message}`);
            }

            // Задержка между обработкой разных токенов
            await sleep(1000);
        }

        console.log("\nВсе запросы завершены.");
    } finally {
        // Сбрасываем флаг после завершения работы
        isScriptRunning = false;
    }
}

// Зацикливаем выполнение скрипта раз в 30 секунд
setInterval(() => {
    console.log("\nЗапускаем новый цикл выполнения скрипта...");
    main();
}, 30000); // 30 секунд

// Первый запуск скрипта
main();