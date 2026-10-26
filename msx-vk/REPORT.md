# REPORT

## 1. Что сделано
Путь A: `links.yaml` -> `src/build.js` -> `dist/msx/start.json` + `menu.json` (минифицированы) -> GitHub Pages через `.github/workflows/deploy.yml` (test, build, validate --online, deploy, verify curl-ом). Причина выбора: см. FEASIBILITY.md. Не опубликовано: нет `gh` и авторизации.

## 2. Проверки
| Пункт | Результат | Доказательство |
|---|---|---|
| Схема start/menu/content/actions по вики | OK | чтение вики, `npm run validate`: `validation OK (4 URLs referenced)` |
| Тесты | 8/8 | `npm test`: tests 8, pass 8, fail 0 |
| Негативные тесты (битый action, дубль id, http base, картинка >30 КБ, VK не мапится в `video:`) | OK | test/build.test.js |
| Workflow YAML синтаксис | OK | python yaml.safe_load, jobs: build, deploy, verify |
| Версии Actions | OK | `git ls-remote --tags` |
| Локально: HTTP 200, `application/json; charset=UTF-8`, `access-control-allow-origin: *` | OK | `scripts/check-http.sh http://127.0.0.1:8080`, exit 0 |
| HTTPS и сертификат GitHub Pages | НЕ ПРОВЕРЕНО | публикации не было |
| CORS на GitHub Pages | НЕ ПРОВЕРЕНО | то же; verify-job в workflow проверит после деплоя |
| Веб-MSX + скриншоты (Playwright) | НЕ ВЫПОЛНЕНО | нет браузера в песочнице, msx.benzac.de недоступен по DNS |
| Реальный ТВ | НЕ ПРОВЕРЕНО | проверить нельзя |

## 3. Производительность (локальный http-server, loopback, это НЕ сеть и НЕ CDN)
- start.json: 143 Б, TTFB 0.9-2.0 мс (5 прогонов)
- menu.json: 853 Б (лимит 50 КБ), TTFB 1.0-1.9 мс
- Запросов при старте: 2 (start.json, menu.json); редиректов нет; контент групп inline
- Иконки: встроенные MSX, картинок нет
- Сжатие и кеш: локальный сервер gzip не включал, `cache-control: no-cache` (флаг `-c-1`). Заголовки GitHub Pages НЕ ПРОВЕРЕНЫ, настроить их на Pages нельзя. Реальные TTFB с CDN надо замерить: `bash scripts/check-http.sh https://<USER>.github.io`

## 4. НЕПРОВЕРЕНО и ограничения (VK)
- X-Frame-Options/CSP vk.com и vkvideo.ru: DNS недоступен. Без этого iframe-плеер VK внутри MSX не оценить.
- Воспроизведение VK внутри MSX не реализовано: официального прямого потока нет, извлечение из страницы = скрапинг (запрещено). VK-пункты только открывают страницу через `link:`; как это отработает на ТВ, неизвестно.
- Официальный embed `video_ext.php` с JS API (dev.vk.ru/en/widgets/video) теоретически можно обернуть в Video Plugin (путь B). Не строил: нужны oid/id конкретных видео, проверка frame-ancestors и вики по Video/Audio Plugin, плюс ToS VK не читал.
- Нативное приложение VK из MSX: НЕПРОВЕРЕНО (Android Plugin не читал).
- Список валидных иконок (вики Icons) не читал, использованы только виденные в официальных примерах.
- Формат веб-запуска `?start=menu:<URL>`: по аналогии с демо из вики Interaction Plugin (`?start=content:...`), страницу URL Parameters не читал.

## 5. Слабые места и риски
- Главный: ценность для VK ограничена ссылкой. Если `link:` на ТВ не открывает vkvideo.ru, VK-пункты бесполезны; запасной `open: window` может тоже не сработать.
- Адрес на ТВ без пути: нужен репозиторий `<USER>.github.io` или is.gd-алиас (зависимость от стороннего сервиса).
- Нужна MSX 0.1.88+ (security lock). Старые прошивки ТВ могут держать старую версию.
- Пример mp4 из вики на `http://` (чужой хост): при открытии MSX по HTTPS возможен mixed content (вики: протокол медиа не обновляется).
- Pages не даёт настраивать заголовки: gzip/cache определяет GitHub.

## 6. ТРЕБУЕТСЯ ЧЕЛОВЕК
1. Публикация (нужна авторизация): `gh auth login`, затем в папке msx-vk: `gh repo create <USER>.github.io --public --source=. --push`, затем Settings -> Pages -> Source: GitHub Actions (или `gh api -X POST repos/<USER>/<USER>.github.io/pages -f build_type=workflow`, команду API не проверял). Дождаться зелёного `deploy`, затем `bash scripts/check-http.sh https://<USER>.github.io`.
2. Подставить свои ссылки в `links.yaml`, `git commit -am "links" && git push`.
3. На ТВ: Settings -> Start Parameter -> Setup -> ввести `<USER>.github.io` (security lock включить). Открыть пункт VK и сообщить, открылась ли страница; если нет, поставить `open: window` или идти путём B.
