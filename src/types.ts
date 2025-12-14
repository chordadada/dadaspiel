
// Перечисление (enum) для всех возможных экранов в игре.
// Используется для управления тем, какой компонент отображается в данный момент.
export enum GameScreen {
  WARNING,            // Экран предупреждения об эпилепсии (самый первый)
  PROFILE_SELECTION,  // Экран выбора и создания профиля игрока
  LEADERBOARD,        // Экран таблицы рекордов
  START_SCREEN,       // Теперь это экран выбора персонажа для нового профиля
  CASE_SELECTION,     // Экран выбора "Дела" (уровня)
  MINIGAME_INTRO,     // Вступительный экран перед мини-игрой
  MINIGAME_PLAY,      // Экран самой мини-игры
  CASE_OUTRO,         // Экран после успешного завершения "Дела"
  FINAL_ENDING,       // Финальный экран после прохождения всех "Дел"
  DEBUG_MENU,         // Меню отладки для тестирования
  LOG_VIEW,           // Экран просмотра логов событий
  DEBUG_ANIMATION_VIEWER, // Экран для просмотра победных анимаций
}

// Перечисление персонажей, доступных для выбора.
export enum Character {
  KANILA = "Канила Дозловский",
  SEXISM = "Сексизм Эванович",
  BLACK_PLAYER = "Чёрный Игрок",
}

// Сезонные события
export enum SeasonalEvent {
  NONE = "NONE",
  NEW_YEAR = "NEW_YEAR", // Оливье и майонез
  APRIL_FOOLS = "APRIL_FOOLS", // Бюрократия и скука
  HALLOWEEN = "HALLOWEEN", // Экзистенциальный ужас
  DADA_BIRTHDAY = "DADA_BIRTHDAY", // 2 августа (День ВДВ + Дада)
  SEPTEMBER_3 = "SEPTEMBER_3", // Шуфутинский
  GONDOLIER_DAY = "GONDOLIER_DAY", // 4 марта
  GLITCH_DAY = "GLITCH_DAY", // 29 мая (День Глюка)
  POTATO_SALVATION = "POTATO_SALVATION", // 20 октября (Картофельный Спас)
}

// Интерфейс, описывающий структуру данных одной мини-игры.
export interface MinigameData {
  id: string;         // Уникальный идентификатор (например, "1-1")
  name: string;       // Название мини-игры
  intro: string;      // Вступительный текст, описывающий задачу
}

// Интерфейс, описывающий структуру данных одного "Дела" (уровня).
export interface CaseData {
  id: number;                   // Уникальный номер "Дела"
  title: string;                // Название "Дела"
  intro: string;                // Вступительный текст перед началом "Дела"
  outro: string;                // Текст после завершения "Дела"
  minigames: MinigameData[];  // Массив мини-игр, входящих в это "Дело"
  unlocks: number;              // ID "Дела", которое открывается после прохождения этого. -1 если ничего не открывает.
}

// Интерфейс для одной записи в логе событий (для отладки).
export interface LogEntry {
  timestamp: string;  // Время события
  message: string;    // Сообщение о событии
};

// Интерфейс для профиля игрока
export interface PlayerProfile {
  id: string;          // Уникальный ID, например, timestamp
  name: string;        // Имя игрока
  character: Character; // Выбранный персонаж
  progress: { [caseId: number]: number }; // Ключ - ID дела, значение - кол-во пройденных мини-игр
  highScore: number;   // Лучший счёт
  gameCompleted?: boolean; // Завершил ли этот профиль всю игру?
  hasDadaToken?: boolean;  // Есть ли у этого профиля (Чёрного Игрока) особая фишка?
}