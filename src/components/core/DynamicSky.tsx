
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useSession } from '../../context/GameContext';
import { Character } from '../../../types';

// --- Types & Constants ---

// 12 minutes in milliseconds
const CYCLE_DURATION = 12 * 60 * 1000; 

interface SkyColor {
    time: number; // 0.0 to 1.0 (0 = midnight, 0.5 = noon)
    top: number[]; // [r, g, b]
    bottom: number[]; // [r, g, b]
}

// Color Palette for the Day Cycle
const SKY_PALETTE: SkyColor[] = [
    { time: 0.00, top: [10, 10, 30], bottom: [20, 20, 50] },       // Night (Midnight)
    { time: 0.20, top: [40, 30, 60], bottom: [150, 80, 50] },      // Pre-Dawn
    { time: 0.25, top: [100, 149, 237], bottom: [255, 160, 122] }, // Dawn (Sunrise)
    { time: 0.30, top: [135, 206, 235], bottom: [200, 240, 255] }, // Morning
    { time: 0.50, top: [30, 144, 255], bottom: [135, 206, 250] },  // Noon
    { time: 0.70, top: [100, 149, 237], bottom: [255, 215, 0] },   // Late Afternoon
    { time: 0.75, top: [72, 61, 139], bottom: [255, 69, 0] },      // Sunset
    { time: 0.80, top: [25, 25, 112], bottom: [75, 0, 130] },      // Dusk
    { time: 1.00, top: [10, 10, 30], bottom: [20, 20, 50] },       // Night (Loop)
];

// Helper to interpolate colors
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const lerpColor = (c1: number[], c2: number[], t: number) => [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
];

// --- Sub-components ---

const Star: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute bg-white rounded-full transition-opacity duration-1000" style={style}></div>
);

// Cloud component now accepts position directly via style, no CSS animation here
const Cloud: React.FC<{ style: React.CSSProperties, brightness: number }> = ({ style, brightness }) => (
    <div 
        className="absolute rounded-full bg-white transition-colors duration-1000" 
        style={{
            ...style,
            opacity: 0.4 + (1 - brightness) * 0.3, 
            filter: `brightness(${brightness}) blur(5px)`,
            boxShadow: '0 0 20px 5px rgba(255,255,255,0.4)'
        }}
    ></div>
);

const CelestialBody: React.FC<{ type: 'sun' | 'moon', progress: number }> = ({ type, progress }) => {
    // We only render the moon. The sun is "invisible" (behind screen/clouds) but its light cycle remains.
    if (type === 'sun') return null;

    let rotation = 0;
    let isVisible = false;

    // Moon Logic
    let moonProgress = 0;
    if (progress > 0.7) {
        isVisible = true;
        moonProgress = (progress - 0.7) / 0.6; 
    } else if (progress < 0.3) {
        isVisible = true;
        moonProgress = (progress + 0.3) / 0.6; 
    }
    rotation = -110 + moonProgress * 220;

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
    };

    return (
        <div style={bodyStyle}>
            <div 
                className="absolute top-[15%] left-[50%] -translate-x-1/2 rounded-full shadow-lg transition-all duration-1000"
                style={{
                    width: '60px',
                    height: '60px',
                    background: '#F4F6F0',
                    boxShadow: '0 0 30px #FFFFFF',
                }}
            >
                {/* Craters */}
                <div className="absolute top-[20%] left-[30%] w-[20%] h-[20%] bg-gray-300 rounded-full opacity-50"></div>
                <div className="absolute top-[60%] left-[50%] w-[15%] h-[15%] bg-gray-300 rounded-full opacity-50"></div>
            </div>
        </div>
    );
};

