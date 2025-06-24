document.addEventListener('DOMContentLoaded', function() {
  // Функция для копирования ссылок из списка
  function copyLinks(listId) {
    const list = document.getElementById(listId);
    const links = list.querySelectorAll('a');
    const linksText = Array.from(links).map(link => link.href).join('\n');
    
    navigator.clipboard.writeText(linksText)
      .then(() => {
        alert('Ссылки скопированы в буфер обмена!');
      })
      .catch(err => {
        console.error('Не удалось скопировать ссылки: ', err);
        alert('Произошла ошибка при копировании ссылок');
      });
  }

  // Обработчики для кнопок
  document.getElementById('copyPostLinksButton').addEventListener('click', function() {
    copyLinks('linksList');
  });

  document.getElementById('copyRepostLinksButton').addEventListener('click', function() {
    copyLinks('linksListReposts');
  });
});