
// Карта, сопоставляющая ID мини-игры с URL-адресом видео из её победного экрана.
// Это позволяет централизованно управлять видео-контентом и извлекать его для
// таких механик, как "Анархический сбой" у Канилы.
export const MINIGAME_VIDEO_MAP: { [key: string]: string } = {
    "1-1": "https://www.youtube.com/watch?v=l0k6Grdu8OQ",       // Налей Шампанского
    "1-2": "https://www.youtube.com/watch?v=l0k6Grdu8OQ",       // Квир-Контроль
    "1-3": "https://vkvideo.ru/video-126259657_456239031",      // Картина 317
    "2-1": "https://www.youtube.com/watch?v=ZyOkyXVPBt4",       // Танец у Закрытых Дверей
    "2-2": "https://www.youtube.com/watch?v=VTaSn3mymIw",       // Поцелуй Добра (New Slot)
    // "2-3" (Дада-комплимент) was here, now moved to 5-2 (no video)
    "3-1": "https://www.youtube.com/watch?v=v0OXygaPB8c",       // Проход к Кино
    "3-2": "https://www.youtube.com/watch?v=a2ZFM5Ss0M0",       // Переверни Календарь
    "4-1": "https://www.youtube.com/watch?v=5eb9SoV-crA",       // Собери Феминитив
    // "4-2" (Бойцовский клуб) не имеет видео
    "5-1": "https://vkvideo.ru/video-126259657_456239048",      // Приготовление Аладок (Archived but link kept) -> Actually Ne Podavis uses a different video logic
    // "5-2": "https://www.youtube.com/watch?v=VTaSn3mymIw",    // Was Kiss of Dobro, now Compliment (no video)
    "6-1": "https://www.youtube.com/watch?v=29p14n_qeN0",       // Фруктовый Спор
    "6-2": "https://www.youtube.com/watch?v=29p14n_qeN0",       // Не Подавись! (Used same video as placeholder?) -> Zasos Pylesosa
    // "6-3" (Засос пылесоса) не имеет видео
};
