# ASSUMPTIONS
1. Устройство: Smart TV (Samsung/LG/Android TV) с MSX, слабое железо, пульт без мыши. Нужна версия MSX >= 0.1.88 (HTTPS + security lock). НЕПРОВЕРЕНО на реальном ТВ.
2. Контент: links.yaml, поля title/type/url/open/icon. Ссылок не дано, созданы 3 заглушки: корень vkvideo.ru, пример mp4 из вики MSX, msx.benzac.de/info.
3. Хостинг: GitHub Pages через Actions. Репозиторий `<user>.github.io`, чтобы на ТВ вводился чистый hostname.
4. Язык меню русский, комментарии в коде английские.
5. Иконки: только виденные в официальных примерах (`movie`, `pages`, `play-circle-outline`, `info`). Страницу Icons не читал.
6. `link:` для VK по умолчанию, `open: window` запасной. Реакция браузера ТВ на vkvideo.ru неизвестна.
7. Картинок в меню нет (только иконки). img/ копируется в dist, лимит 30 КБ на файл проверяет валидатор. Конвертации в WebP нет.
8. Версии Actions из `git ls-remote --tags` (мажорные теги): checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5.
