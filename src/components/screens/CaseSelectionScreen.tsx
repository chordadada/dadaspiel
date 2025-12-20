
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useProfile, useSettings, useNavigation } from '../../context/GameContext';
import { SoundType } from '../../utils/AudioEngine';
import { PixelArt } from '../core/PixelArt';
import { CHARACTER_ART_MAP, PIXEL_ART_PALETTE } from '../../../characterArt';
import { DOOR_ART_MAP, STOP_SIGN_ART, BACKGROUND_ASSETS, PLATFORM_ASSETS, BISON_SILHOUETTE, LIBRARY_SILHOUETTE, STORK_SILHOUETTE, TRACTOR_SILHOUETTE, SNOWMAN_ART, XMAS_TREE_DECORATED_ART } from '../../miscArt';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Character, SeasonalEvent } from '../../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { DynamicSky } from '../core/DynamicSky';

// --- Constants & Config ---
const GRAVITY = 0.0015;
const JUMP_FORCE = 0.9;
const MOVE_SPEED = 0.45; 
const MAX_FALL_SPEED = 0.8;

// Level Definition
interface Platform {
    x: number;
    y: number; // Top position from bottom of world
    w: number;
    h: number;
    type: 'standard' | 'art';
    artAsset?: any; // Reference to PLATFORM_ASSETS item
}

interface DoorDef {
    id: string; // Minigame ID (e.g. "1-1")
    caseId: number;
    title: string;
    x: number;
    y: number;
    artId: number; 
    hueRotate: number; 
}

interface BackgroundDecoration {
    id: number;
    x: number;
    y: number;
    scale: number;
    assetIndex: number;
    flip: boolean;
    isSnowman?: boolean;
    isXmasTree?: boolean;
}

// World Settings
const GROUND_LEVEL = 100;
const WORLD_WIDTH = 5000; 

// Custom Palette additions
const EXTENDED_PALETTE = {
    ...PIXEL_ART_PALETTE,
    Y: '#ffd700', // Gold
    R: '#8b0000', // Dark Red
    M: '#4a044e', // Purple/Void
    S: '#777777', // Silver/Pole
    G: '#1a472a', // Green for Tree
    B: '#0077be', // Blue for Tree
};

// --- Unique Badges for Minigames ---
const MINIGAME_BADGES: Record<string, string> = {
    "1-1": "🥂", // Налей Шампанского
    "1-2": "🌈", // Квир-Контроль (Единорог/Радуга)
    "1-3": "🖼️", // Картина 317
    "2-1": "🩰", // Танец (Пуанты)
    "2-2": "💋", // Поцелуй Добра (Moved from 5-2)
    "3-1": "📽️", // Проход к кино
    "3-2": "🍂", // 3 Сентября (Лист)
    "4-1": "🅰️", // Феминитив (Буква)
    "4-2": "🦷", // Бойцовский клуб (Зуб)
    "5-1": "🚑", // Не подавись (Скорая)
    "5-2": "🍬", // Дада-комплимент (Конфета) (Moved from 2-3)
    "6-1": "🍏", // Фруктовый спор
    "6-2": "🌀", // Засос пылесоса
    "6-3": "🥔", // Шутер (Драник/Картошка)
};

// --- Seasonal Data & Logic ---
type Season = 'winter' | 'spring' | 'summer' | 'autumn';

