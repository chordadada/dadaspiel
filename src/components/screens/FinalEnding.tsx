
import React, { useState, useEffect, useMemo } from 'react';
import { useProfile, useSettings } from '../../context/GameContext';
import { ALL_MINIGAMES } from '../../data/caseData';
import { SoundType } from '../../utils/AudioEngine';


/**
 * A purely visual component for the final scene animation.
 * The audio is now handled by the AudioEngine.
 */
const DadaEcstasyAnimation: React.FC = () => {
    // Stages: glitch (text) -> growing (sphere grows) -> pulsing (sphere pulses) -> exploding (boom)
    const [stage, setStage] = useState<'glitch' | 'growing' | 'pulsing' | 'exploding'>('glitch');
    const [burstParticles, setBurstParticles] = useState<any[]>([]);

    useEffect(() => {
        // Stages: glitch (text) -> growing (sphere grows) -> pulsing (sphere pulses) -> exploding (boom)
        const toGrowing = setTimeout(() => setStage('growing'), 3000);
        const toPulsing = setTimeout(() => setStage('pulsing'), 3000 + 5000);
        const toExploding = setTimeout(() => setStage('exploding'), 3000 + 5000 + 3000);
        
        return () => {
            clearTimeout(toGrowing);
            clearTimeout(toPulsing);
            clearTimeout(toExploding);
        };
    }, []);
    
    const gameIcons = useMemo(() => ['🍾', '💎', '🗓️', '♀️', '🍳', '🍅', '☠️', '🍆', '🔥', '(8)', '👁️', 'О', 'Р', 'Х', 'Д', 'А'], []);
    
    useEffect(() => {
        if (stage === 'exploding' && burstParticles.length === 0) {
            const particles = Array.from({ length: 50 }).map((_, i) => {
                const angle = (i / 50) * Math.PI * 2;
                const distance = 100; // vmin
                const size = 2.8 + Math.random() * 1.7; // Random size

                return {
                    id: i,
                    icon: gameIcons[i % gameIcons.length],
                    style: {
                        fontSize: `${size}rem`,
                        '--dx': `${Math.cos(angle) * distance}vmin`,
                        '--dy': `${Math.sin(angle) * distance}vmin`,
                        '--rot': `${(Math.random() - 0.5) * 1080}deg`,
                        animation: `burst-fly-out 6s cubic-bezier(0.1, 0.7, 0.3, 1) forwards`,
                        animationDelay: `${Math.random() * 0.2}s`
                    } as React.CSSProperties,
                };
            });
            setBurstParticles(particles);
        }
    }, [stage, gameIcons, burstParticles.length]);


    const sphereBaseClasses = "absolute top-1/2 left-1/2 rounded-full dada-gradient -translate-x-1/2 -translate-y-1/2";
    let sphereDynamicClasses = "w-0 h-0 opacity-0";
    if (stage === 'growing') {
        sphereDynamicClasses = "w-[90vmin] h-[90vmin] opacity-100 transition-all duration-[5000ms] ease-in";
    } else if (stage === 'pulsing') {
        sphereDynamicClasses = "w-[90vmin] h-[90vmin] opacity-100 animate-pulse-slow";
    } else if (stage === 'exploding') {
        sphereDynamicClasses = "w-[90vmin] h-[90vmin] opacity-100 animate-sphere-explode";
    }
    
    const textIsVisible = stage === 'glitch' || stage === 'growing' || stage === 'pulsing';

    return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
            <style>{`
                @keyframes glitch-effect {
                    0% { transform: translate(0, 0); text-shadow: 2px 2px 0 #00ffff, -2px -2px 0 #ff00ff; }
                    20% { transform: translate(-3px, 3px); }
                    40% { transform: translate(3px, -3px); text-shadow: -3px -3px 0 #00ffff, 3px 3px 0 #ff00ff; }
                    60% { transform: translate(-3px, -3px); }
                    80% { transform: translate(3px, 3px); text-shadow: 3px -3px 0 #00ffff, -3px 3px 0 #ff00ff; }
                    100% { transform: translate(0, 0); text-shadow: -3px 3px 0 #00ffff, 3px -3px 0 #ff00ff; }
                }
                .glitch-text {
                    opacity: ${textIsVisible ? 1 : 0};
                    animation: glitch-effect 0.15s infinite;
                    transition: opacity 0.5s;
                }
                .dada-gradient { background: radial-gradient(circle, #ff00ff, #00ffff, #ffff00, #ff00ff); background-size: 200% 200%; animation: gradient-spin 4s linear infinite; }
                @keyframes gradient-spin { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
                @keyframes pulse-slow { 
                    0%, 100% { transform: translate(-50%, -50%) scale(1); } 
                    50% { transform: translate(-50%, -50%) scale(1.05); } 
                }
                .animate-pulse-slow {
                    animation: pulse-slow 1.5s ease-in-out infinite;
                }
                @keyframes sphere-explode {
                    from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    to { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
                }
                .animate-sphere-explode {
                    animation: sphere-explode 1s ease-out forwards;
                }
                @keyframes burst-fly-out {
                    from { transform: translate(0, 0) rotate(0) scale(1); opacity: 1; }
                    to { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0.5); opacity: 0; }
                }
                .particle-container {
                    opacity: ${stage === 'exploding' ? 1 : 0};
                    transition: opacity 0.1s;
                }
            `}</style>
            
            <h2 className="text-6xl md:text-7xl font-bold text-white glitch-text z-20">
                ДАДА-ЭКСТАЗ
            </h2>

            <div className={`${sphereBaseClasses} ${sphereDynamicClasses} z-10`}></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 particle-container z-30">
                {burstParticles.map(p => (
                    <div key={p.id} className="absolute" style={p.style}>
                        {p.icon}
                    </div>
                ))}
            </div>
        </div>
    );
};


