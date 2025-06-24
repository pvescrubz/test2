document.addEventListener('DOMContentLoaded', function () {
    const tokensInputReposts = document.getElementById("tokensContainerReposts");
    const repostLinksInput = document.getElementById("repostLinks");
    const submitRepostButton = document.getElementById("submitRepostButton");
    const progressBarReposts = document.getElementById("progressBarReposts");
    const progressTextReposts = document.getElementById("progressTextReposts");
    const progressDivReposts = document.getElementById("progress-reposts");
    const resultDivReposts = document.getElementById("result-reposts");
    const linksListReposts = document.getElementById("linksListReposts");
    const loaderReposts = document.getElementById("loader-reposts");

    function showLoaderReposts() {
        loaderReposts.style.display = "flex";
    }

    function hideLoaderReposts() {
        loaderReposts.style.display = "none";
    }

    async function fetchUsersForReposts(range = "(51-60)") {
        showLoaderReposts(); // Показываем лоадер
        try {
            const response = await fetch(`/fetch-users?range=${encodeURIComponent(range)}`, {
                method: "GET", // Используем метод GET
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const users = await response.json();

            tokensInputReposts.innerHTML = ""; // Очищаем контейнер
            const groupSize = 10; // Размер группы

            // Разделяем массив пользователей на группы по 10 элементов
            for (let i = 0; i < users.length; i += groupSize) {
                const group = users.slice(i, i + groupSize);

                // Создаем заголовок группы
                const titleGroup = document.createElement("p");
                titleGroup.textContent = `Группа ${Math.floor(i / groupSize) + 1}`;
                tokensInputReposts.appendChild(titleGroup);

                // Создаем контейнер для группы
                const groupDiv = document.createElement("div");
                groupDiv.classList.add("group");

                // Добавляем каждого пользователя в группу
                group.forEach((user) => {
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = user.token;
                    checkbox.id = `user-repost-${user.id}`;

                    const label = document.createElement("label");
                    label.htmlFor = `user-repost-${user.id}`;
                    label.textContent = `${user.firstName} ${user.lastName} (${user.id})`;

                    const div = document.createElement("div");
                    div.appendChild(checkbox);
                    div.appendChild(label);

                    groupDiv.appendChild(div);
                });

                // Добавляем группу в основной контейнер
                tokensInputReposts.appendChild(groupDiv);
            }
        } catch (error) {
            alert(`Ошибка загрузки пользователей: ${error.message}`);
        } finally {
            hideLoaderReposts(); // Скрываем лоадер
        }
    }

    document.getElementById("repostForm").addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const selectedTokens = [];
        const checkboxes = tokensInputReposts.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => selectedTokens.push(checkbox.value));
    
        if (selectedTokens.length === 0) {
            alert("Выберите аккаунты");
            return;
        }
    
        const repostLinksJson = repostLinksInput.value.trim();
        if (!repostLinksJson) {
            alert("Введите данные для репостов");
            return;
        }
    
        let repostLinksData;
        try {
            repostLinksData = JSON.parse(repostLinksJson);
            if (!Array.isArray(repostLinksData)) {
                throw new Error("Должен быть массив объектов");
            }
            if (!repostLinksData.every(item => item.comment && item.link)) {
                throw new Error("Каждый элемент должен содержать comment и link");
            }
        } catch (e) {
            alert("Ошибка в формате JSON");
            return;
        }
    
        if (selectedTokens.length !== repostLinksData.length) {
            alert(`Количество аккаунтов (${selectedTokens.length}) должно совпадать с количеством репостов (${repostLinksData.length})`);
            return;
        }
    
        submitRepostButton.disabled = true;
        submitRepostButton.innerText = "Создание репостов...";
        progressDivReposts.style.display = "flex";
        showLoaderReposts();
    
        try {
            const response = await fetch('/send-multiple-reposts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokens: selectedTokens,
                    reposts: repostLinksData
                })
            });
    
            const data = await response.json();
            const linksListReposts = document.getElementById("linksListReposts");
    
            linksListReposts.innerHTML = "";
            if (data.success && data.links) {
                data.links.forEach(url => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = url;
                    a.target = "_blank";
                    a.textContent = url;
                    li.appendChild(a);
                    linksListReposts.appendChild(li);
                });
            }
            resultDivReposts.innerText = "Репосты завершены";
    
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        } finally {
            submitRepostButton.disabled = false;
            submitRepostButton.innerText = "Создать репосты";
            progressDivReposts.style.display = "none";
            hideLoaderReposts();
        }
    });

    window.addEventListener("load", () => {
        fetchUsersForReposts("(51-60)");
    });
});