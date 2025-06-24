
document.addEventListener('DOMContentLoaded', function() {

  const tokensInput = document.getElementById("tokensContainer");
  const postsInput = document.getElementById("posts");
  const filesInput = document.getElementById("files");
  const submitButton = document.getElementById("submitButton");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const progressDiv = document.getElementById("progress");
  const resultDiv = document.getElementById("result");
  const linksList = document.getElementById("linksList");
  const loader = document.getElementById("loader"); // Лоадер
  
  let tokensData = [];
  
  // Функция для отображения лоадера
  function showLoader() {
    loader.style.display = "flex";
  }
  
  // Функция для скрытия лоадера
  function hideLoader() {
    loader.style.display = "none";
  }
  
  // Функция для получения списка пользователей
  async function fetchUsers(range = "(51-60)") {
    showLoader(); // Показываем лоадер
    try {
      const response = await fetch(`/fetch-users?range=${encodeURIComponent(range)}`, {
        method: "GET", // Используем метод GET
      });
  
      if (response.ok) {
        const users = await response.json();
        tokensInput.innerHTML = ""; // Очищаем контейнер
  
        // Размер группы (количество пользователей в одной группе)
        const groupSize = 10;
  
        // Разделяем массив пользователей на группы по 10 элементов
        for (let i = 0; i < users.length; i += groupSize) {
          const group = users.slice(i, i + groupSize);
  
          // Создаем заголовок группы
          const titleGroup = document.createElement("p");
          let groupname = `${Math.floor(i / groupSize) + 1}`;
  
          titleGroup.textContent = groupname;
          tokensInput.appendChild(titleGroup); // Добавляем заголовок в основной контейнер
  
          // Создаем контейнер для группы
          const groupDiv = document.createElement("div");
          groupDiv.classList.add("group");
  
          // Добавляем каждого пользователя в группу
          group.forEach((user) => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = user.token;
            checkbox.id = `user-${user.id}`;
            checkbox.checked = false; // По умолчанию все не выбраны
  
            const label = document.createElement("label");
            label.htmlFor = `user-${user.id}`;
            label.textContent = `${user.firstName} ${user.lastName} (${user.id})`;
  
            const div = document.createElement("div");
            div.appendChild(checkbox);
            div.appendChild(label);
  
            groupDiv.appendChild(div);
          });
  
          // Добавляем группу в основной контейнер
          tokensInput.appendChild(groupDiv);
        }
      } else {
        console.error("Ошибка при получении пользователей:", await response.text());
      }
    } catch (error) {
      console.error("Ошибка сети:", error.message || error);
    } finally {
      hideLoader(); // Скрываем лоадер
    }
  }

  
  
  
  
  
  window.addEventListener("load", fetchUsers("(51-60)"));
  
  // Отправка формы с отслеживанием прогресса
  document
    .getElementById("postForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const selectedTokens = [];
      const checkboxes = tokensInput.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      checkboxes.forEach((checkbox) => {
        selectedTokens.push(checkbox.value);
      });
  
      if (selectedTokens.length === 0) {
        alert("Пожалуйста, выберите хотя бы один аккаунт.");
        return;
      }
  
      const postsJson = postsInput.value.trim();
      const files = filesInput.files;
  
      if (!postsJson) {
        alert("Введите тексты постов.");
        return;
      }
  
      try {
        const postsData = JSON.parse(postsJson);
  
        const formData = new FormData();
        formData.append("tokens", JSON.stringify(selectedTokens));
        formData.append("posts", postsJson);
  
        for (const file of files) {
          formData.append("files", file);
        }
  
        // Блокируем кнопку
        submitButton.disabled = true;
        submitButton.innerText = "Отправка...";
  
        // Показываем прогресс-бар и лоадер
        progressDiv.style.display = "flex";
        showLoader();
  
        // Создаем XMLHttpRequest для отправки данных
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/send-posts", true);
  
        // Отслеживание прогресса загрузки
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.value = percentComplete;
            progressText.innerText = `${Math.round(percentComplete)}%`;
          }
        });
  
        // Обработка ответа сервера
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            linksList.innerHTML = ""; // Очищаем список ссылок
  
            if (data.every((item) => item.success)) {
              resultDiv.innerText = "Посты успешно опубликованы!";
              data.forEach((post) => {
                const li = document.createElement("li");
                const link = document.createElement("a");
                link.href = post.postUrl;
                link.target = "_blank";
                link.innerText = post.postUrl;
                li.appendChild(link);
                linksList.appendChild(li);
              });
            } else {
              resultDiv.innerText = "Ошибка при публикации постов.";
            }
          } else {
            resultDiv.innerText = "Ошибка при отправке данных.";
          }
  
          // Разблокируем кнопку
          submitButton.disabled = false;
          submitButton.innerText = "Отправить посты";
  
          // Скрываем прогресс-бар и лоадер
          progressDiv.style.display = "none";
          hideLoader();
        };
  
        // Обработка ошибок
        xhr.onerror = () => {
          resultDiv.innerText = "Ошибка сети.";
          submitButton.disabled = false;
          submitButton.innerText = "Отправить посты";
          progressDiv.style.display = "none";
          hideLoader();
        };
  
        // Отправляем данные
        xhr.send(formData);
      } catch (error) {
        alert('Некорректный формат JSON в поле "Посты".');
        hideLoader(); // Скрываем лоадер в случае ошибки
      }
    });
  })