# ДАДАШПИЛЬ 0.0

> **"Искусство — это когда не надо понимать."**

![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Vite](https://img.shields.io/badge/Vite-Fast-yellow)
![License](https://img.shields.io/badge/License-Dada_MIT-red)
![Status](https://img.shields.io/badge/Status-DADA-purple)

**ДАДАШПИЛЬ** — это вам не это, замаскированное под игру. Срюреалистический опыт, биоэксперимент и интерактивный манифест по мотивам похуждений широкобезызвестного антиподадаистического конвектива "Хорда Дадаизма".

---

## 📢 МАНИФЕСТ

Полный текст Манифеста Хорды Дадаизма, включая все куплеты о пылесосах, человечицах и перфокартах, вынесен в отдельный документ во избежание переполнения буфера реальности.

### 👉 [ЧИТАТЬ ПОЛНЫЙ МАНИФЕСТ (MANIFESTO.md)](./MANIFESTO.md)

> *Ваш календарь — ложь. Ваша грамматика — тюрьма. Вы — не зритель. Вы — соучастник.*

---

## 🎮 О ПРОЕКТЕ

Это набор мини-игр ("снов"), объединенных сквозным сюжетом о поиске смысла там, где его нет. Игрок выбирает персонажа (Канила Дозловский, Сексизм Эванович или Чёрный Игрок) и проходит через серию испытаний.

### Особенности:
*   **3 Уникальных Персонажа**: Каждый со своим набором правил, визуальным стилем и способностями.
*   **Адаптивная сложность**: Чёрный Игрок играет в совершенно другую игру (survival horror), в то время как Канила наслаждается аркадным хаосом.
*   **Сезонные события**: Игра меняется в зависимости от реальной даты (Новый год, 3 сентября, Хэллоуин и др.).

---

## 🛠 ТЕХНИЧЕСКИЙ СТЕК

Проект написан с использованием современных веб-технологий и лучших практик Frontend-разработки, несмотря на безумие происходящего на экране.

*   **Core**: React 19, TypeScript, Vite.
*   **Styling**: Tailwind CSS + Custom CSS Animations (Glitch effects, transitions).
*   **Architecture**:
    *   **Context API**: Глобальное управление состоянием разделено на логические домены (`Session`, `Navigation`, `Settings`, `Profile`), что предотвращает лишние ререндеры.
    *   **Custom Hooks**: `useGameLoop` для высокопроизводительной анимации (requestAnimationFrame), `useIsMobile` для адаптивности.
*   **Audio Engine**: Собственный аудио-движок на базе **Web Audio API**. Поддержка процедурной генерации звуков (осцилляторы для эффектов) и управление фоновой музыкой без внешних библиотек.
*   **Graphics**: Процедурный пиксель-арт (SVG-рендеринг на основе текстовых матриц) и Canvas API для высоконагруженных сцен (шутер, раннер).

---

## 🚀 ЗАПУСК

Чтобы запустить этот биоэксперимент на своей локальной машине:

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/chordadada/dadaspiel.git
    cd dada-spiel
    ```

2.  **Установите зависимости:**
    ```bash
    npm install
    ```

3.  **Запустите сервер разработки:**
    ```bash
    npm run dev
    ```

4.  Откройте браузер и ВЫЙДИТЕ ИЗ ТЕЛЕВИЗОРА (перейдите по адресу `http://localhost:5173`).

---

## 🌐 СВЯЗЬ С ПУСТОТОЙ

[![YouTube](https://img.shields.io/badge/Ютуб-DADA00?style=for-the-badge&logo=YouTube&logoColor=DA00DA)](https://www.youtube.com/@chordadada)
[![Telegram](https://img.shields.io/badge/Телега-00DADA?style=for-the-badge&logo=telegram&logoColor=DA00DA)](https://t.me/chordadada)
[![Instagram](https://img.shields.io/badge/Инста-DADA11?style=for-the-badge&logo=Instagram&logoColor=DA11DA)](https://www.instagram.com/chordadada)
[![Facebook](https://img.shields.io/badge/Фэйсбуб-11DADA?style=for-the-badge&logo=Facebook&logoColor=DA11DA)](https://www.facebook.com/chorda.dadaisme/)
[![VK](https://img.shields.io/badge/ВэКа-DADA01?style=for-the-badge&logo=VK&logoColor=DA01DA)](https://vk.com/chordadada)
[![SoundCloud](https://img.shields.io/badge/СаўндКлаўд-10DADA?style=for-the-badge&logo=SoundCloud&logoColor=DA10DA)](https://soundcloud.com/soundadada)
[![Spotify Rus](https://img.shields.io/badge/Спотик-DADA10?style=for-the-badge&logo=spotify&logoColor=DA10DA)](https://open.spotify.com/show/2tnJSAoaoDoCEshJjVLsph)
[![Spotify Eng](https://img.shields.io/badge/Spotify-01DADA?style=for-the-badge&logo=spotify&logoColor=DA01DA)](https://open.spotify.com/show/7qJJJBKML70xiqyJSCh2DZ)

---

## 👨‍🎨 АВТОРСТВО И ЛИЦЕНЗИЯ

Этот проект распространяется свободно. Вы можете скачивать, модифицировать и использовать его код.

Однако, согласно **ДАДА-ЛИЦЕНЗИИ**, любое использование материалов данного репозитория требует:
1.  Упоминания оригинального репозитория.
2.  Указания авторства: **"Лев и Близнецы эксклюзивно для Хорды Дадаизма"**.

**ХОРДА! ДА! ДАДАИЗМА!**
