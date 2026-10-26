# msx-vk: меню для Media Station X

Один адрес на ТВ, готовое меню из `links.yaml`. Статика на GitHub Pages, без сервера.

## Как добавить пункт
1. В `links.yaml` добавь блок в `items`:
   ```yaml
   - title: "Название"
     type: video      # video | web
     url: "https://..."
     open: inline     # необязательно: inline | window
   ```
2. `npm test` (схема, размеры, действия).
3. `git commit -am "add item" && git push`. Workflow соберёт, проверит и опубликует.

Прямой файл (.mp4/.m3u8/.mpd/.webm, не VK) в `type: video` играет плеер MSX. Всё остальное, включая любые страницы VK, открывается как ссылка: прямого легального потока VK нет.

## Подключение на ТВ за 5 шагов
1. Создай публичный репозиторий `<USER>.github.io`, залей код в `main`.
2. Repo Settings -> Pages -> Source: GitHub Actions. Дождись зелёного workflow `deploy`.
3. Проверь в браузере: `https://<USER>.github.io/msx/start.json` отдаёт JSON.
4. На ТВ: Media Station X -> Settings -> Start Parameter -> Setup -> ввести `<USER>.github.io`, включить security lock (нужна MSX 0.1.88+).
5. Подтвердить setup. Меню грузится при каждом запуске.

Если репозиторий называется иначе (в адресе был бы путь), вводить путь нельзя: зарегистрируй `https://<USER>.github.io/<REPO>/msx/start.json` в is.gd с алиасом и введи `id:igd:<alias>` (вики MSX, Setup Start Parameter).

## Команды
- `npm run build` собрать `dist/` (BASE_URL из env или `site.base_url`, только https)
- `npm run validate [-- --online]` схема, размеры, опционально доступность URL (VK при недоступности даёт только warning)
- `npm test` все тесты
- `npm run serve`, затем `npm run check`: локальный http-server с CORS и проверка заголовков
