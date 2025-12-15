import React, { useState } from 'react';
import { useSession, useSettings } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';

// Компонент для отображения модального окна с видео.
const VideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const getEmbedUrl = (videoUrl: string): string => {
        if (videoUrl.includes("youtube.com/watch?v=")) {
            return videoUrl.replace("watch?v=", "embed/") + "?autoplay=1&rel=0";
        }
        if (videoUrl.includes("vkvideo.ru/video-")) {
            const parts = videoUrl.split('video-')[1]?.split('_');
            if (parts && parts.length === 2) {
                const oid = `-${parts[0]}`;
                const id = parts[1];
                return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=1`;
            }
        }
        return videoUrl;
    };
    const embedUrl = getEmbedUrl(url);

    return (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center animate-[fadeIn_0.3s]" onClick={onClose}>
            <div className="relative w-11/12 max-w-4xl aspect-video bg-black pixel-border" onClick={(e) => e.stopPropagation()}>
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
                <button onClick={onClose} className="absolute -top-4 -right-4 pixel-button bg-red-600 text-2xl w-12 h-12 flex items-center justify-center z-10" aria-label="Закрыть видео">X</button>
            </div>
        </div>
    );
};


export const GlitchWinScreen: React.FC = () => {
    const { proceedAfterGlitchWin, glitchWinVideoUrl } = useSession();
    const { playSound } = useSettings();
    const [showVideo, setShowVideo] = useState(false);

    const handleContinue = () => {
        playSound(SoundType.BUTTON_CLICK);
        proceedAfterGlitchWin();
    };

    const handlePlayVideo = () => {
        playSound(SoundType.BUTTON_CLICK);
        setShowVideo(true);
    };

    return (
        <>
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center overflow-hidden">
                <style>{`
                    @keyframes glitch-text-anim {
                        0% { transform: translate(0, 0); text-shadow: 2px 2px 0 #00ffff, -2px -2px 0 #ff00ff; }
                        20% { transform: translate(-3px, 3px); }
                        40% { transform: translate(3px, -3px); text-shadow: -3px -3px 0 #00ffff, 3px 3px 0 #ff00ff; }
                        60% { transform: translate(-3px, -3px); }
                        80% { transform: translate(3px, 3px); text-shadow: 3px -3px 0 #00ffff, -3px 3px 0 #ff00ff; }
                        100% { transform: translate(0, 0); text-shadow: -3px 3px 0 #00ffff, 3px -3px 0 #ff00ff; }
                    }
                    .glitch-win-text {
                        animation: glitch-text-anim 0.1s infinite;
                    }
                    @keyframes scanlines {
                        from { background-position: 0 0; }
                        to { background-position: 0 100%; }
                    }
                    .scanlines-overlay {
                        position: absolute;
                        inset: 0;
                        background-image: linear-gradient(to bottom, rgba(0,0,0,0.5) 50%, transparent 50%);
                        background-size: 100% 4px;
                        animation: scanlines 0.2s linear infinite;
                        pointer-events: none;
                    }
                    @keyframes text-fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
                <div className="scanlines-overlay"></div>
                <h2 className="text-5xl md:text-6xl font-bold text-white glitch-win-text">
                    АНАРХИЧЕСКИЙ СБОЙ!
                </h2>
                <p className="text-xl md:text-2xl text-gray-300 mt-4" style={{ animation: 'text-fade-in 1s 0.5s ease-out forwards', opacity: 0 }}>
                    Поражение превращается в победу.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4" style={{ animation: 'text-fade-in 1s 1.5s ease-out forwards', opacity: 0 }}>
                    {glitchWinVideoUrl && (
                        <button onClick={handlePlayVideo} className="pixel-button p-3 text-xl bg-purple-700 hover:bg-purple-800">
                            Утраченный Фрагмент
                        </button>
                    )}
                    <button onClick={handleContinue} className="pixel-button p-3 text-xl bg-gray-600 hover:bg-gray-700">
                        БЛАГОДАРСТВУЮ
                    </button>
                </div>
            </div>
             {showVideo && glitchWinVideoUrl && (
                <VideoModal url={glitchWinVideoUrl} onClose={() => setShowVideo(false)} />
            )}
        </>
    );
};