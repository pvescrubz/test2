const path = require("path");
const TelegramBot = require('node-telegram-bot-api');
const { StringSession } = require("telegram/sessions");
const { Api, TelegramClient } = require("telegram");
const axios = require("axios"); 
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); // Указываем путь к .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_THREAD = process.env.TELEGRAM_THREAD;
const express = require("express");
const multer = require("multer");
const fs = require("fs"); // Импортируем fs
const { writePost, uploadPhotoToVK, uploadVideoToVK } = require("./vk-api");
const app = express();
const sharp = require('sharp');
const screenshotConfig = require("./screenshotConfig");
const ACCOUNTS = require("./accounts.json");
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Статические файлы
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
console.log("Telegram Bot Token:", process.env.TELEGRAM_BOT_TOKEN);
console.log("Chat ID:", process.env.TELEGRAM_CHAT_ID);
console.log("Thread ID:", process.env.TELEGRAM_THREAD);

async function sendToTelegram(usernames, links, type = 'post') {
  console.log("📤 Отправляю в ТГ...");
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("⚠️ Telegram API данные не указаны");
      return;
  }

  console.log("📬 Имена пользователей:", usernames);
  console.log("🔗 Ссылки:", links);

  const header = type === 'post' ? 'Сделаны посты от:' : 'Сделаны репосты от:';
  const usernamesText = usernames.join(', ');
  const linksText = "```\n" + links.join("\n") + "\n```";
  const message = `${header}\n${usernamesText}\n\nСсылки:\n${linksText}`;

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


async function getVkUserId(vkToken) {
  try {
    const response = await axios.get("https://api.vk.com/method/users.get",  {
      params: {
        access_token: vkToken,
        v: "5.199",
      },
    });

    const user = response.data.response?.[0];
    if (!user) throw new Error("Ошибка получения данных пользователя ВК");

    return user.id;
  } catch (error) {
    console.error("❌ Ошибка при получении vk_user_id:", error.message);
    return null;
  }
}

app.get("/kiril111", (req, res) => {
    const filePath = path.join(__dirname, "../public/kiril111.html");
    console.log("Путь к файлу:", filePath);
    res.sendFile(filePath);
});




