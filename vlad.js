// Функция для получения списка участников паблика
async function getGroupMembers(groupId, accessToken) {
    const apiUrl = 'https://api.vk.com/method/groups.getMembers';
    const version = '5.131'; // Версия API

    try {
        let allMembers = [];
        let offset = 0;
        const count = 1000; // Максимум 1000 участников за один запрос

        while (true) {
            const response = await fetch(`${apiUrl}?group_id=${groupId}&offset=${offset}&count=${count}&access_token=${accessToken}&v=${version}`);
            const data = await response.json();

            if (data.error) {
                console.error('Ошибка API:', data.error);
                break;
            }

            const members = data.response.items;
            if (members.length === 0) {
                break; // Больше нет участников
            }

            allMembers = allMembers.concat(members);
            console.log(`Получено ${allMembers.length} участников...`);

            offset += count;
        }

        console.log('Список всех участников:', allMembers);
        return allMembers;

    } catch (error) {
        console.error('Произошла ошибка:', error);
    }
}

// Замените groupId на ID паблика или короткое имя (screen_name)
const groupId = '229000453'; // Пример: public12345678 или просто 12345678
const accessToken = 'vk1.a.UQpphl0GtBobII37rpZJ5NyOPBLdEmoJZS3oeIBJb-lFiffmp-Mae052ZFec3NoKUEr4CqkACWoHnH-jsGP3bvMHgUx0qTBSVx5eX1-myy2QkbkETHxyBUPAZ-JWkdQSgCJCfitNJUG7dmGZ2ZU65zT2OKwhfZ1JEj7ipv-3rWY0_2LvTX24T6NGlfiTceea87WJROwVRIgkJeNWRemDnQ';

getGroupMembers(groupId, accessToken);