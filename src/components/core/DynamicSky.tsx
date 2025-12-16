
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useSession } from '../../context/GameContext';
import { Character } from '../../../types';

// --- Types & Constants ---

const GAME_DAY_DURATION = 720; // 12 minutes per game day

type Season = 'winter' | 'spring' | 'summer' | 'autumn';

interface SkyColor {
    time: number;
    top: number[];
    bottom: number[];
}

interface SeasonConfig {
    palette: SkyColor[];
    // Тип осадков теперь определяет, ЧТО падает, а не КОГДА
    precipType: 'snow' | 'rain' | 'pollen' | 'leaves' | 'none'; 
}

// --- Seasonal Data ---

const getSeason = (): Season => {
    const month = new Date().getMonth(); // 0-11
    if (month === 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'autumn';
};

const SEASON_CONFIGS: Record<Season, SeasonConfig> = {
    winter: {
        precipType: 'snow',
        palette: [
            { time: 0.00, top: [5, 5, 20], bottom: [10, 10, 40] },         // Deep Night
            { time: 0.30, top: [20, 20, 50], bottom: [100, 100, 130] },    // Late Sunrise (Short Day)
            { time: 0.35, top: [180, 190, 210], bottom: [220, 230, 255] }, // Pale Morning
            { time: 0.50, top: [100, 149, 237], bottom: [200, 220, 255] }, // Cold Noon
            { time: 0.65, top: [100, 100, 180], bottom: [200, 150, 150] }, // Early Sunset
            { time: 0.70, top: [40, 30, 80], bottom: [100, 50, 100] },     // Purple Dusk
            { time: 1.00, top: [5, 5, 20], bottom: [10, 10, 40] },         // Night Loop
        ]
    },
    spring: {
        precipType: 'rain',
        palette: [
            { time: 0.00, top: [10, 10, 30], bottom: [20, 30, 50] },
            { time: 0.25, top: [100, 149, 237], bottom: [255, 200, 180] }, // Pinkish Sunrise
            { time: 0.30, top: [135, 206, 235], bottom: [200, 255, 240] }, // Fresh Morning
            { time: 0.50, top: [70, 180, 255], bottom: [180, 240, 255] },  // Bright Noon
            { time: 0.75, top: [70, 100, 180], bottom: [255, 180, 100] },  // Soft Sunset
            { time: 0.80, top: [30, 30, 100], bottom: [80, 50, 120] },
            { time: 1.00, top: [10, 10, 30], bottom: [20, 30, 50] },
        ]
    },
    summer: {
        precipType: 'pollen',
        palette: [
            { time: 0.00, top: [0, 0, 20], bottom: [10, 10, 30] },
            { time: 0.20, top: [50, 50, 150], bottom: [255, 100, 50] },    // Early, Intense Sunrise
            { time: 0.30, top: [0, 150, 255], bottom: [255, 255, 200] },   // Hot Morning
            { time: 0.50, top: [0, 100, 255], bottom: [100, 200, 255] },   // Deep Blue Noon
            { time: 0.80, top: [100, 50, 150], bottom: [255, 50, 0] },     // Late, Red Sunset
            { time: 0.85, top: [50, 0, 100], bottom: [100, 0, 50] },       // Hot Night
            { time: 1.00, top: [0, 0, 20], bottom: [10, 10, 30] },
        ]
    },
    autumn: {
        precipType: 'leaves',
        palette: [
            { time: 0.00, top: [10, 5, 5], bottom: [30, 10, 10] },         // Dark Warm Night
            { time: 0.25, top: [50, 30, 50], bottom: [150, 50, 20] },      // Gloomy Sunrise
            { time: 0.35, top: [100, 120, 150], bottom: [200, 180, 150] }, // Greyish Day
            { time: 0.50, top: [100, 130, 160], bottom: [220, 200, 180] }, // Pale Noon
            { time: 0.70, top: [80, 40, 100], bottom: [255, 60, 0] },      // Golden/Red Sunset
            { time: 0.75, top: [40, 20, 60], bottom: [100, 20, 0] },       // Dramatic Dusk
            { time: 1.00, top: [10, 5, 5], bottom: [30, 10, 10] },
        ]
    }
};

// Helper to interpolate colors
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const lerpColor = (c1: number[], c2: number[], t: number) => [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
];

const getInitialLocalProgress = () => {
    const now = new Date();
    const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return totalSeconds / 86400;
};

// --- Components ---

const Rainbow: React.FC<{ opacity: number }> = ({ opacity }) => (
    <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-[2000ms]" 
        style={{ opacity }}
    >
        <div 
            className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-t-full"
            style={{ 
                background: "radial-gradient(circle at bottom, transparent 50%, rgba(148, 0, 211, 0.4) 55%, rgba(75, 0, 130, 0.4) 60%, rgba(0, 0, 255, 0.4) 65%, rgba(0, 255, 0, 0.4) 70%, rgba(255, 255, 0, 0.4) 75%, rgba(255, 127, 0, 0.4) 80%, rgba(255, 0, 0, 0.4) 85%, transparent 90%)",
                filter: "blur(8px)"
            }}
        >
        </div>
    </div>
);

const Precipitation: React.FC<{ type: SeasonConfig['precipType'], intensity: number, brightness: number }> = React.memo(({ type, intensity, brightness }) => {
    if (type === 'none' || intensity <= 0) return null;

    // Use a fixed seed for consistent rendering
    const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 2 + Math.random() * 3;
        const size = Math.random();
        return { id: i, left, delay, duration, size };
    }), []);

    let char = '';
    let color = 'white';
    let animationName = '';
    let extraStyle = {};

    switch (type) {
        case 'snow':
            char = '•';
            color = 'white';
            animationName = 'fall-snow';
            break;
        case 'rain':
            char = '│';
            color = '#aaddff';
            animationName = 'fall-rain';
            break;
        case 'pollen':
            char = '•';
            color = '#ffeb3b';
            animationName = 'float-pollen';
            break;
        case 'leaves':
            char = '🍂';
            color = '#d35400';
            animationName = 'fall-leaf';
            break;
    }

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 transition-opacity duration-1000" style={{ opacity: intensity * 0.8 }}>
            <style>{`
                @keyframes fall-snow { from { transform: translateY(-10vh); } to { transform: translateY(110vh); } }
                @keyframes fall-rain { from { transform: translateY(-10vh); } to { transform: translateY(110vh); } }
                @keyframes float-pollen { 
                    0% { transform: translateY(110vh) translateX(0); opacity: 0; } 
                    50% { opacity: 0.8; }
                    100% { transform: translateY(-10vh) translateX(20px); opacity: 0; } 
                }
                @keyframes fall-leaf { 
                    0% { transform: translateY(-10vh) rotate(0deg) translateX(0); } 
                    50% { transform: translateY(50vh) rotate(180deg) translateX(20px); } 
                    100% { transform: translateY(110vh) rotate(360deg) translateX(0); } 
                }
            `}</style>
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.left}%`,
                        top: -20,
                        color: color,
                        fontSize: type === 'leaves' ? `${10 + p.size * 10}px` : `${8 + p.size * 10}px`,
                        animation: `${animationName} ${p.duration}s linear infinite`,
                        animationDelay: `-${p.delay}s`,
                        opacity: type === 'rain' ? 0.6 : 0.9,
                        filter: type === 'pollen' ? 'blur(1px)' : 'none',
                        ...extraStyle
                    }}
                >
                    {char}
                </div>
            ))}
        </div>
    );
});

const Star: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute bg-white rounded-full transition-opacity duration-1000" style={style}></div>
);

const Cloud: React.FC<{ style: React.CSSProperties, brightness: number, opacity: number }> = ({ style, brightness, opacity }) => (
    <div 
        className="absolute rounded-full bg-white transition-all duration-1000" 
        style={{
            ...style,
            opacity: opacity * (0.4 + (1 - brightness) * 0.3), // Opacity linked to cloud density AND brightness
            filter: `brightness(${brightness}) blur(5px)`,
            boxShadow: '0 0 20px 5px rgba(255,255,255,0.4)'
        }}
    ></div>
);

// Added stormIntensity to dim the sun/moon when overcast
const CelestialBody: React.FC<{ type: 'sun' | 'moon', progress: number, stormIntensity: number }> = ({ type, progress, stormIntensity }) => {
    let rotation = 0;
    let isVisible = false;

    // Sun Logic
    if (type === 'sun') {
        if (progress > 0.2 && progress < 0.8) {
            isVisible = true;
            const sunProgress = (progress - 0.2) / 0.6; 
            rotation = -110 + sunProgress * 220;
        }
    } 
    // Moon Logic
    else {
        let moonProgress = 0;
        if (progress > 0.7) {
            isVisible = true;
            moonProgress = (progress - 0.7) / 0.6; 
        } else if (progress < 0.3) {
            isVisible = true;
            moonProgress = (progress + 0.3) / 0.6; 
        }
        rotation = -110 + moonProgress * 220;
    }

    if (!isVisible) return null;

    const bodyStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '-20%', 
        left: '50%',
        width: '100%',
        height: '100%',
        transformOrigin: '50% 120%', 
        transform: `translateX(-50%) rotate(${rotation}deg)`,
        pointerEvents: 'none',
        zIndex: 1, 
        // Fade out celestial bodies when storm intensity is high (heavy overcast)
        opacity: Math.max(0, 1 - stormIntensity * 0.8),
        transition: 'opacity 1s ease-in-out'
    };

    return (
        <div style={bodyStyle}>
            {type === 'sun' ? (
                <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_40px_rgba(253,224,71,0.8)]"></div>
            ) : (
                <div 
                    className="absolute top-[15%] left-[50%] -translate-x-1/2 rounded-full shadow-lg transition-all duration-1000"
                    style={{
                        width: '60px',
                        height: '60px',
                        background: '#F4F6F0',
                        boxShadow: '0 0 30px #FFFFFF',
                    }}
                >
                    <div className="absolute top-[20%] left-[30%] w-[20%] h-[20%] bg-gray-300 rounded-full opacity-50"></div>
                    <div className="absolute top-[60%] left-[50%] w-[15%] h-[15%] bg-gray-300 rounded-full opacity-50"></div>
                </div>
            )}
        </div>
    );
};

export const DynamicSky: React.FC<{ showHorizon?: boolean }> = ({ showHorizon = true }) => {
    const { character } = useSession();
    
    // Season State
    const [currentSeason] = useState<Season>(() => getSeason());
    const seasonConfig = SEASON_CONFIGS[currentSeason];

    // Time State
    const [cycleProgress, setCycleProgress] = useState(() => getInitialLocalProgress());
    
    // Weather State
    const [cloudDensity, setCloudDensity] = useState(0.3); // 0.0 = clear, 1.0 = overcast
    const [isPrecipitating, setIsPrecipitating] = useState(false);
    const [rainbowOpacity, setRainbowOpacity] = useState(0);
    const [stormIntensity, setStormIntensity] = useState(0.0); // How "gray" the sky is

    // Logic Refs
    const targetCloudDensity = useRef(0.3);
    const windSpeed = useRef(0.02);
    const windTarget = useRef(0.02);

    const cloudsRef = useRef(Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: Math.random() * 140 - 20, 
        y: Math.random() * 60,
        width: 80 + Math.random() * 150,
        height: 40 + Math.random() * 60,
        speedFactor: 0.5 + Math.random() * 1.0,
    })));
    
    const [renderClouds, setRenderClouds] = useState(cloudsRef.current);

    const stars = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        style: {
            top: `${Math.random() * 70}%`,
            left: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: Math.random(),
        }
    })), []);

    // Animation Loop
    useGameLoop(useCallback((rawDt) => {
        const dt = Math.min(rawDt, 50); 
        const dtSec = dt / 1000;

        // 1. Advance Time
        const progressIncrement = dtSec / GAME_DAY_DURATION;
        setCycleProgress(prev => (prev + progressIncrement) % 1.0);

        // 2. Update Cloud Density (Random Walk)
        if (Math.random() < 0.005) {
            targetCloudDensity.current = Math.random();
        }
        setCloudDensity(c => c + (targetCloudDensity.current - c) * 0.005);

        // 3. Precipitation Logic
        if (isPrecipitating) {
            // Stop conditions: Not enough clouds
            if (cloudDensity < 0.25) {
                setIsPrecipitating(false);
                
                // RAINBOW TRIGGER: Rain stopped, daytime, spring/summer
                const isDay = cycleProgress > 0.2 && cycleProgress < 0.8;
                const canRainbow = currentSeason === 'spring' || currentSeason === 'summer';
                if (isDay && canRainbow && Math.random() < 0.8) {
                    setRainbowOpacity(1.0);
                }
            }
        } else {
            // Start conditions: Chance increases with cloud density
            // At 0.2 density, chance is 0. At 1.0 density, chance is high.
            if (cloudDensity > 0.3) {
                const chance = (cloudDensity - 0.3) * 0.001;
                if (Math.random() < chance) {
                    setIsPrecipitating(true);
                }
            }
        }

        // 4. Update Storm Intensity (Grayness)
        // If precipitating, storm intensity goes up quickly. Else follows cloud density loosely.
        const targetStorm = isPrecipitating ? 0.7 + (cloudDensity * 0.3) : cloudDensity * 0.3;
        setStormIntensity(s => s + (targetStorm - s) * 0.01);

        // 5. Update Rainbow (Fade out)
        setRainbowOpacity(op => Math.max(0, op - 0.0005));

        // 6. Update Wind
        if (Math.random() < 0.005) {
            windTarget.current = (Math.random() - 0.5) * 0.3;
        }
        windSpeed.current += (windTarget.current - windSpeed.current) * 0.005;

        // 7. Update Clouds Position
        cloudsRef.current.forEach(c => {
            c.x += windSpeed.current * c.speedFactor * dtSec * 60; 
            if (c.x > 110) c.x = -50;
            if (c.x < -50) c.x = 110;
        });
        setRenderClouds([...cloudsRef.current]);

    }, [currentSeason, isPrecipitating, cloudDensity, cycleProgress]), true);

    // Calculate Global Colors
    const { topColor, bottomColor, brightness, starOpacity, themeFilter, overlayColor } = useMemo(() => {
        const t = cycleProgress;
        const palette = seasonConfig.palette;
        
        let startColor = palette[0];
        let endColor = palette[0];
        
        for (let i = 0; i < palette.length - 1; i++) {
            if (t >= palette[i].time && t < palette[i+1].time) {
                startColor = palette[i];
                endColor = palette[i+1];
                break;
            }
        }

        const segmentDuration = endColor.time - startColor.time;
        const localT = (t - startColor.time) / segmentDuration;

        let rgbTop = lerpColor(startColor.top, endColor.top, localT);
        let rgbBottom = lerpColor(startColor.bottom, endColor.bottom, localT);

        // Storm/Weather Effect (Graying out)
        const grayFactor = stormIntensity;
        const toGray = (rgb: number[]) => {
            const avg = (rgb[0] + rgb[1] + rgb[2]) / 3;
            return [
                lerp(rgb[0], avg, grayFactor) * (1 - stormIntensity * 0.3),
                lerp(rgb[1], avg, grayFactor) * (1 - stormIntensity * 0.3),
                lerp(rgb[2], avg, grayFactor) * (1 - stormIntensity * 0.3)
            ];
        };

        rgbTop = toGray(rgbTop);
        rgbBottom = toGray(rgbBottom);

        // Character Themes
        let filter = '';
        let overlay = 'transparent';

        if (character === Character.SEXISM) {
            filter = 'contrast(1.2) saturate(1.8) hue-rotate(-10deg)';
            overlay = 'rgba(255, 100, 0, 0.1)'; 
        } else if (character === Character.BLACK_PLAYER) {
            filter = 'grayscale(100%) contrast(1.5) brightness(0.7)';
            overlay = 'rgba(20, 0, 0, 0.4)'; 
        }

        // Star visibility
        let baseStarVis = 0;
        if (t > 0.8 || t < 0.2) baseStarVis = 1;
        else if (t > 0.7 && t <= 0.8) baseStarVis = (t - 0.7) * 10;
        else if (t >= 0.2 && t < 0.3) baseStarVis = 1 - (t - 0.2) * 10;
        
        // Stars are hidden by clouds/storm
        const starOp = Math.max(0, baseStarVis * (1 - cloudDensity * 0.8));

        return {
            topColor: `rgb(${rgbTop.join(',')})`,
            bottomColor: `rgb(${rgbBottom.join(',')})`,
            brightness: 1 - (stormIntensity * 0.5),
            starOpacity: starOp,
            themeFilter: filter,
            overlayColor: overlay
        };
    }, [cycleProgress, stormIntensity, cloudDensity, character, seasonConfig]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Main Sky Container */}
            <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{ 
                    background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
                    filter: themeFilter
                }}
            >
                {/* Stars */}
                <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: starOpacity }}>
                    {stars.map(s => <Star key={s.id} style={s.style} />)}
                </div>

                {/* Celestial Bodies */}
                <CelestialBody type="sun" progress={cycleProgress} stormIntensity={stormIntensity} />
                <CelestialBody type="moon" progress={cycleProgress} stormIntensity={stormIntensity} />

                {/* Rainbow - Behind clouds, front of sky */}
                <Rainbow opacity={rainbowOpacity} />

                {/* Clouds - Opacity controlled by cloudDensity */}
                {renderClouds.map(c => (
                    <div 
                        key={c.id} 
                        className="absolute"
                        style={{
                            left: `${c.x}%`,
                            top: `${c.y}%`,
                            width: `${c.width}px`,
                            height: `${c.height}px`,
                        }}
                    >
                        <Cloud style={{width: '100%', height: '100%'}} brightness={brightness} opacity={cloudDensity} />
                    </div>
                ))}
                
                {/* Precipitation */}
                <Precipitation type={seasonConfig.precipType} brightness={brightness} intensity={isPrecipitating ? 1 : 0} />

                {/* Horizon Haze */}
                {showHorizon && (
                    <div 
                        className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
                        style={{ opacity: 0.5 + stormIntensity * 0.5 }}
                    ></div>
                )}
            </div>

            {/* Tint Overlay */}
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: overlayColor }}></div>
        </div>
    );
};