app.get("/kurlovurod1", (req, res) => {
    const filePath = path.join(__dirname, "../public/kurlovurod1.html");
    console.log("Путь к файлу:", filePath);
    res.sendFile(filePath);
});
app.get("/kurlovurod2", (req, res) => {
    const filePath = path.join(__dirname, "../public/kurlovurod2.html");
    console.log("Путь к файлу:", filePath);
    res.sendFile(filePath);
});
app.get("/kurlovurod3", (req, res) => {
    const filePath = path.join(__dirname, "../public/kurlovurod3.html");
    console.log("Путь к файлу:", filePath);
    res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/ksadwqe213x", (req, res) => {
    const filePath = path.join(__dirname, "../public/ksadwqe213x.html");
    console.log("Путь к файлу:", filePath);
    res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/ksadwqe216x", (req, res) => {
  const filePath = path.join(__dirname, "../public/ksadwqe216x.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});

// Маршрут для новой страницы
app.get("/ksadwqe214x", (req, res) => {
  const filePath = path.join(__dirname, "../public/ksadwqe214x.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/ksadwqe215x", (req, res) => {
  const filePath = path.join(__dirname, "../public/ksadwqe215x.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/ksadwqe217x", (req, res) => {
  const filePath = path.join(__dirname, "../public/ksadwqe217x.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/ksadwqe218x", (req, res) => {
  const filePath = path.join(__dirname, "../public/ksadwqe218x.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});
// Маршрут для новой страницы
app.get("/like", (req, res) => {
  const filePath = path.join(__dirname, "../public/like.html");
  console.log("Путь к файлу:", filePath);
  res.sendFile(filePath);
});

// API endpoint для обработки ссылок
app.post('/api/process', async (req, res) => {
    try {
        const { links } = req.body;
        
        if (!Array.isArray(links) || links.length === 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Необходимо предоставить массив ссылок' 
            });
        }

        // Обработка каждой ссылки
        const results = [];
        for (const link of links) {
            try {
                await processVkLink(link);
                results.push({ link, status: 'success' });
                await delay(1000); // Задержка между обработкой ссылок
            } catch (error) {
                results.push({ 
                    link, 
                    status: 'error', 
                    message: error.message 
                });
            }
        }

        // Формируем итоговое сообщение
        const successCount = results.filter(r => r.status === 'success').length;
        const message = `Успешно обработано: ${successCount} из ${links.length}`;

        res.json({
            status: 'success',
            message,
            results
        });

    } catch (error) {
        console.error('Ошибка в API:', error);
        res.status(500).json({
            status: 'error',
            message: 'Внутренняя ошибка сервера'
        });
    }
});

app.get('/add-likes', async (req, res) => {
    const { link } = req.query;
    if (!link) {
        return res.status(400).json({ error: 'Ссылка обязательна' });
    }

    let ownerId, postId;
    try {
        const parsedLink = parsePostLink(link);
        if (!parsedLink) {
            return res.status(400).json({ error: 'Некорректный формат ссылки' });
        }
        ({ ownerId, postId } = parsedLink);
    } catch (error) {
        return res.status(400).json({ error: `Ошибка при парсинге ссылки: ${error.message}` });
    }

    // Устанавливаем заголовки для SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Получаем все токены
    const allTokens = Object.entries(process.env)
        .filter(([key]) => key.startsWith('TOKEN_'))
        .map(([, value]) => value);

    // Добавляем задачу в очередь
    const taskId = addTaskToQueue(ownerId, postId, allTokens, (update) => {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
    });

    console.log(`[Очередь] Задача добавлена в очередь с ID: ${taskId}`);
});
// Настройки multer для сохранения файлов с оригинальными расширениями
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/")); // Путь к папке uploads
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage }); // Используем обновленную конфигурацию

// Маршрут для создания репостов
// Вспомогательная функция для задержки
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Функция для добавления лайков к посту или репосту
async function likePost(token, ownerId, postId, isRepost = false) {
    if (!ownerId || !postId) {
        console.error(`Ошибка: ownerId или postId не определены (ownerId=${ownerId}, postId=${postId})`);
        return { success: false, error: 'ownerId или postId не определены' };
    }
    try {
        const response = await axios.get('https://api.vk.com/method/likes.add', {
            params: {
                access_token: token,
                type: 'post', // Добавляем проверку на тип
                owner_id: ownerId,
                item_id: postId,
                v: '5.131'
            }
        });
        console.log(`Лайк успешно добавлен для ${isRepost ? 'репоста' : 'поста'} wall${ownerId}_${postId}`);
        return { success: true };
    } catch (error) {
        console.error(`Ошибка при добавлении лайка для ${isRepost ? 'репоста' : 'поста'} wall${ownerId}_${postId}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function processLinks(links, type = 'post') {
  if (!Array.isArray(links) || links.length === 0) {
    throw new Error('Необходимо предоставить массив ссылок');
  }

  // Обработка каждой ссылки
  const results = [];
  const successfulLinks = [];
  const usernames = [];

  for (const link of links) {
    try {
      // Обрабатываем ссылку
      await processVkLink(link);
      results.push({ link, status: 'success' });
      successfulLinks.push(link);
      
      // Если нужно получать username (для репостов)
      if (type === 'repost') {
        const parsed = parsePostLink(link);
        if (parsed) {
          const userInfo = await getUserInfoByPost(parsed.ownerId); // Нужно реализовать эту функцию
          if (userInfo) {
            usernames.push(`${userInfo.firstName} ${userInfo.lastName}`.trim());
          }
        }
      }
      
      await delay(1000); // Задержка между обработкой ссылок
    } catch (error) {
      results.push({ 
        link, 
        status: 'error', 
        message: error.message 
      });
      console.error(`Ошибка обработки ссылки ${link}:`, error.message);
    }
  }

  // Отправляем уведомление в Telegram
  if (successfulLinks.length > 0 && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      const names = usernames.length > 0 ? usernames : ['Автоматическая публикация'];
      await sendToTelegram(names, successfulLinks, type);
    } catch (error) {
      console.error('Ошибка при отправке в Telegram:', error.message);
    }
  }

  // Возвращаем результаты
  const successCount = results.filter(r => r.status === 'success').length;
  return {
    status: 'success',
    message: `Успешно обработано: ${successCount} из ${links.length}`,
    results
  };
}
async function getUserInfoByPost(ownerId) {
  try {
    // Находим аккаунт, который соответствует этому ownerId
    const account = ACCOUNTS.find(acc => 
      acc.vk_user_id === Math.abs(ownerId) || 
      (acc.vk_token && getVkUserId(acc.vk_token) === Math.abs(ownerId)
    ));
    
    if (account && account.vk_token) {
      return await getUserInfo(account.vk_token);
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    return null;
  }
}


// Маршрут для получения последней записи со стены пользователя
app.post("/get-last-post", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      console.error("Ошибка: Отсутствует token");
      return res
        .status(400)
        .json({ success: false, error: "Token is required" });
    }

    // Вызов API ВКонтакте для получения записей со стены
    const response = await axios.get("https://api.vk.com/method/wall.get", {
      params: {
        access_token: token,
        owner_id: null, // Если null, то берется стена пользователя, связанного с токеном
        count: 1, // Получаем только одну запись (последнюю)
        filter: "owner", // Только записи владельца стены
        v: "5.131",
      },
    });

    console.log("Ответ от API ВКонтакте (wall.get):", response.data);

    const posts = response.data.response.items;
    if (posts.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Записи не найдены" });
    }

    const lastPost = posts[0];
    const ownerId = lastPost.owner_id;
    const postId = lastPost.id;
    const postUrl = `https://vk.com/wall${ownerId}_${postId}`;

    res.json({ success: true, postUrl });
  } catch (error) {
    console.error("Ошибка при вызове wall.get:", error.message);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

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
app.post('/send-repost', async (req, res) => {
    try {
      const { token, comment, link } = req.body;
      if (!token || !comment || !link) {
        return res.status(400).json({ error: 'Не хватает обязательных параметров' });
      }
  
      let ownerId, postId;
      try {
        // Парсим исходную ссылку
        const parsedLink = parsePostLink(link);
        if (!parsedLink) {
          return res.status(400).json({ error: 'Некорректный формат ссылки' });
        }
        ({ ownerId, postId } = parsedLink);
        console.log(`Получена ссылка на пост/репост: wall${ownerId}_${postId}`);
      } catch (e) {
        return res.status(400).json({ error: 'Неверный формат ссылки' });
      }
  
      try {
        // Этап 1: Создание репоста
        await delay(500);
        const response = await axios.get('https://api.vk.com/method/wall.repost', {
          params: {
            access_token: token,
            object: `wall${ownerId}_${postId}`,
            message: comment,
            v: '5.131'
          }
        });
  
        // Логируем полный ответ API
        console.log('Ответ от API VK (wall.repost):', response.data);
  
        // Проверяем ответ API
        if (!response.data.response || !response.data.response.post_id) {
          console.error("Ошибка: Некорректный ответ от API VK при создании репоста");
          return res.status(500).json({ error: "Не удалось получить post_id для репоста" });
        }
  
        // Извлекаем ownerId и postId для репоста
        const userInfo = await getUserInfo(token); // Получаем ID пользователя
        const repostOwnerId = response.data.response.owner_id || userInfo.id; // Используем ownerId из токена, если нет в ответе
        const repostPostId = response.data.response.post_id;
  
        // Формируем ссылку на репост
        const repostUrl = `https://vk.com/wall${repostOwnerId}_${repostPostId}`;
        console.log(`Репост успешно создан: ${repostUrl}`);
  
        // ОТПРАВЛЯЕМ КЛИЕНТУ ССЫЛКУ СРАЗУ
        res.json({ success: true, repostUrl });
        // ОТПРАВКА РЕЗУЛЬТАТА В ТЕЛЕГРАМ
        const firstName = userInfo.firstName || '';
        const lastName = userInfo.lastName || '';
        const username = `${firstName} ${lastName}`.trim();

sendToTelegram([username], [repostUrl]);
        // А ЛАЙКИ ВЫПОЛНЯЕМ АСИНХРОННО, ЧТОБЫ НЕ ЖДАТЬ
        setTimeout(async () => {
          try {
            const parsedRepostLink = parsePostLink(repostUrl);
            if (!parsedRepostLink) {
              console.error("Не удалось распарсить ссылку на репост");
              return;
            }
  
            const { ownerId: likeOwnerId, postId: likePostId } = parsedRepostLink;
            const allTokens = getRandomTokens("(1-40)");
  
            for (const likeToken of allTokens) {
              try {
                await delay(700);
                await likePost(likeToken, likeOwnerId, likePostId);
                console.log(`Лайк успешно добавлен для wall${likeOwnerId}_${likePostId}`);
              } catch (error) {
                console.error(`Ошибка при лайке для токена ${likeToken}: ${error.message}`);
              }
            }
          } catch (e) {
            console.error("Ошибка при фоновом лайкинге:", e.message);
          }
        }, 0);
  
      } catch (apiError) {
        res.status(500).json({ error: `Ошибка API: ${apiError.message}` });
      }
    } catch (error) {
      res.status(500).json({ error: `Серверная ошибка: ${error.message}` });
    }
  });
// Функция для проверки наличия лайка
async function checkIsLiked(token, ownerId, postId, type = 'post') {
  try {
      const response = await axios.get('https://api.vk.com/method/likes.isLiked', {
          params: {
              access_token: token,
              type: type,
              owner_id: ownerId,
              item_id: postId,
              v: '5.131'
          }
      });

      // Если liked = 1, значит лайк уже поставлен
      return response.data.response.liked === 1;
  } catch (error) {
      console.error(`Ошибка при проверке лайка для wall${ownerId}_${postId}: ${error.message}`);
      return false;
  }
}

function getRandomTokens(range = null) {
  let tokens = Object.entries(process.env)
      .filter(([key]) => key.startsWith('TOKEN_'))
      .map(([key, value]) => {
          const tokenNumber = parseInt(key.replace('TOKEN_', ''), 10);
          return { token: value, number: tokenNumber };
      })
      .sort((a, b) => a.number - b.number);

  // Фильтрация по диапазону, если он указан
  if (range) {
      const [min, max] = range.match(/^\((\d+)-(\d+)\)$/).slice(1).map(Number);
      tokens = tokens.filter(({ number }) => number >= min && number <= max);
  }

  // Перемешиваем массив токенов случайным образом
  const shuffledTokens = tokens.sort(() => Math.random() - 0.5);

  
  const randomCount = 50;

  // Выбираем случайное количество токенов из перемешанного массива
  return shuffledTokens.slice(0, randomCount).map(({ token }) => token);
}

app.post('/send-posts', upload.array('files'), async (req, res) => {
  const tokensJson = req.body.tokens;
  const postsJson = req.body.posts;
  const files = req.files;

  if (!tokensJson || !postsJson) {
      return res.status(400).json({ error: 'Заполните оба поля' });
  }

  let tokensData, postsData;

  try {
      tokensData = JSON.parse(tokensJson);
      postsData = JSON.parse(postsJson);

      if (!Array.isArray(postsData)) {
          throw new Error('JSON должен быть массивом');
      }

      if (postsData.every(post => typeof post === 'string')) {
          postsData = postsData.map(text => ({ text }));
      } else if (postsData.every(post => typeof post === 'object' && post.text)) {
          // всё ок
      } else {
          throw new Error('Некорректный формат JSON для постов');
      }
  } catch (error) {
      return res.status(400).json({ error: `Ошибка при разборе JSON: ${error.message}` });
  }

  const publishedPosts = [];
  const allUsers = [];

  for (const token of tokensData) {
      try {
          const userInfo = await getUserInfo(token);
          allUsers.push(userInfo);
      } catch (error) {
          console.error(`Не удалось получить информацию о пользователе с токеном ${token}: ${error.message}`);
          allUsers.push({ id: 'unknown', firstName: '', lastName: '' });
      }
  }

  // Этап 2: Публикация постов
  for (let i = 0; i < Math.min(tokensData.length, postsData.length); i++) {
      const token = tokensData[i];
      const post = postsData[i];

      try {
          const userInfo = allUsers[i] || {};
          const ownerId = userInfo.id;

          let attachments = [];

          if (files && files.length > 0) {
              for (const file of files) {
                  const ext = path.extname(file.originalname).toLowerCase();
                  let attachment = null;

                  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                      attachment = await uploadPhotoToVK(token, ownerId, file.path);
                  } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
                      attachment = await uploadVideoToVK(token, ownerId, file.path);
                  } else {
                      console.error(`Неподдерживаемый формат файла: ${file.originalname}`);
                  }

                  if (attachment) {
                      attachments.push(attachment);
                  } else {
                      fs.unlinkSync(file.path);
                  }
              }
          }

          const result = await writePost(token, ownerId, post.text, attachments);

          if (result.success) {
              const postUrl = `https://vk.com/wall${ownerId}_${result.postId}`;
              publishedPosts.push({
                  ownerId,
                  postId: result.postId,
                  postUrl
              });
          } else {
              console.error(`Ошибка при публикации поста: ${result.message}`);
          }
      } catch (error) {
          console.error(`Ошибка при работе с токеном: ${error.message || error}`);
      }
  }

  // Формируем список имён и ссылок
  const usernames = publishedPosts.map((_, index) => {
      const user = allUsers[index] || {};
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  });

  const links = publishedPosts.map(p => p.postUrl);

  // Отправляем результат в Telegram
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await sendToTelegram(usernames, links, 'post'); 
  }
  if (publishedPosts.length > 0) {
      const postLinks = publishedPosts.map(post => post.postUrl);
      const processingResult = await processLinks(postLinks, 'post');
      console.log('Результат обработки:', processingResult);
    }

  // АСИНХРОННО СТАВИМ ЛАЙКИ
  setTimeout(async () => {
      try {
          const allTokens = Object.entries(process.env)
              .filter(([key]) => key.startsWith('TOKEN_'))
              .map(([, value]) => value);

          const shuffledTokens = [...allTokens].sort(() => Math.random() - 0.5);
          const selectedLikeTokens = shuffledTokens.slice(0, 50);

          for (const post of publishedPosts) {
              for (const likeToken of selectedLikeTokens) {
                  try {
                      await delay(700);
                      await likePost(likeToken, post.ownerId, post.postId);
                  } catch (error) {
                      console.error(`Ошибка при лайке для токена ${likeToken}: ${error.message}`);
                  }
              }
          }

      } catch (e) {
          console.error("Ошибка при фоновых лайках:", e.message);
      }
  }, 0);

  // Отправляем ответ клиенту
  res.json(publishedPosts.map(post => ({
      success: true,
      postId: post.postId,
      postUrl: post.postUrl
  })));
});

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
            // Парсим исходную ссылку
            const parsedLink = parsePostLink(link);
            if (!parsedLink) throw new Error('Некорректный формат ссылки');

            const { ownerId, postId } = parsedLink;
            const response = await axios.get('https://api.vk.com/method/wall.repost', {
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

            const firstName = userInfo.firstName || '';
            const lastName = userInfo.lastName || '';
            usernames.push(`${firstName} ${lastName}`.trim());

            setTimeout(async () => {
                const parsedRepostLink = parsePostLink(repostUrl);
                if (!parsedRepostLink) return;

                const { ownerId: likeOwnerId, postId: likePostId } = parsedRepostLink;
                const allTokens = getRandomTokens("(1-100)");
                for (const likeToken of allTokens) {
                    try {
                        await delay(700);
                        await likePost(likeToken, likeOwnerId, likePostId);
                    } catch (error) {
                        console.error(`Ошибка при лайке: ${error.message}`);
                    }
                }
            }, 0);

        } catch (e) {
            console.error(`Ошибка при репосте: ${e.message}`);
        }
    }

    if (results.length > 0) {
        await sendToTelegram(usernames, results, 'repost'); // ОДНО сообщение в Telegram
              
    }

    if (results.length > 0) {
      const processingResult = await processLinks(results, 'repost');
      console.log('Результат обработки репостов:', processingResult);
    }

    res.json({ success: true, count: results.length, links: results });
});

// Маршрут для получения списка пользователей через GET
app.get("/fetch-users", async (req, res) => {
    try {
      const range = req.query.range; // Получаем диапазон из query string
      let min = null, max = null;
  
      // Проверяем и парсим диапазон, если он указан
      if (range) {
        const match = range.match(/^\((\d+)-(\d+)\)$/);
        if (!match) {
          return res.status(400).json({ error: "Некорректный формат диапазона" });
        }
        min = parseInt(match[1], 10);
        max = parseInt(match[2], 10);
  
        if (isNaN(min) || isNaN(max) || min > max) {
          return res.status(400).json({ error: "Некорректные значения min и max" });
        }
      }
  
      // Получаем все токены из .env файла
      const tokensJson = Object.entries(process.env)
        .filter(([key]) => key.startsWith("TOKEN_"))
        .map(([key, value]) => {
          const tokenNumber = parseInt(key.replace("TOKEN_", ""), 10);
          return { token: value, number: tokenNumber };
        })
        // Сортируем токены по номеру
        .sort((a, b) => a.number - b.number);
  
      // Фильтруем токены по диапазону, если указан
      const filteredTokens = range
        ? tokensJson.filter((item) => item.number >= min && item.number <= max)
        : tokensJson;
  
      if (filteredTokens.length === 0) {
        return res.status(404).json({ error: "Токены не найдены" });
      }
  
      // Получаем информацию о пользователях для отфильтрованных токенов
      const users = [];
      for (const { token } of filteredTokens) {
        try {
          const userInfo = await getUserInfo(token);
          users.push({ ...userInfo, token });
        } catch (error) {
          console.error(
            `Не удалось получить информацию о пользователе с токеном ${token}: ${
              error.message || error
            }`
          );
        }
      }
  
      // Возвращаем список пользователей
      res.json(users);
    } catch (error) {
      console.error("Ошибка при обработке запроса /fetch-users:", error.message || error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  });
// Функция для получения информации о пользователе
async function getUserInfo(token) {
  try {
    const response = await axios.get("https://api.vk.com/method/users.get", {
      params: {
        access_token: token,
        v: "5.131",
      },
    });

    console.log("Ответ от API VK:", response.data);

    if (
      !response.data.response ||
      !Array.isArray(response.data.response) ||
      response.data.response.length === 0
    ) {
      throw new Error("Некорректный ответ от API VK");
    }

    const user = response.data.response[0];
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  } catch (error) {
    console.error(
      "Ошибка при получении информации о пользователе:",
      error.message || error
    );
    throw error;
  }
}

// Запуск сервера
// === Очередь задач ===
const taskQueue = [];
let isProcessing = false;




// Дефолтные значения
const DEFAULT_API_ID = ACCOUNTS[0]?.api_id || 22482713;
const DEFAULT_API_HASH = ACCOUNTS[0]?.api_hash || "76343050cd0b4d8e3cc95b9ceee667fe";

let clients = [];


// === Парсинг ссылки ВК ===
function parseVkPostUrl(url) {
    const match = url.match(/vk\.com\/wall(-?\d+)_(\d+)/i);
    if (!match) return null;

    return {
        ownerId: match[1],
        postId: match[2],
        fullId: `${match[1]}_${match[2]}`,
    };
}

// === Генерация скриншота ===
async function generateScreenshot(url, attempt = 1) {
    const MAX_ATTEMPTS = 2;
    const RETRY_DELAY = 3000; // 3 секунды между попытками
    
    try {
        const apiKey = '4110c0';
        const { viewport, clip } = screenshotConfig;
        const apiUrl = `https://api.screenshotmachine.com?key=${apiKey}&url=${
            encodeURIComponent(url)
        }&dimension=${
            viewport.width
        }x${
            viewport.height
        }&device=desktop&format=jpg&delay=2000`;
        
        console.log(`📸 Попытка ${attempt}: Делаем скриншот ${url}`);
        
        const screenshotDir = path.resolve(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Пустой ответ от сервера скриншотов');
        }

        const outputPath = path.join(screenshotDir, `screenshot_${Date.now()}_attempt_${attempt}.jpg`);

        await sharp(response.data)
            .extract({
                left: Math.round(clip.x),
                top: Math.round(clip.y),
                width: Math.round(clip.width),
                height: Math.round(clip.height),
            })
            .toFile(outputPath);

        console.log(`✅ Успешно! Скриншот сохранен: ${outputPath}`);
        return outputPath;

    } catch (err) {
        console.error(`❌ Ошибка в попытке ${attempt}:`, err.message);
        
        if (attempt < MAX_ATTEMPTS) {
            console.log(`🔄 Повторная попытка через ${RETRY_DELAY/1000} сек...`);
            await delay(RETRY_DELAY);
            return generateScreenshot(url, attempt + 1);
        } else {
            console.error(`🚫 Все ${MAX_ATTEMPTS} попытки создания скриншота провалились`);
            return null;
        }
    }
}

// === Получение ID пользователя ВК ===
async function getVkUserId(vkToken) {
    try {
        const res = await axios.get("https://api.vk.com/method/users.get", {
            params: {
                v: "5.199",
                access_token: vkToken,
            },
        });

        const user = res.data.response?.[0];
        if (!user) throw new Error("❌ Не удалось получить ID пользователя ВК");

        return Math.abs(user.id);
    } catch (err) {
        console.error("❌ Ошибка получения ID из ВК:", err.message);
        return null;
    }
}

// === Инициализация клиента ===
async function initClient(accountConfig) {
    try {
        const client = new TelegramClient(
            new StringSession(accountConfig.session),
            accountConfig.api_id || DEFAULT_API_ID,
            accountConfig.api_hash || DEFAULT_API_HASH,
            { connectionRetries: 5 }
        );

        await client.start({
            phoneNumber: () => Promise.resolve(""),
            password: () => Promise.resolve(""),
            phoneCode: () => Promise.resolve(""),
            onError: (err) => console.log(err),
        });

        if (!(await client.isUserAuthorized())) {
            console.warn(`⚠️ Аккаунт ${accountConfig.id} не авторизован`);
            return null;
        }

        const self = await client.getMe();
        console.log(`✅ Аккаунт ${accountConfig.id} (${self.username}) подключен`);

        // Получаем VK ID если не указан
        let vkUserId = accountConfig.vk_user_id;
        if (!vkUserId && accountConfig.vk_token) {
            vkUserId = await getVkUserId(accountConfig.vk_token);
        }

        return {
            id: accountConfig.id,
            client,
            username: self.username,
            chat_id: accountConfig.chat_id,
            vk_user_id: vkUserId,
            api_id: accountConfig.api_id || DEFAULT_API_ID,
            api_hash: accountConfig.api_hash || DEFAULT_API_HASH
        };

    } catch (err) {
        console.error(`❌ Ошибка инициализации аккаунта ${accountConfig.id}:`, err.message);
        return null;
    }
}

// === Проверка доступа к чату ===
async function checkChatAccess(client, chatId) {
    try {
        await client.getInputEntity(chatId);
        return true;
    } catch (err) {
        console.error(`❌ Нет доступа к чату ${chatId}:`, err.message);
        return false;
    }
}

// === Отправка в чат ===
async function sendToChat(clientObj, chatId, link, imagePath) {
    try {
        if (!(await checkChatAccess(clientObj.client, chatId))) {
            return false;
        }

        // Отправляем ссылку в любом случае
        await clientObj.client.sendMessage(chatId, {
            message: link
        });
        console.log(`📨 [${clientObj.username}] Ссылка отправлена в ${chatId}`);

        // Пытаемся отправить скриншот, если он есть
        if (imagePath && fs.existsSync(imagePath)) {
            try {
                await clientObj.client.sendFile(chatId, {
                    file: imagePath
                });
                console.log(`🖼️ [${clientObj.username}] Скриншот отправлен`);
                fs.unlinkSync(imagePath);
            } catch (err) {
                console.error(`⚠️ [${clientObj.username}] Ошибка отправки скриншота:`, err.message);
            }
        } else {
            console.log(`ℹ️ [${clientObj.username}] Скриншот недоступен для отправки`);
        }

        return true;
    } catch (err) {
        console.error(`❌ [${clientObj.username}] Ошибка отправки:`, err.message);
        return false;
    }
}
// === Обработка ссылки ===
async function processVkLink(link) {
    try {
        const parsed = parseVkPostUrl(link);
        if (!parsed) {
            console.warn(`🚫 Неверная ссылка: ${link}`);
            return;
        }

        const ownerVkId = Math.abs(parseInt(parsed.ownerId));
        console.log(`🔍 Пост от VK ID: ${ownerVkId}`);

        // Ищем подходящий аккаунт в конфиге (без предварительной инициализации)
        let targetAccount = null;
        
        for (const acc of ACCOUNTS) {
            if (!acc.vk_token) continue;
            
            try {
                // Для проверки соответствия сначала смотрим указанный vk_user_id
                if (acc.vk_user_id && Math.abs(acc.vk_user_id) === ownerVkId) {
                    targetAccount = acc;
                    break;
                }
                
                // Если vk_user_id не указан, получаем его из API VK
                if (!acc.vk_user_id) {
                    const accVkId = await getVkUserId(acc.vk_token);
                    if (accVkId === ownerVkId) {
                        targetAccount = acc;
                        break;
                    }
                }
            } catch (err) {
                console.warn(`⚠️ Ошибка проверки аккаунта ${acc.id}:`, err.message);
            }
        }

        if (!targetAccount) {
            console.warn(`🚫 Не найден аккаунт для VK ID ${ownerVkId}`);
            return;
        }

        // Проверяем, есть ли уже инициализированный клиент
        let clientObj = clients.find(c => c.id === targetAccount.id);
        
        // Если нет - инициализируем только этот аккаунт
        if (!clientObj) {
            console.log(`⚡ Инициализируем аккаунт ${targetAccount.id}...`);
            clientObj = await initClient(targetAccount);
            if (clientObj) {
                clients.push(clientObj);
            } else {
                console.warn(`⚠️ Не удалось подключить аккаунт ${targetAccount.id}`);
                return;
            }
        }

        // Готовим данные для отправки
        const targetChatId = clientObj.chat_id || targetAccount.chat_id;
        console.log(`💬 Отправляем в чат: ${targetChatId}`);
        
        const screenshotPath = await generateScreenshot(link);
        await sendToChat(clientObj, targetChatId, link, screenshotPath);

    } catch (err) {
        console.error(`❌ Ошибка обработки:`, err.message);
    }
}

// === Инициализация клиентов ===
async function initializeClients() {
    try {
        // Проверка конфигурации
        ACCOUNTS.forEach(acc => {
            if (!acc.api_id || !acc.api_hash) {
                console.log(`ℹ️ Аккаунт ${acc.id} использует дефолтные API credentials`);
            }
        });

        // Инициализация всех клиентов
        for (const account of ACCOUNTS) {
            const client = await initClient(account);
            if (client) {
                clients.push(client);
            }
            await delay(1000); // Задержка между инициализацией аккаунтов
        }

        console.log(`✅ Инициализировано ${clients.length} клиентов из ${ACCOUNTS.length} аккаунтов`);
    } catch (err) {
        console.error("Критическая ошибка при инициализации клиентов:", err);
        process.exit(1);
    }
}

const PORT =  3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту1 ${PORT}`);
});
