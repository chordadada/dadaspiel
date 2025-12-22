
import { useRef, useEffect, useCallback } from 'react';

/**
 * Кастомный хук для создания игрового цикла.
 * Использует requestAnimationFrame и pattern с сохраненным колбэком (savedCallback),
 * чтобы избежать пересоздания цикла при изменении зависимостей колбэка.
 * @param callback - Функция, вызываемая на каждом кадре (получает deltaTime в мс).
 * @param isRunning - Флаг активности цикла.
 */
export const useGameLoop = (callback: (deltaTime: number) => void, isRunning: boolean) => {
    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | null>(null);
    const savedCallback = useRef(callback);

    // Обновляем реф колбэка при каждом его изменении
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!isRunning) {
            previousTimeRef.current = null;
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
            return;
        }

        const animate = (time: number) => {
            if (previousTimeRef.current !== null) {
                const deltaTime = time - previousTimeRef.current;
                // Вызываем актуальную версию колбэка
                if (savedCallback.current) {
                    savedCallback.current(deltaTime);
                }
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isRunning]); // Зависит только от isRunning, цикл стабилен
};