export const FinalEnding: React.FC = () => {
    const { confirmLogout } = useProfile();
    const { playSound } = useSettings();
    const [phase, setPhase] = useState(0);
    const [showSkip, setShowSkip] = useState(false);
    
    const handleReset = () => {
        playSound(SoundType.BUTTON_CLICK);
        confirmLogout(); // Используем confirmLogout для возврата к выбору профиля без подтверждения
    };

    const PHASES: { duration: number; component: React.FC, onEnter?: () => void }[] = useMemo(() => [
        { duration: 2000, component: () => <div className="text-5xl animate-ping">ДАДА...</div> },
        { duration: 3000, component: () => <div className="w-full h-full flex flex-wrap gap-4 items-center justify-center overflow-hidden">{ALL_MINIGAMES.map(mg=><p key={mg.id} className="text-xl animate-pulse" style={{animationDelay: `${Math.random()*1}s`}}>{mg.name}</p>)}</div> },
        {
            duration: 17000, // 3s(text) + 5s(growth) + 3s(pulse) + 6s(explosion)
            component: () => <DadaEcstasyAnimation />,
            onEnter: () => playSound(SoundType.DADA_ECSTASY)
        },
        {
            duration: 99999,
            component: () => (
                 <div className="w-full h-full flex flex-col items-center justify-center text-center animate-[fadeIn_3s_ease-in-out]">
                    <div className="my-16 text-6xl">ДАДА КОНЧИЛАСЬ</div>
                    <button onClick={handleReset} className="pixel-button p-4 text-2xl">
                        ВЕРНУТЬСЯ К БИОСУЩЕСТВОВАНИЮ
                    </button>
                </div>
            )
        }
    ], [confirmLogout, playSound, handleReset]);

    useEffect(() => {
        if (phase < PHASES.length - 1) {
            const currentPhase = PHASES[phase];
            if (currentPhase.onEnter) {
                currentPhase.onEnter();
            }
            const timer = setTimeout(() => setPhase(p => p + 1), currentPhase.duration);
            
            const skipTimer = setTimeout(() => setShowSkip(true), 3000);

            const handleSkip = () => {
                if (phase < PHASES.length - 1) {
                    setPhase(PHASES.length - 1);
                }
            };

            window.addEventListener('keydown', handleSkip);

            return () => {
                clearTimeout(timer);
                clearTimeout(skipTimer);
                window.removeEventListener('keydown', handleSkip);
            };
        } else {
            setShowSkip(false);
            const lastPhase = PHASES[PHASES.length - 1];
            if (lastPhase.onEnter) {
                lastPhase.onEnter();
            }
        }
    }, [phase, PHASES]);

    const CurrentPhase = PHASES[phase].component;

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-black">
            <CurrentPhase />
            {showSkip && (
                <div className="absolute bottom-4 right-4 text-sm text-gray-400 animate-pulse z-40">
                    Нажмите любую клавишу, чтобы пропустить...
                </div>
            )}
        </div>
    );
};