export const DynamicSky: React.FC<{ showHorizon?: boolean }> = ({ showHorizon = true }) => {
    const { character } = useSession();
    
    // Global Time State
    const [cycleProgress, setCycleProgress] = useState(0.3);
    const cycleRef = useRef(0.3);
    
    // Weather & Wind
    const [weather, setWeather] = useState(0.2); 
    const weatherTarget = useRef(0.2);
    const windSpeed = useRef(0.02); // Start with gentle rightward breeze
    const windTarget = useRef(0.02);

    // Cloud Data (Mutable Refs for performance in game loop)
    const cloudsRef = useRef(Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        // Start spread out, but within visible range initially + buffers
        x: Math.random() * 140 - 20, 
        y: Math.random() * 60,
        width: 80 + Math.random() * 150,
        height: 40 + Math.random() * 60,
        speedFactor: 0.5 + Math.random() * 1.0, // Individual variance
    })));
    
    const [renderClouds, setRenderClouds] = useState(cloudsRef.current);

    // Stars
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
        // CAP DELTA TIME: prevent huge jumps on first frame or tab switch
        const dt = Math.min(rawDt, 50); 

        // 1. Update Time
        const dtProgress = dt / CYCLE_DURATION;
        cycleRef.current = (cycleRef.current + dtProgress) % 1;
        setCycleProgress(cycleRef.current);

        // 2. Update Weather (Random walk)
        if (Math.random() < 0.005) weatherTarget.current = Math.random();
        setWeather(w => w + (weatherTarget.current - w) * 0.005);

        // 3. Update Wind (Smooth random walk)
        if (Math.random() < 0.005) {
            windTarget.current = (Math.random() - 0.5) * 0.3;
        }
        windSpeed.current += (windTarget.current - windSpeed.current) * 0.005;

        // 4. Update Clouds
        const dtSec = dt / 1000;
        cloudsRef.current.forEach(c => {
            // Move based on wind
            c.x += windSpeed.current * c.speedFactor * dtSec * 60; 
            
            // Wrap around smoothly with LARGE buffer.
            // Using -50% and +110% ensures even wide clouds are fully off-screen before warping.
            // If moving right (speed > 0): Wait until x > 110 (off right), warp to -50 (far left).
            // If moving left (speed < 0): Wait until x < -50 (off left), warp to 110 (far right).
            
            if (c.x > 110) c.x = -50;
            if (c.x < -50) c.x = 110;
        });
        
        // Trigger render
        setRenderClouds([...cloudsRef.current]);

    }, []), true);

    // Calculate Global Colors
    const { topColor, bottomColor, brightness, starOpacity, themeFilter, overlayColor } = useMemo(() => {
        const t = cycleProgress;
        
        let startColor = SKY_PALETTE[0];
        let endColor = SKY_PALETTE[0];
        
        for (let i = 0; i < SKY_PALETTE.length - 1; i++) {
            if (t >= SKY_PALETTE[i].time && t < SKY_PALETTE[i+1].time) {
                startColor = SKY_PALETTE[i];
                endColor = SKY_PALETTE[i+1];
                break;
            }
        }

        const segmentDuration = endColor.time - startColor.time;
        const localT = (t - startColor.time) / segmentDuration;

        let rgbTop = lerpColor(startColor.top, endColor.top, localT);
        let rgbBottom = lerpColor(startColor.bottom, endColor.bottom, localT);

        // Weather Effect (Graying out)
        const grayFactor = weather * 0.8;
        const toGray = (rgb: number[]) => {
            const avg = (rgb[0] + rgb[1] + rgb[2]) / 3;
            return [
                lerp(rgb[0], avg, grayFactor) * (1 - weather * 0.4),
                lerp(rgb[1], avg, grayFactor) * (1 - weather * 0.4),
                lerp(rgb[2], avg, grayFactor) * (1 - weather * 0.4)
            ];
        };

        rgbTop = toGray(rgbTop);
        rgbBottom = toGray(rgbBottom);

        // Character Themes
        let filter = '';
        let overlay = 'transparent';

        if (character === Character.SEXISM) {
            // Expressionism: High saturation, contrast, warm shift
            filter = 'contrast(1.2) saturate(1.8) hue-rotate(-10deg)';
            // Add a subtle colored overlay to tints shadows
            overlay = 'rgba(255, 100, 0, 0.1)'; 
        } else if (character === Character.BLACK_PLAYER) {
            // Void/Glitch: Desaturated, High Contrast, Dark
            filter = 'grayscale(100%) contrast(1.5) brightness(0.7)';
            overlay = 'rgba(20, 0, 0, 0.4)'; // Dark red tint
        }

        // Star visibility
        let baseStarVis = 0;
        if (t > 0.8 || t < 0.2) baseStarVis = 1;
        else if (t > 0.7 && t <= 0.8) baseStarVis = (t - 0.7) * 10;
        else if (t >= 0.2 && t < 0.3) baseStarVis = 1 - (t - 0.2) * 10;
        
        const starOp = Math.max(0, baseStarVis * (1 - weather));

        return {
            topColor: `rgb(${rgbTop.join(',')})`,
            bottomColor: `rgb(${rgbBottom.join(',')})`,
            brightness: 1 - (weather * 0.5),
            starOpacity: starOp,
            themeFilter: filter,
            overlayColor: overlay
        };
    }, [cycleProgress, weather, character]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Main Sky Container with Character Filter applied */}
            <div 
                className="absolute inset-0 transition-all duration-1000"
                style={{ 
                    // Gradient uses calculated bottomColor. 
                    // We don't flatten it for showHorizon=false, we just don't render the haze div.
                    background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
                    filter: themeFilter
                }}
            >
                {/* Stars */}
                <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: starOpacity }}>
                    {stars.map(s => <Star key={s.id} style={s.style} />)}
                </div>

                {/* Celestial Bodies - Sun is now invisible (removed), Moon remains */}
                <CelestialBody type="sun" progress={cycleProgress} />
                <CelestialBody type="moon" progress={cycleProgress} />

                {/* Clouds */}
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
                        <Cloud style={{width: '100%', height: '100%'}} brightness={brightness} />
                    </div>
                ))}

                {/* Horizon Haze - Only shown if requested */}
                {showHorizon && (
                    <div 
                        className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
                        style={{ opacity: 0.5 + weather * 0.5 }}
                    ></div>
                )}
            </div>

            {/* Tint Overlay for Character Theme (sits on top of everything) */}
            <div className="absolute inset-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: overlayColor }}></div>
        </div>
    );
};