const getSeason = (): Season => {
    const month = new Date().getMonth(); // 0-11
    if (month === 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'autumn';
};

const SEASON_THEMES = {
    winter: {
        groundColor: '#cbd5e1', // Snow (Slate-300)
        groundBorder: '#94a3b8', // Darker snow border
        roadColor: '#94a3b8', // Icy road
        grassColor: '#f8fafc', // White snow piles
        floraColors: ['#f1f5f9', '#e2e8f0', '#cbd5e1'], // White/Grey trees
        decorOpacity: 0.8
    },
    spring: {
        groundColor: '#3f2e26', // Wet Earth
        groundBorder: '#000',
        roadColor: '#525252', // Asphalt
        grassColor: '#4ade80', // Fresh Green
        floraColors: ['#86efac', '#4ade80', '#22c55e'], // Vibrant light greens
        decorOpacity: 0.8
    },
    summer: {
        groundColor: '#2d2d2d', // Dark Earth
        groundBorder: '#000',
        roadColor: '#4b5563', // Grey Asphalt
        grassColor: '#2d5a27', // Deep Green
        floraColors: ['#1a472a', '#2d5a27', '#3a5a40'], // Dark greens
        decorOpacity: 0.6
    },
    autumn: {
        groundColor: '#271c19', // Very dark brown
        groundBorder: '#000',
        roadColor: '#44403c', // Brownish grey
        grassColor: '#d97706', // Amber/Orange leaves
        floraColors: ['#ea580c', '#ca8a04', '#b45309'], // Orange/Yellow/Brown
        decorOpacity: 0.8
    }
};

// --- Random Number Generator ---
const cyrb128 = (str: string) => {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
};

const sfc32 = (a: number, b: number, c: number, d: number) => {
    return () => {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
        let t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
};

export const CaseSelectionScreen: React.FC = () => {
  const { character } = useSession();
  const { activeProfile, dynamicCases, profiles } = useProfile();
  const { playSound, seasonalEvent, seasonalAnimationsEnabled, debugMode } = useSettings();
  const { jumpToMinigame } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // FIX: Destructure the object returned by useIsMobile
  const { isMobile } = useIsMobile();

  // --- State ---
  const [player, setPlayer] = useState({ x: 100, y: GROUND_LEVEL, vx: 0, vy: 0, grounded: true, facingRight: true });
  const [activeDoorId, setActiveDoorId] = useState<string | null>(null);
  const [season] = useState<Season>(() => getSeason());
  
  // Refs
  const activeDoorIdRef = useRef<string | null>(null);
  const playerRef = useRef(player);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  useEffect(() => { activeDoorIdRef.current = activeDoorId; }, [activeDoorId]);
  useEffect(() => { playerRef.current = player; }, [player]);

  const currentTheme = SEASON_THEMES[season];
  const isNewYear = seasonalAnimationsEnabled && seasonalEvent === SeasonalEvent.NEW_YEAR;

  // --- World Generation ---
  const { allDoors, platforms, decorations, stopSignX } = useMemo(() => {
      const seedStr = activeProfile ? activeProfile.id : 'default';
      const seed = cyrb128(seedStr);
      const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

      const doors: DoorDef[] = [];
      const plats: Platform[] = [];
      const decos: BackgroundDecoration[] = [];
      
      for (let x = 0; x < WORLD_WIDTH; x += 50 + rand() * 150) {
          const assetIndex = Math.floor(rand() * BACKGROUND_ASSETS.length);
          const scale = 0.8 + rand() * 1.5;
          const y = GROUND_LEVEL + (rand() * 20); 
          
          let isSnowman = false;
          let isXmasTree = false;

          // Replace some assets with seasonal ones during New Year
          if (isNewYear) {
              const seasonalRand = rand();
              if (seasonalRand < 0.1) isSnowman = true;
              else if (seasonalRand < 0.2) isXmasTree = true;
          }

          decos.push({
              id: x,
              x: x,
              y: y,
              scale: isSnowman || isXmasTree ? 2.0 : scale,
              assetIndex: assetIndex,
              flip: rand() > 0.5,
              isSnowman,
              isXmasTree
          });
      }

      let currentX = 300;
      let calculatedStopSignX = WORLD_WIDTH - 200; 
      let foundStop = false;

      dynamicCases.forEach((c) => {
          c.minigames.forEach((mg, index) => {
              if (mg.id === '3-2') {
                  doors.push({
                      id: mg.id,
                      caseId: c.id,
                      title: mg.name,
                      x: 2200, 
                      y: 350, 
                      artId: 6,
                      hueRotate: 0
                  });
                  return;
              }

              const isElevated = index % 2 !== 0; 
              const y = isElevated ? 220 : GROUND_LEVEL;
              
              doors.push({
                  id: mg.id,
                  caseId: c.id,
                  title: mg.name,
                  x: currentX,
                  y: y,
                  artId: c.id, 
                  hueRotate: 0
              });

              if (isElevated) {
                  plats.push({ x: currentX - 60, y: y, w: 120, h: 20, type: 'standard' });
              }

              if (rand() > 0.3) {
                  const midX = currentX + 150; 
                  const midY = 150 + rand() * 50; 
                  const artIdx = Math.floor(rand() * PLATFORM_ASSETS.length);
                  plats.push({
                      x: midX,
                      y: midY,
                      w: 60, 
                      h: 20,
                      type: 'art',
                      artAsset: PLATFORM_ASSETS[artIdx]
                  });
              }

              currentX += 300; 
          });
          
          if (activeProfile && !foundStop) {
              const progress = activeProfile.progress[c.id] || 0;
              if (progress < c.minigames.length) {
                  calculatedStopSignX = currentX - 50; 
                  foundStop = true;
              }
          }

          currentX += 150; 
      });

      // Special Bonus Door (Dada Audio Player)
      // Unlock condition: Either Debug Mode is ON, OR at least one profile has beaten the game.
      // Moved to the START (x=150)
      const anyGameCompleted = profiles.some(p => p.gameCompleted) || debugMode;
      
      if (anyGameCompleted) {
          // Add platform for it
          plats.push({ x: 150, y: 180, w: 100, h: 20, type: 'standard' });
          doors.push({
              id: 'bonus-player',
              caseId: 999, // Pseudo ID
              title: "DADA PLAYER",
              x: 150,
              y: 180,
              artId: 99, // Special Art
              hueRotate: 0
          });
      }
      
      return { allDoors: doors, platforms: plats, decorations: decos, stopSignX: calculatedStopSignX };
  }, [dynamicCases, activeProfile, isNewYear, profiles, debugMode]);

  // --- Initial Player Position ---
  useEffect(() => {
      // Logic to place player near next unlocked door, unless default spawn
      // If returning from Bonus Player, logic should handle it naturally by proximity
      if (allDoors.length > 0 && activeProfile) {
          let targetDoorX = 250; // Default near start
          let foundTarget = false;

          for (const door of allDoors) {
              if (door.id === '3-2' || door.id === 'bonus-player') continue; 
              
              const parentCase = dynamicCases.find(c => c.minigames.some(m => m.id === door.id));
              if (parentCase) {
                  const idx = parentCase.minigames.findIndex(m => m.id === door.id);
                  const progress = activeProfile.progress[parentCase.id] || 0;
                  
                  if (progress === idx) {
                      targetDoorX = door.x;
                      foundTarget = true;
                      break;
                  }
              }
          }
          
          if (!foundTarget) {
              const lastDoor = [...allDoors].reverse().find(d => d.id !== '3-2' && d.id !== 'bonus-player');
              if (lastDoor) targetDoorX = lastDoor.x;
          }

          // Use requestAnimationFrame to ensure ref updates don't clash
          requestAnimationFrame(() => {
             setPlayer(p => ({ ...p, x: Math.max(100, targetDoorX - 100) }));
          });
      }
  }, []); // Run ONCE on mount

  // --- Helpers ---
  const isMinigameUnlocked = (targetId: string) => {
      if (targetId === 'bonus-player') return true; // Already checked in generation logic
      if (!activeProfile) return false;
      const allMinigamesList = dynamicCases.flatMap(c => c.minigames);
      const targetIndex = allMinigamesList.findIndex(m => m.id === targetId);
      if (targetIndex === 0) return true; 
      if (targetIndex === -1) return false; 
      const prevGame = allMinigamesList[targetIndex - 1];
      const prevGameCase = dynamicCases.find(c => c.minigames.some(m => m.id === prevGame.id));
      if (!prevGameCase) return false;
      const prevGameIndexInCase = prevGameCase.minigames.findIndex(m => m.id === prevGame.id);
      const progressInThatCase = activeProfile.progress[prevGameCase.id] || 0;
      return progressInThatCase > prevGameIndexInCase;
  };

  const isMinigameCompleted = (targetId: string) => {
      if (targetId === 'bonus-player') return false; // Infinite
      if (!activeProfile) return false;
      const parentCase = dynamicCases.find(c => c.minigames.some(m => m.id === targetId));
      if (!parentCase) return false;
      const indexInCase = parentCase.minigames.findIndex(m => m.id === targetId);
      const progress = activeProfile.progress[parentCase.id] || 0;
      return progress > indexInCase;
  }

  // --- Actions ---
  const handleInteract = useCallback(() => {
      if (activeDoorIdRef.current !== null) {
          playSound(SoundType.BUTTON_CLICK);
          jumpToMinigame(activeDoorIdRef.current);
      }
  }, [playSound, jumpToMinigame]);

  const handleJump = useCallback(() => {
      setPlayer(p => {
          if (p.grounded) {
              playSound(SoundType.SWOOSH);
              return { ...p, vy: JUMP_FORCE, grounded: false };
          }
          return p;
      });
  }, [playSound]);

  // --- Input Handlers ---
  useEffect(() => {
      const handleKD = (e: KeyboardEvent) => {
          keysPressed.current[e.code] = true;
          if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW')) handleJump();
          if (e.code === 'Enter') handleInteract();
      };
      const handleKU = (e: KeyboardEvent) => keysPressed.current[e.code] = false;
      
      window.addEventListener('keydown', handleKD);
      window.addEventListener('keyup', handleKU);
      return () => {
          window.removeEventListener('keydown', handleKD);
          window.removeEventListener('keyup', handleKU);
      };
  }, [handleInteract, handleJump]);

  const handleTouchStart = (key: string, e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault(); 
      keysPressed.current[key] = true;
      if (key === 'ArrowUp') handleJump();
  };
  const handleTouchEnd = (key: string, e: React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      keysPressed.current[key] = false;
  };

  // --- Physics Loop ---
  useGameLoop(useCallback((deltaTime) => {
      const left = keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'];
      const right = keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'];
      
      let dx = 0;
      if (left) dx = -1;
      if (right) dx = 1;

      setPlayer(p => {
          let newX = p.x + dx * MOVE_SPEED * deltaTime;
          let newVy = p.vy - GRAVITY * deltaTime; 
          let newY = p.y + newVy * deltaTime;
          let newGrounded = false;

          newX = Math.max(50, Math.min(newX, stopSignX - 30)); 

          if (newY <= GROUND_LEVEL) {
              newY = GROUND_LEVEL;
              newVy = 0;
              newGrounded = true;
          }

          if (newVy <= 0) {
              for (const plat of platforms) {
                  const hitLeft = plat.type === 'art' ? plat.x - plat.w/2 : plat.x;
                  const hitRight = plat.type === 'art' ? plat.x + plat.w/2 : plat.x + plat.w;

                  if (newX >= hitLeft - 10 && newX <= hitRight + 10) {
                      if (p.y >= plat.y && newY <= plat.y) {
                          newY = plat.y;
                          newVy = 0;
                          newGrounded = true;
                      }
                  }
              }
          }

          if (newVy < -MAX_FALL_SPEED) newVy = -MAX_FALL_SPEED;

          return {
              x: newX, y: newY, vx: dx, vy: newVy,
              grounded: newGrounded,
              facingRight: dx !== 0 ? dx > 0 : p.facingRight
          };
      });

      let foundDoor = null;
      for (const door of allDoors) {
          const p = playerRef.current;
          const isWormhole = door.id === '3-2';
          const distX = Math.abs(p.x - door.x);
          const distY = Math.abs(p.y - door.y);
          
          if (isWormhole) {
              if (distX < 40 && distY < 60) {
                  if (seasonalEvent === SeasonalEvent.SEPTEMBER_3 || isMinigameUnlocked(door.id)) {
                      foundDoor = door.id;
                  }
              }
          } else {
              if (distX < 50 && p.y >= door.y - 10 && p.y <= door.y + 100) {
                  if (isMinigameUnlocked(door.id)) {
                      foundDoor = door.id;
                  }
              }
          }
      }
      setActiveDoorId(foundDoor);

  }, [platforms, allDoors, seasonalEvent, stopSignX]), true);

  // --- Rendering ---
  const charArt = CHARACTER_ART_MAP[character || Character.KANILA];
  const screenWidth = containerRef.current ? containerRef.current.clientWidth : 800;
  const cameraX = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, player.x - screenWidth / 2));

  const landmarks = [
      { id: 1, x: 200, y: 120, art: BISON_SILHOUETTE, scale: 6, opacity: 0.3 },
      { id: 2, x: 1500, y: 100, art: LIBRARY_SILHOUETTE, scale: 8, opacity: 0.2 },
      { id: 3, x: 3000, y: 200, art: STORK_SILHOUETTE, scale: 5, opacity: 0.4 },
      { id: 4, x: 4500, y: 120, art: TRACTOR_SILHOUETTE, scale: 7, opacity: 0.3 },
  ];

  return (
    <div className="w-full h-full relative overflow-hidden font-mono" ref={containerRef}>
        
        <DynamicSky />

        <div 
            className="absolute top-0 left-0 h-full transition-transform duration-75 ease-linear will-change-transform z-10"
            style={{ 
                width: `${WORLD_WIDTH}px`,
                transform: `translateX(${-cameraX}px)` 
            }}
        >
            {/* 1. Background Layer: Procedural Decorations */}
            {decorations.map(deco => {
                const asset = BACKGROUND_ASSETS[deco.assetIndex];
                let overrideColor = asset.color;
                
                if ([0, 1, 3].includes(deco.assetIndex)) {
                    const colorIndex = deco.id % currentTheme.floraColors.length;
                    overrideColor = currentTheme.floraColors[colorIndex];
                }

                // Render special New Year assets
                if (deco.isSnowman) {
                    return (
                        <div key={`sn-${deco.id}`} className="absolute z-0 pointer-events-none" style={{ left: deco.x, bottom: deco.y, transform: `scale(${deco.scale}) scaleX(${deco.flip ? -1 : 1})` }}>
                            <PixelArt artData={SNOWMAN_ART} palette={EXTENDED_PALETTE} pixelSize={4} />
                        </div>
                    );
                }
                if (deco.isXmasTree) {
                    return (
                        <div key={`xt-${deco.id}`} className="absolute z-0 pointer-events-none" style={{ left: deco.x, bottom: deco.y, transform: `scale(${deco.scale})` }}>
                            <PixelArt artData={XMAS_TREE_DECORATED_ART} palette={EXTENDED_PALETTE} pixelSize={4} />
                        </div>
                    );
                }

                return (
                    <div 
                        key={deco.id}
                        className="absolute pointer-events-none"
                        style={{
                            left: deco.x,
                            bottom: deco.y,
                            width: '100px',
                            height: '100px',
                            transform: `scale(${deco.scale}) scaleX(${deco.flip ? -1 : 1})`,
                            opacity: currentTheme.decorOpacity,
                            zIndex: 0
                        }}
                    >
                        <svg viewBox={asset.viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
                            <path d={asset.path} fill={overrideColor} stroke={asset.stroke} strokeWidth={asset.strokeWidth || 0} />
                        </svg>
                    </div>
                );
            })}

            {/* 2. Background Layer: Distant Landmarks (Parallax) */}
            {landmarks.map(lm => (
                <div key={lm.id} className="absolute pointer-events-none z-0" style={{ left: `${lm.x}px`, bottom: `${lm.y}px`, opacity: lm.opacity, transform: `scale(${lm.scale}) translateX(${(cameraX * 0.3) / lm.scale}px)` }}>
                    <PixelArt artData={lm.art} palette={{'b': '#000000'}} pixelSize={1} />
                </div>
            ))}

            {/* 3. Mid Layer: Platforms */}
            {platforms.map((plat, i) => {
                if (plat.type === 'art' && plat.artAsset) {
                    const asset = plat.artAsset;
                    return (
                        <div 
                            key={`plat-${i}`}
                            className="absolute flex items-center justify-center font-bold"
                            style={{
                                left: plat.x,
                                bottom: plat.y - plat.h,
                                width: plat.w,
                                height: plat.h * 3, 
                                transform: 'translateX(-50%)', 
                                zIndex: 5,
                                fontSize: '2rem',
                                color: asset.color
                            }}
                        >
                            {asset.type === 'letter' || asset.type === 'emoji' ? (
                                <div className="filter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">
                                    {asset.content}
                                </div>
                            ) : null}
                        </div>
                    );
                } else {
                    return (
                        <div key={`plat-${i}`} className="absolute border-t-4 z-5" 
                             style={{ 
                                 left: plat.x, 
                                 bottom: plat.y - plat.h, 
                                 width: plat.w, 
                                 height: plat.h,
                                 backgroundColor: currentTheme.groundColor,
                                 borderColor: currentTheme.groundBorder
                             }}>
                            <div className="w-full h-full opacity-30" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)'}}></div>
                        </div>
                    );
                }
            })}

            {/* 4. Ground Layer (Seasonal) */}
            <div 
                className="absolute left-0 w-full border-t-4 z-5" 
                style={{ 
                    height: GROUND_LEVEL, 
                    bottom: 0,
                    backgroundColor: currentTheme.groundColor,
                    borderColor: currentTheme.groundBorder
                }}
            >
                 <div className="w-full h-4 border-b-2 border-dashed mt-2" style={{ borderColor: currentTheme.roadColor }}></div>
                 <div 
                    className="absolute -top-4 w-full h-4 bg-repeat-x opacity-70" 
                    style={{
                        backgroundImage: `linear-gradient(to right, transparent 50%, ${currentTheme.grassColor} 50%)`, 
                        backgroundSize: '20px 10px'
                    }}
                ></div>
                {/* Visual Snowdrifts for New Year */}
                {isNewYear && (
                    <div className="absolute -top-10 left-0 w-full h-10 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle at 50% 100%, white 0%, transparent 70%)',
                        backgroundSize: '200px 100%',
                        opacity: 0.8
                    }}></div>
                )}
            </div>

            {/* 5. Doors Layer */}
            {allDoors.map((door) => {
                const unlocked = isMinigameUnlocked(door.id);
                const completed = isMinigameCompleted(door.id);
                const isActive = activeDoorId === door.id;
                const badge = MINIGAME_BADGES[door.id] || "✅";
                
                // Special Bonus Door Rendering
                if (door.id === 'bonus-player') {
                    return (
                        <div 
                            key={door.id}
                            className="absolute flex flex-col items-center z-20 cursor-pointer"
                            style={{ left: door.x, bottom: door.y, transform: 'translateX(-50%)' }}
                            onClick={(e) => { if(isActive) { e.stopPropagation(); handleInteract(); } }}
                        >
                            <div className={`mb-2 px-2 py-1 text-center bg-black/80 border rounded text-xs whitespace-nowrap transition-all duration-200 ${isActive ? 'border-pink-500 text-pink-400 scale-125' : 'border-gray-600 text-gray-500'}`}>
                                {door.title}
                            </div>
                            {/* Giant Cassette or Ear */}
                            <div className={`w-24 h-16 bg-zinc-800 border-4 border-zinc-600 rounded flex items-center justify-center relative transition-all duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]' : 'scale-100'}`}>
                                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white border-4 border-black animate-[spin_4s_linear_infinite]"></div>
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border-4 border-black animate-[spin_4s_linear_infinite]"></div>
                                <div className="w-12 h-4 bg-black/50"></div>
                            </div>
                        </div>
                    );
                }

                if (door.id === '3-2') {
                    const shouldShow = seasonalEvent === SeasonalEvent.SEPTEMBER_3 || unlocked;
                    if (!shouldShow) return null; 

                    return (
                        <div 
                            key={door.id}
                            className="absolute flex flex-col items-center z-20"
                            style={{ left: door.x, bottom: door.y, transform: 'translateX(-50%)' }}
                            onClick={(e) => { if(isActive) { e.stopPropagation(); handleInteract(); } }}
                        >
                            <style>{`
                                @keyframes wormhole-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
                                @keyframes wormhole-pulse { 0%, 100% { opacity: 0.6; filter: hue-rotate(0deg); } 50% { opacity: 1; filter: hue-rotate(45deg); } }
                            `}</style>
                            <div className={`mb-2 px-2 py-1 text-center bg-black/80 border rounded text-xs whitespace-nowrap transition-all duration-200 ${isActive ? 'border-orange-500 text-orange-400 scale-125' : 'border-gray-600 text-gray-500'}`}>
                                {door.title}
                            </div>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${isActive ? 'scale-125' : 'scale-100'}`} style={{ background: 'radial-gradient(circle, #000 20%, #ff4500 60%, #ff8c00 100%)', animation: 'wormhole-spin 3s linear infinite, wormhole-pulse 1s ease-in-out infinite', boxShadow: isActive ? '0 0 20px #ff4500' : '0 0 10px #ff8c00' }}>
                                <div className="text-2xl animate-pulse">🔥</div>
                            </div>
                            {completed && <div className="absolute text-orange-400 text-2xl font-bold -bottom-6 animate-bounce drop-shadow-md">{badge}</div>}
                        </div>
                    )
                }

                const artData = DOOR_ART_MAP[door.artId as keyof typeof DOOR_ART_MAP] || DOOR_ART_MAP[1];
                
                return (
                    <div 
                        key={door.id} 
                        className="absolute flex flex-col items-center z-10"
                        style={{ left: door.x, bottom: door.y, transform: 'translateX(-50%)' }}
                        onClick={(e) => { if(isActive && unlocked) { e.stopPropagation(); handleInteract(); } }}
                    >   
                        <div className={`mb-4 px-3 py-1 text-center bg-black/80 border-2 rounded text-white whitespace-nowrap cursor-pointer transition-all duration-200 ${isActive && unlocked ? 'border-yellow-400 text-yellow-300 animate-bounce scale-110' : 'border-gray-600 text-gray-400'}`} style={{ opacity: unlocked ? 1 : 0.5, fontSize: '14px' }}>
                            {door.title}
                        </div>
                        <div className={`relative transition-all duration-300 ${isActive ? 'scale-105' : 'scale-100'} ${!unlocked ? 'opacity-50 grayscale' : ''}`} style={{ filter: unlocked ? `hue-rotate(${door.hueRotate}deg)` : 'none' }}>
                            <PixelArt artData={artData} palette={EXTENDED_PALETTE} pixelSize={6} />
                            {completed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <span className="text-4xl filter drop-shadow-md animate-pulse">{badge}</span>
                                </div>
                            )}
                            {!unlocked && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">🔒</div>}
                        </div>
                    </div>
                );
            })}

            <div className="absolute z-10" style={{ left: stopSignX, bottom: GROUND_LEVEL }}>
                <PixelArt artData={STOP_SIGN_ART} palette={EXTENDED_PALETTE} pixelSize={6} />
            </div>

            {/* 6. Player Layer */}
            <div className="absolute z-20 transition-transform duration-75" style={{ left: player.x, bottom: player.y - 20, transform: `translateX(-50%) scaleX(${player.facingRight ? 1 : -1})` }}>
                {charArt && <PixelArt artData={charArt} palette={PIXEL_ART_PALETTE} pixelSize={4} />}
            </div>
        </div>

        {isMobile && (
            <div className="absolute bottom-4 left-0 w-full flex justify-between px-6 pointer-events-none z-50 select-none touch-none">
                <div className="relative w-48 h-32 pointer-events-auto opacity-70">
                    <div className="absolute bottom-0 left-0 flex gap-4 items-end">
                        <button className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-lg flex items-center justify-center active:bg-white/30 backdrop-blur-sm shadow-lg" onTouchStart={(e) => handleTouchStart('ArrowLeft', e)} onTouchEnd={(e) => handleTouchEnd('ArrowLeft', e)}><svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
                        <button className="w-20 h-20 bg-blue-500/30 border-2 border-blue-300/50 rounded-lg flex items-center justify-center active:bg-blue-500/50 backdrop-blur-sm shadow-lg" onTouchStart={(e) => handleTouchStart('ArrowUp', e)} onTouchEnd={(e) => handleTouchEnd('ArrowUp', e)}><svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg></button>
                        <button className="w-20 h-20 bg-white/10 border-2 border-white/50 rounded-lg flex items-center justify-center active:bg-white/30 backdrop-blur-sm shadow-lg" onTouchStart={(e) => handleTouchStart('ArrowRight', e)} onTouchEnd={(e) => handleTouchEnd('ArrowRight', e)}><svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></button>
                    </div>
                </div>
                <div className="flex items-end pointer-events-auto">
                    {activeDoorId !== null && (
                        <button className="w-24 h-24 bg-yellow-500 border-4 border-black rounded-full flex items-center justify-center animate-pulse shadow-lg active:scale-95 transition-transform" onTouchStart={(e) => { if (e.cancelable) e.preventDefault(); handleInteract(); }} onClick={(e) => { e.preventDefault(); handleInteract(); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 17.6 72.1 46.55" width="72" height="46"><path fill="#1e1e1e" d="M32.6 17.75L32.6 46.4L37.15 46.4L37.15 64.15L28.4 64.15L28.4 53.45L8.8 53.45L8.8 64.15L0 64.15L0 46.4L2.75 46.4Q4.35 43.6 5.6 40.45Q6.85 37.3 7.8 33.75Q8.75 30.2 9.35 26.2Q9.95 22.2 10.25 17.75L32.6 17.75M17.5 24.8Q17.25 27.4 16.8 30.15Q16.35 32.9 15.7 35.7Q15.05 38.5 14.2 41.2Q13.35 43.9 12.3 46.4L23.5 46.4L23.5 24.8L17.5 24.8ZM62.2 53.45L60.55 45.8L49.65 45.8L47.95 53.45L38 53.45L48.95 17.6L61 17.6L72.1 53.45L62.2 53.45M56.8 31.5Q56.55 30.4 56.23 29.07Q55.9 27.75 55.6 26.32Q55.3 24.9 55.05 23.55Q54.75 25.65 54.28 27.75Q53.8 29.85 53.4 31.5L51.5 38.7L58.7 38.7L56.8 31.5Z"/></svg>
                        </button>
                    )}
                </div>
            </div>
        )}
        
        {!isMobile && <div className="absolute bottom-4 w-full text-center text-white/30 text-sm pointer-events-none z-50">[←][→] Move &nbsp;&nbsp; [SPACE/UP] Jump &nbsp;&nbsp; [ENTER] Enter</div>}
    </div>
  );
};
