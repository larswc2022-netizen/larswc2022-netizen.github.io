# FEASIBILITY (этап 0)

Среда проверки: песочница без DNS к vk.com, vkvideo.ru, msx.benzac.de (`curl: (6) Could not resolve host`). Доступны: github.com, api.github.com, raw.githubusercontent.com, npm. Источник по MSX: вики (web_fetch), страницы Start Object, Menu Root/Item, Content Root/Item, Actions, Interaction Plugin, Setup Precondition, Setup Start Parameter. Не прочитаны: Android Plugin, HTML5X Plugin, Video/Audio Plugin, URL Parameters, Icons, Release Notes.

| # | Пункт | Вердикт | Доказательство |
|---|-------|---------|----------------|
| а1 | start.json: `name`, `version`, `parameter` обязательны; `parameter` начинается с `menu:` или `content:` | РАБОТАЕТ | Вики Start Object |
| а2 | menu.json: единственное обязательное поле корня `menu` (массив); пункт грузит контент через `data` (URL или inline content root object) | РАБОТАЕТ | Вики Menu Root Object / Menu Item Object |
| а3 | Действия: `video:URL`, `link:URL`, `link:window:URL`, `video:plugin:URL`, `menu:`, `content:` и др. | РАБОТАЕТ | Вики Actions |
| а4 | Нужен CORS (`Access-Control-Allow-Origin`) на хостинге JSON | РАБОТАЕТ (требование) | Вики Setup Precondition; локально проверено через `http-server --cors` (см. REPORT) |
| а5 | HTTPS для start.json возможен с security lock (версия 0.1.88+); если MSX открыт по HTTPS, lock обязателен, все JSON/плагины только по HTTPS | РАБОТАЕТ (требование) | Вики Setup Start Parameter |
| а6 | `{SERVER}` вводится как hostname/IP, файл ищется по `https://{SERVER}/msx/start.json` | РАБОТАЕТ | Вики Setup Start Parameter. Следствие: путь в адресе вводить нельзя, нужен репозиторий `<user>.github.io` или shortener `id:igd:alias` |
| а7 | Эталон GitHub Pages: start.json с абсолютным URL меню | РАБОТАЕТ | raw.githubusercontent.com/benzac-de/msx/refs/heads/main/start.json (выведен curl-ом) |
| б | VK/vkvideo.ru в iframe/plugin: X-Frame-Options / CSP frame-ancestors | НЕПРОВЕРЕНО | `curl -I https://vk.com` -> `Could not resolve host`. Команда для вас: `curl -sI https://vkvideo.ru/ \| grep -iE 'x-frame-options\|content-security-policy'` |
| б2 | Interaction Plugin = HTML в фоновом iframe, не получает ввод с пульта | РАБОТАЕТ (ограничение) | Вики Interaction Plugin: плагин не принимает key/mouse/touch. Интерактивный VK-UI через него невозможен |
| в | Официальный способ показать VK-видео: iframe `video_ext.php?oid=..&id=..` (виджет VK, JS API через `js_api=1`); метаданные через `video.get` (нужен токен) | РАБОТАЕТ вне MSX; внутри MSX НЕПРОВЕРЕНО | dev.vk.ru/en/widgets/video (виден в поисковой выдаче, страницу целиком не читал). Нужны owner_id и video id (иногда hash). Токен нужен только для video.get. ToS VK не читал: НЕПРОВЕРЕНО |
| в2 | Прямой поток VK (mp4/hls) без обхода защиты | НЕ РАБОТАЕТ (легально) | Официального прямого URL нет; извлечение из страницы = скрапинг, запрещено правилом 2. Не реализовано |
| г | Запуск нативного приложения VK на ТВ из MSX | НЕПРОВЕРЕНО | В прочитанной вики только `system:hbbtv:launch` (HbbTV) и `link:window:`. Страницу Android Plugin не читал |
| д | Выбор пути | Путь A | см. ниже |

## Выбор: Путь A (статические start.json + menu.json)
1. Цель (меню по одному адресу) закрывается двумя статическими JSON, сервер не нужен.
2. Пути B и C не дают легального выигрыша: Interaction Plugin не принимает ввод, прямого VK-потока официально нет.
3. Старт в один шаг: start.json -> menu.json, контент групп вложен inline в `data` (без третьего запроса).
4. VK-пункты открываются через `link:` (запасной `link:window:`), прямые mp4/m3u8/mpd не из VK играет нативный плеер MSX (`video:`).
5. Ограничение: VK внутри плеера MSX не воспроизводится. Это лучший легальный вариант из проверенных.
