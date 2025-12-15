
import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

export const OrientationLock: React.FC = () => {
    const { isIOS } = useIsMobile();

    // На iOS мы не требуем поворота, так как Fullscreen API там работает плохо,
    // и мы адаптируем игру под 1:1 в портрете.
    if (isIOS) return null;

    return (
        <>
            <style>{`
                .orientation-lock-overlay {
                    display: none; /* Hidden by default */
                    position: absolute;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.95);
                    color: white;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    z-index: 9999; /* Max z-index to cover everything */
                    padding: 2rem;
                }

                @media (orientation: portrait) {
                    /* Only show the overlay and hide game content in portrait mode */
                    .orientation-lock-overlay {
                        display: flex;
                    }
                    #game-content-container {
                        display: none;
                    }
                }

                @keyframes rotate-anim {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(-90deg); }
                    100% { transform: rotate(-90deg); }
                }

                .rotate-icon {
                    width: 6rem;
                    height: 6rem;
                    border: 4px solid white;
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                    animation: rotate-anim 2s ease-in-out infinite;
                }
            `}</style>
            <div className="orientation-lock-overlay">
                <div className="rotate-icon"></div>
                <h1 className="text-6xl font-bold text-yellow-300 mb-4">ДАДАШПИЛЬ</h1>
                <h2 className="text-4xl mb-2">Пожалуйста, поверните устройство!</h2>
                <p className="mt-8 text-xl text-gray-400 max-w-md">
                    Игра работает только в горизонтальном режиме.
                </p>
            </div>
        </>
    );
};
