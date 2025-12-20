
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, useSettings, useNavigation } from '../../context/GameContext';
import { useGameLoop } from '../../hooks/useGameLoop';
import { SoundType, MusicType, startMusic, stopMusic } from '../../utils/AudioEngine';
import { MinigameHUD } from '../core/MinigameHUD';
import { Character } from '../../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { DynamicSky } from '../core/DynamicSky';

// --- Constants & Types ---
const INTERNAL_HEIGHT = 200; // Fixed vertical resolution for pixelated look
const MAP_SIZE = 24; 
const MAX_DEPTH = 24;
const MAX_UNDADA = 100;

// Emoji Pools
const PRISTAVUCHIY_VARIANTS = ['🧌', '🧟‍♀️', '🧟', '🧟‍♂️'];
const VISITOR_VARIANTS = ['🧐', '🤔', '🙄', '🥸', '😐', '🤨', '🤠'];

// Weapon Definitions
type WeaponType = 'spoon' | 'fork' | 'knife' | 'ladle';

interface WeaponStats {
    name: string;
    symbol: string;
    damage: number;
    cooldown: number; // ms
    spread: number; // radians
    recoil: number;
    color: string;
    sound: SoundType;
}

const WEAPONS: Record<WeaponType, WeaponStats> = {
    spoon: { name: "ЛОЖЬКА", symbol: '🥄', damage: 15, cooldown: 300, spread: 0.05, recoil: 1.0, color: '#cd7f32', sound: SoundType.SHOOT_SPOON },
    fork:  { name: "ВИЛК", symbol: '🔧', damage: 8,  cooldown: 120, spread: 0.15, recoil: 0.4, color: '#c0c0c0', sound: SoundType.SHOOT_FORK },
    knife: { name: "СИЗОР",   symbol: '🔪', damage: 45, cooldown: 700, spread: 0.01, recoil: 2.5, color: '#e6e6e6', sound: SoundType.SHOOT_KNIFE },
    ladle: { name: "СЧЁТЫ", symbol: '🧮', damage: 100, cooldown: 1100, spread: 0.0, recoil: 4.0, color: '#ffd700', sound: SoundType.SHOOT_LADLE },
};

// Artifact types (Food + Weapons)
type ItemType = 'sour_cream' | 'machanka' | 'shkvarki' | 'heavy_thoughts' | 'chronos_soup' | 'inverted_gaze' | 'blind_faith' | 'weapon_fork' | 'weapon_knife' | 'weapon_ladle';

interface Entity {
    id: number;
    type: 'dranik' | 'koldun' | 'boss' | 'kanila_boss' | 'sexism_boss' | 'visitor' | 'pristavuchiy' | ItemType;
    x: number;
    y: number;
    active: boolean;
    hp: number;
    state: 'idle' | 'chase' | 'attack' | 'pain' | 'invisible';
    stateTimer: number;
    visualVariant?: string; // Stores the specific emoji chosen at spawn
}

interface Player {
    x: number;
    y: number;
    dir: number; 
    planeX: number; 
    planeY: number; 
    hp: number;
    maxHp: number;
    damageMult: number;
    speedMult: number;
    currentWeapon: WeaponType;
}

interface GameNotification {
    id: number;
    text: string;
    life: number;
    color: string;
}

const DranikiShooterWinScreen: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
    return (
        <div className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center animate-[fadeIn_2s] z-50">
            <h1 className="text-4xl md:text-6xl text-yellow-500 font-bold mb-4 font-mono text-center">ПОБЕДА</h1>
            <p className="text-lg md:text-2xl text-white mb-8 text-center px-4">ДРАНИКИ ПОВЕРЖЕНЫ. АД ОЧИЩЕН.</p>
            <button onClick={onContinue} className="pixel-button p-4 text-2xl bg-gray-800 hover:bg-gray-700 animate-pulse">
                ПРИНЯТЬ ЭКСТАЗ
            </button>
        </div>
    );
}

export const DranikiShooter: React.FC<{ onWin: () => void; onLose: () => void }> = ({ onWin, onLose }) => {
    const { playSound, sensitivity, setSensitivityTutorial, sensitivityTutorial } = useSettings();
    const { isInstructionModalVisible } = useNavigation();
    const { character } = useSession();
    // FIX: Destructure the object returned by useIsMobile
    const { isMobile } = useIsMobile();
    
    // --- Random Motivational Start Message ---
    const startMessage = useMemo(() => {
        const msgs = [
            "ГОТОВЬ ТЁРКУ!",
            "ПЕРЕТРИ В КРАХМАЛ!",
            "СВЯТОЙ КЛУБЕНЬ!",
            "ЖАРЬ ИХ ВСЕХ!",
            "БУЛЬБА ЗОВЁТ!",
            "СМЕРТЬ КАРТОШКЕ!",
            "ВРЕМЯ ТЕРЕТЬ!",
            "ВКЛЮЧАЙ ПЛИТУ!"
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }, []);

    // --- Refs for Game Loop ---
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapRef = useRef<number[][]>(Array(MAP_SIZE).fill(0).map(() => Array(MAP_SIZE).fill(0)));
    const secretPaintingLoc = useRef<{x: number, y: number} | null>(null);
    const hasUsed317Heal = useRef(false);
    
    const playerRef = useRef<Player>({ 
        x: MAP_SIZE / 2, y: MAP_SIZE / 2, 
        dir: 0, 
        planeX: 0, planeY: 0.66, 
        hp: 100, maxHp: 100, damageMult: 1, speedMult: 1,
        currentWeapon: 'spoon'
    });
    
    const entitiesRef = useRef<Entity[]>([]);
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const lastShotTime = useRef(0);
    const hasGameStarted = useRef(false); 
    const footstepTimer = useRef(0);
    
    // Wave Logic Refs
    const currentRound = useRef(0); 
    const waveDelayTimer = useRef(0); 
    const isWaveActive = useRef(false); 
    const undadastandingRef = useRef(0); 

    const bossPhase = useRef(false);
    const hasFinished = useRef(false);
    const flashScreen = useRef(0); 
    const blindFold = useRef(0); 
    const weaponBob = useRef(0);
    const weaponRecoil = useRef(0);
    const timeScale = useRef(1.0);
    const controlsInverted = useRef(false);
    const controlsInvertedTimer = useRef(0);

    // --- State for React UI ---
    const [hudState, setHudState] = useState({ hp: 100, round: 0, bossHp: 0, weaponFrame: 0, message: "", undada: 0, weaponName: "", weaponSymbol: "" });
    const [status, setStatus] = useState<'initializing' | 'waiting' | 'playing' | 'won' | 'lost' | 'canceled'>('initializing');
    const [notifications, setNotifications] = useState<GameNotification[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 320, height: INTERNAL_HEIGHT });
    const notifIdCounter = useRef(0);

    // --- Sensitivity Tutorial Logic ---
    useEffect(() => {
        const hasSeenHint = localStorage.getItem('dada_shooter_sensitivity_hint');
        if (!hasSeenHint) {
            setSensitivityTutorial(true);
        }
        
        return () => {
            // Cleanup on unmount
            setSensitivityTutorial(false);
        };
    }, []);

    // When standard instructions are closed, finish the sensitivity tutorial
    useEffect(() => {
        if (!isInstructionModalVisible && sensitivityTutorial) {
            setSensitivityTutorial(false);
            localStorage.setItem('dada_shooter_sensitivity_hint', 'true');
        }
    }, [isInstructionModalVisible, sensitivityTutorial]);

    // --- Dynamic Resolution ---
    useEffect(() => {
        if (!wrapperRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            if (wrapperRef.current) {
                const { clientWidth, clientHeight } = wrapperRef.current;
                // Calculate width to maintain square pixels based on container aspect ratio
                // ratio = width / height. Internal Height = 200. Internal Width = 200 * ratio.
                const ratio = clientWidth / clientHeight;
                const newWidth = Math.floor(INTERNAL_HEIGHT * ratio);
                // Ensure even width for cleaner raycasting loops
                const evenWidth = newWidth % 2 === 0 ? newWidth : newWidth + 1;
                setCanvasSize({ width: evenWidth, height: INTERNAL_HEIGHT });
            }
        });
        resizeObserver.observe(wrapperRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // --- Helpers ---
    const isWall = (x: number, y: number) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        if (ix < 0 || ix >= MAP_SIZE || iy < 0 || iy >= MAP_SIZE) return true;
        return mapRef.current[ix][iy] > 0;
    };

    const addNotification = (text: string, color: string = 'text-white') => {
        const id = notifIdCounter.current++;
        setNotifications(prev => [...prev, { id, text, life: 3, color }]);
    };

    // Centralized Item Pickup Logic
    const handleItemPickup = (item: Entity, player: Player) => {
        if (!item.active) return;
        
        item.active = false;
        switch(item.type as ItemType) {
            case 'sour_cream': player.hp = Math.min(player.maxHp, player.hp + 20); addNotification("СМЕТАНА: ЛЕЧЕНИЕ", "text-green-400"); playSound(SoundType.PICKUP_FOOD); break;
            case 'machanka': player.hp = Math.min(player.maxHp, player.hp + 50); addNotification("МАЧАНКА: СЫТОСТЬ", "text-green-400"); playSound(SoundType.PICKUP_FOOD); break;
            case 'shkvarki': player.damageMult = 2; setTimeout(() => player.damageMult = 1, 5000); addNotification("ШКВАРКИ: ЯРОСТЬ", "text-red-500"); playSound(SoundType.PICKUP_FOOD); break;
            case 'heavy_thoughts': player.speedMult = 0.5; setTimeout(() => player.speedMult = character === Character.KANILA ? 1.3 : (character === Character.SEXISM ? 0.8 : 1), 5000); addNotification("ТЯЖЕСТЬ БЫТИЯ...", "text-purple-400"); playSound(SoundType.PICKUP_BAD); break;
            case 'chronos_soup': timeScale.current = 0.3; addNotification("ВРЕМЯ КАК КИСЕЛЬ", "text-blue-400"); playSound(SoundType.TRANSFORM_SUCCESS); break;
            case 'inverted_gaze': controlsInverted.current = true; controlsInvertedTimer.current = 5; addNotification("ЛОГИКА ВЫШЛА ИЗ ЧАТА", "text-yellow-400"); playSound(SoundType.SWOOSH); break;
            case 'blind_faith': blindFold.current = 1.0; player.hp = Math.min(player.maxHp, player.hp + 999); addNotification("СЛЕПАЯ ВЕРА", "text-white"); playSound(SoundType.ART_REVEAL); break;
            
            // Weapons
            case 'weapon_fork': player.currentWeapon = 'fork'; addNotification("ПОДОБРАНА: ВИЛКА", "text-gray-300"); playSound(SoundType.PICKUP_WEAPON); break;
            case 'weapon_knife': player.currentWeapon = 'knife'; addNotification("ПОДОБРАН: НОЖ", "text-gray-300"); playSound(SoundType.PICKUP_WEAPON); break;
            case 'weapon_ladle': player.currentWeapon = 'ladle'; addNotification("ПОДОБРАН: ПОЛОВНИК", "text-yellow-400"); playSound(SoundType.PICKUP_WEAPON); break;
        }
    };

    // Loot Drop Logic
    const trySpawnLoot = (x: number, y: number, isPlayerMoving: boolean) => {
        // Base probability
        const baseChance = 0.35;
        if (Math.random() > baseChance) return;

        let itemType: ItemType = 'sour_cream'; // Default fallback
        const rand = Math.random();

        // Calculate Weapon Spawn Probability
        // Increases with rounds and difficulty (Black Player > Sexism > Kanila)
        let weaponChance = 0.1 + (currentRound.current * 0.05); 
        if (character === Character.BLACK_PLAYER) weaponChance += 0.15;
        else if (character === Character.SEXISM) weaponChance += 0.08;
        
        // Roll for weapon vs food
        if (rand < weaponChance) {
            // Weapon Tier Rolling
            const tierRoll = Math.random();
            if (currentRound.current >= 3 && tierRoll < 0.2) itemType = 'weapon_ladle'; // Epic
            else if (currentRound.current >= 2 && tierRoll < 0.5) itemType = 'weapon_knife'; // Rare
            else itemType = 'weapon_fork'; // Common weapon
        } else {
            // Food/Powerup Drop - Weighted Logic based on HP and Movement
            const hpPercent = playerRef.current.hp / playerRef.current.maxHp;
            
            // Base weights
            let sourCreamWeight = 1.0;
            let machankaWeight = 0.5;
            let shkvarkiWeight = 1.0;
            let heavyThoughtsWeight = 1.0;
            let chronosWeight = 0.8;
            let invertedWeight = 0.8;
            let blindFaithWeight = 0.3;

            // If player is moving and wounded, drastically increase healing drop rate
            if (isPlayerMoving && hpPercent < 0.6) {
                const desperationFactor = (0.6 - hpPercent) * 10; // 0 to 6 boost
                sourCreamWeight += desperationFactor;
                machankaWeight += desperationFactor * 0.6;
            }

            const dropTable: {id: ItemType, weight: number}[] = [
                { id: 'sour_cream', weight: sourCreamWeight },
                { id: 'machanka', weight: machankaWeight },
                { id: 'shkvarki', weight: shkvarkiWeight },
                { id: 'heavy_thoughts', weight: heavyThoughtsWeight },
                { id: 'chronos_soup', weight: chronosWeight },
                { id: 'inverted_gaze', weight: invertedWeight },
                { id: 'blind_faith', weight: blindFaithWeight },
            ];

            let totalWeight = 0;
            for (const item of dropTable) totalWeight += item.weight;

            let randomWeight = Math.random() * totalWeight;
            for (const item of dropTable) {
                randomWeight -= item.weight;
                if (randomWeight <= 0) {
                    itemType = item.id;
                    break;
                }
            }
        }

        entitiesRef.current.push({
            id: Math.random(),
            type: itemType,
            x: x, y: y, active: true, hp: 1, state: 'idle', stateTimer: 0
        });
    };

    const spawnWave = (round: number) => {
        const size = MAP_SIZE;
        const newEnts: Entity[] = [];
        
        let enemyCount = 0;
        let koldunChance = 0;
        let visitorCount = 0;

        if (round === 1) {
            enemyCount = 4;
            visitorCount = 3;
            koldunChance = 0.0; 
        } else if (round === 2) {
            enemyCount = 7;
            visitorCount = 5;
            koldunChance = 0.3;
        } else if (round === 3) {
            enemyCount = 10;
            visitorCount = 6;
            koldunChance = 0.5;
        }

        if (character === Character.BLACK_PLAYER) {
            enemyCount = Math.floor(enemyCount * 1.5);
            koldunChance += 0.2;
        }

        playSound(SoundType.BOSS_ROAR); 
        addNotification(`ВОЛНА ${round} НАЧАЛАСЬ`, "text-red-500");
        isWaveActive.current = true; 

        // Spawn Enemies
        for(let i=0; i<enemyCount; i++) {
            let ex, ey;
            let attempts = 0;
            do {
                ex = 2 + Math.random() * (size - 4);
                ey = 2 + Math.random() * (size - 4);
                attempts++;
            } while (
                (isWall(ex, ey) || Math.sqrt((playerRef.current.x - ex)**2 + (playerRef.current.y - ey)**2) < 8) 
                && attempts < 100
            );

            if (attempts < 100) {
                newEnts.push({
                    id: Date.now() + i, 
                    type: Math.random() < koldunChance ? 'koldun' : 'dranik',
                    x: ex, y: ey,
                    active: true, hp: Math.random() < koldunChance ? 60 : 30, 
                    state: 'idle', stateTimer: 0
                });
            }
        }

        // Spawn Visitors
        for(let i=0; i<visitorCount; i++) {
            let vx, vy;
            let attempts = 0;
            do {
                vx = 2 + Math.random() * (size - 4);
                vy = 2 + Math.random() * (size - 4);
                attempts++;
            } while ((isWall(vx, vy) || Math.sqrt((playerRef.current.x - vx)**2 + (playerRef.current.y - vy)**2) < 5) && attempts < 100);
            
            if (attempts < 100) {
                const isPristavuchiy = Math.random() < 0.3; 
                // Select specific emoji variant
                const variants = isPristavuchiy ? PRISTAVUCHIY_VARIANTS : VISITOR_VARIANTS;
                const chosenEmoji = variants[Math.floor(Math.random() * variants.length)];

                newEnts.push({
                    id: Date.now() + 1000 + i,
                    type: isPristavuchiy ? 'pristavuchiy' : 'visitor',
                    x: vx, y: vy,
                    active: true, hp: 10, 
                    state: 'idle', stateTimer: Math.random() * 5,
                    visualVariant: chosenEmoji
                });
            }
        }

        entitiesRef.current = [...entitiesRef.current, ...newEnts];
    };

    // --- Init ---
    useEffect(() => {
        const size = MAP_SIZE;
        const newMap = mapRef.current;
        for(let i=0; i<size; i++) {
            newMap[i][0] = 1; newMap[i][size-1] = 1;
            newMap[0][i] = 1; newMap[size-1][i] = 1;
        }
        for (let x = 2; x < size - 2; x++) {
            for (let y = 2; y < size - 2; y++) {
                if (Math.random() < 0.08) newMap[x][y] = 2; 
                else if (Math.random() < 0.05) newMap[x][y] = Math.random() > 0.3 ? 3 : 1;
            }
        }
        for(let i=1; i<size-1; i++) {
            if (Math.random() > 0.5) newMap[i][0] = 3;
            if (Math.random() > 0.5) newMap[i][size-1] = 3;
            if (Math.random() > 0.5) newMap[0][i] = 3;
            if (Math.random() > 0.5) newMap[size-1][i] = 3;
        }
        
        // Place special 317 Painting (Map Value 4)
        // Ensure it's not in the center start area
        let paintingPlaced = false;
        let attempts = 0;
        while (!paintingPlaced && attempts < 50) {
            const px = Math.floor(2 + Math.random() * (size - 4));
            const py = Math.floor(2 + Math.random() * (size - 4));
            // Check if it's a wall and far from spawn
            if (newMap[px][py] === 1 && Math.sqrt((size/2 - px)**2 + (size/2 - py)**2) > 8) {
                newMap[px][py] = 4; // 317 Painting type
                secretPaintingLoc.current = { x: px, y: py };
                paintingPlaced = true;
            }
            attempts++;
        }

        const center = Math.floor(size / 2);
        for(let x=center-2; x<=center+2; x++) 
            for(let y=center-2; y<=center+2; y++) 
                newMap[x][y] = 0;

        if (character === Character.KANILA) {
            playerRef.current.speedMult = 1.3;
            playerRef.current.maxHp = 75;
            playerRef.current.hp = 75;
        } else if (character === Character.SEXISM) {
            playerRef.current.speedMult = 0.8;
            playerRef.current.damageMult = 1.5;
        } else if (character === Character.BLACK_PLAYER) {
            playerRef.current.maxHp = 50;
            playerRef.current.hp = 50;
            playerRef.current.damageMult = 1.2;
        }

        const handleKD = (e: KeyboardEvent) => keysPressed.current[e.code] = true;
        const handleKU = (e: KeyboardEvent) => keysPressed.current[e.code] = false;
        const handleMouseDown = () => keysPressed.current['Space'] = true;
        const handleMouseUp = () => keysPressed.current['Space'] = false;

        window.addEventListener('keydown', handleKD);
        window.addEventListener('keyup', handleKU);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // START MUSIC: Use the new EXTERNAL_MP3_FOLDER type for custom tracks
        startMusic(MusicType.EXTERNAL_MP3_FOLDER);
        
        setStatus('waiting');

        return () => {
            window.removeEventListener('keydown', handleKD);
            window.removeEventListener('keyup', handleKU);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            stopMusic();
        };
    }, [character]);

    // --- Game Logic ---
    const update = (dtMs: number) => {
        // IMPORTANT: Pause game logic if instruction modal is open
        if (isInstructionModalVisible) return;

        const dt = (dtMs / 1000) * timeScale.current; 
        const player = playerRef.current;
        const ents = entitiesRef.current;
        const weapon = WEAPONS[player.currentWeapon];
        
        if (timeScale.current < 1.0) timeScale.current = Math.min(1.0, timeScale.current + dt * 0.1); 
        if (controlsInvertedTimer.current > 0) {
            controlsInvertedTimer.current -= dt;
            if (controlsInvertedTimer.current <= 0) controlsInverted.current = false;
        }
        
        const moveSpeed = 3.5 * dt * player.speedMult;
        
        // --- SENSITIVITY APPLIED HERE ---
        const rotSpeed = 2.0 * dt * sensitivity;

        let turnLeft = keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft'];
        let turnRight = keysPressed.current['KeyD'] || keysPressed.current['ArrowRight'];
        let moveFwd = keysPressed.current['KeyW'] || keysPressed.current['ArrowUp'];
        let moveBack = keysPressed.current['KeyS'] || keysPressed.current['ArrowDown'];
        const isFiring = keysPressed.current['Space'];

        if (!hasGameStarted.current) {
            // Wait for user interaction to start the game loop only if tutorial is done
            if (!isInstructionModalVisible && (turnLeft || turnRight || moveFwd || moveBack || isFiring)) {
                hasGameStarted.current = true;
                setStatus('playing');
                currentRound.current = 1;
                spawnWave(1);
            } else {
                return; 
            }
        }

        if (controlsInverted.current) {
            const tempTurn = turnLeft; turnLeft = turnRight; turnRight = tempTurn;
            const tempMove = moveFwd; moveFwd = moveBack; moveBack = tempMove;
        }

        if (turnLeft) {
            player.dir -= rotSpeed;
            const oldPlaneX = player.planeX;
            player.planeX = player.planeX * Math.cos(-rotSpeed) - player.planeY * Math.sin(-rotSpeed);
            player.planeY = oldPlaneX * Math.sin(-rotSpeed) + player.planeY * Math.cos(-rotSpeed);
        }
        if (turnRight) {
            player.dir += rotSpeed;
            const oldPlaneX = player.planeX;
            player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
            player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
        }

        let isMoving = false;
        if (moveFwd) {
            const newX = player.x + Math.cos(player.dir) * moveSpeed;
            const newY = player.y + Math.sin(player.dir) * moveSpeed;
            if (!isWall(newX, player.y)) player.x = newX;
            if (!isWall(player.x, newY)) player.y = newY;
            isMoving = true;
        }
        if (moveBack) {
            const newX = player.x - Math.cos(player.dir) * moveSpeed;
            const newY = player.y - Math.sin(player.dir) * moveSpeed;
            if (!isWall(newX, player.y)) player.x = newX;
            if (!isWall(player.x, newY)) player.y = newY;
            isMoving = true;
        }

        if (isMoving) {
            weaponBob.current += dt * 10;
            // Footsteps sound logic
            footstepTimer.current -= dt;
            if (footstepTimer.current <= 0) {
                playSound(SoundType.FOOTSTEP);
                footstepTimer.current = 0.45; // Step every 0.45s
            }
        } else {
            weaponBob.current = 0; 
            footstepTimer.current = 0;
        }

        // --- 317 Painting Logic ---
        if (!bossPhase.current && !hasUsed317Heal.current && secretPaintingLoc.current) {
            const distToPainting = Math.sqrt((player.x - secretPaintingLoc.current.x)**2 + (player.y - secretPaintingLoc.current.y)**2);
            if (distToPainting < 1.5) {
                // Check if player is facing the wall roughly
                const dx = secretPaintingLoc.current.x - player.x;
                const dy = secretPaintingLoc.current.y - player.y;
                const angleToWall = Math.atan2(dy, dx);
                let angleDiff = angleToWall - player.dir;
                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                
                if (Math.abs(angleDiff) < 0.8) { // Facing within ~45 degrees
                    hasUsed317Heal.current = true;
                    player.hp = player.maxHp;
                    playSound(SoundType.HEAL_317);
                    addNotification("КАРТИНА 317: ИСЦЕЛЕНИЕ!", "text-yellow-300");
                    // Disable visual of painting
                    mapRef.current[secretPaintingLoc.current.x][secretPaintingLoc.current.y] = 1; 
                }
            }
        }

        // Shooting Logic
        if (isFiring) {
            const now = Date.now();
            const cooldownMult = character === Character.KANILA ? 0.8 : 1; 
            if (now - lastShotTime.current > weapon.cooldown * cooldownMult) {
                lastShotTime.current = now;
                playSound(weapon.sound); // Play specific weapon sound
                weaponRecoil.current = weapon.recoil;

                ents.forEach(e => {
                    if (!e.active || e.state === 'invisible') return;
                    const dx = e.x - player.x;
                    const dy = e.y - player.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const enemyDir = Math.atan2(dy, dx);
                    
                    const spreadOffset = (Math.random() - 0.5) * weapon.spread;
                    let angleDiff = enemyDir - (player.dir + spreadOffset);
                    
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

                    if (dist < 12 && Math.abs(angleDiff) < 0.25) {
                        // Check if hitting a WEAPON pickup to remote collect it
                        if (['weapon_fork', 'weapon_knife', 'weapon_ladle'].includes(e.type)) {
                            handleItemPickup(e, player);
                            return; // Don't damage items
                        }

                        // Damage enemies (and food, effectively destroying it)
                        e.state = 'pain';
                        e.stateTimer = 0.2;
                        
                        let dmg = weapon.damage * player.damageMult;
                        if (character === Character.BLACK_PLAYER && Math.random() < 0.1) dmg *= 3;

                        e.hp -= dmg;
                        playSound(SoundType.SPLAT);
                        
                        const pushPower = weapon.name === "ПОЛОВНИК АДА" ? 2.5 : 0.5;
                        const pushX = e.x + Math.cos(player.dir) * pushPower;
                        const pushY = e.y + Math.sin(player.dir) * pushPower;
                        if (!isWall(pushX, pushY)) { e.x = pushX; e.y = pushY; }

                        if (e.hp <= 0) {
                            e.active = false;
                            
                            // Specific death sounds based on entity type
                            if (e.type === 'dranik') {
                                playSound(SoundType.DEATH_DRANIK);
                            } else if (e.type === 'koldun') {
                                playSound(SoundType.DEATH_KOLDUN);
                            } else if (e.type === 'visitor') {
                                playSound(SoundType.DEATH_VISITOR);
                                undadastandingRef.current += 20;
                                addNotification("ВЫ УБИЛИ ЗРИТЕЛЯ!", "text-purple-500");
                            } else if (e.type === 'pristavuchiy') {
                                playSound(SoundType.DEATH_VISITOR);
                                undadastandingRef.current += 20;
                                addNotification("ВЫ УБИЛИ ЗРИТЕЛЯ!", "text-purple-500");
                            } else if (e.type === 'boss' || e.type === 'kanila_boss' || e.type === 'sexism_boss') {
                                playSound(SoundType.DEATH_BOSS);
                            } else if (!['sour_cream', 'machanka', 'shkvarki', 'heavy_thoughts', 'chronos_soup', 'inverted_gaze', 'blind_faith'].includes(e.type)) {
                                // Default for unknown enemies (though we covered most)
                                playSound(SoundType.ENEMY_DEATH);
                            }

                            // Loot & Win Check
                            if (!['sour_cream', 'machanka', 'shkvarki', 'heavy_thoughts', 'chronos_soup', 'inverted_gaze', 'blind_faith', 'visitor', 'pristavuchiy'].includes(e.type)) {
                                // Boss check
                                const remainingBosses = ents.filter(en => en.active && (en.type.includes('boss'))).length;
                                if (remainingBosses === 0 && bossPhase.current) {
                                    hasFinished.current = true;
                                    setStatus('won');
                                }
                                // Drop Loot - PASS isMoving STATUS
                                trySpawnLoot(e.x, e.y, isMoving);
                            }
                        }
                    }
                });
            }
        }

        // Entities Logic
        let activeEnemies = 0;
        let totalBossHp = 0;

        ents.forEach(e => {
            if (!e.active) return;
            
            // Pickup Items & Weapons
            if (['sour_cream', 'machanka', 'shkvarki', 'heavy_thoughts', 'chronos_soup', 'inverted_gaze', 'blind_faith', 'weapon_fork', 'weapon_knife', 'weapon_ladle'].includes(e.type)) {
                const dist = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
                if (dist < 0.6) {
                    handleItemPickup(e, player);
                }
                return;
            }

            const isEnemy = !['visitor', 'pristavuchiy'].includes(e.type);
            if (isEnemy) activeEnemies++;
            
            if (['boss', 'kanila_boss', 'sexism_boss'].includes(e.type)) {
                totalBossHp += e.hp;
            }

            // Visitor & Pristavuchiy Logic
            if (e.type === 'visitor') {
                if (e.state === 'pain') { e.stateTimer -= dt; if (e.stateTimer <= 0) e.state = 'idle'; return; }
                e.stateTimer -= dt;
                if (e.stateTimer <= 0) {
                    e.stateTimer = 1 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    const moveX = Math.cos(angle) * 0.5 * dt * 2; 
                    const moveY = Math.sin(angle) * 0.5 * dt * 2;
                    if (!isWall(e.x + moveX, e.y)) e.x += moveX;
                    if (!isWall(e.x, e.y + moveY)) e.y += moveY;
                }
                return;
            }

            if (e.type === 'pristavuchiy') {
                if (e.state === 'pain') { e.stateTimer -= dt; if (e.stateTimer <= 0) e.state = 'idle'; return; }
                const dist = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
                if (dist > 1.0) {
                    const speed = 1.2 * dt;
                    const dx = player.x - e.x;
                    const dy = player.y - e.y;
                    const moveX = (dx / dist) * speed;
                    const moveY = (dy / dist) * speed;
                    if (!isWall(e.x + moveX, e.y)) e.x += moveX;
                    if (!isWall(e.x, e.y + moveY)) e.y += moveY;
                }
                return;
            }

            // AI Movement
            if (e.state === 'invisible') {
                e.stateTimer -= dt;
                if (e.stateTimer <= 0) {
                    e.state = 'idle';
                    playSound(SoundType.SWOOSH);
                    let tx, ty;
                    do {
                        tx = 2 + Math.random() * (MAP_SIZE - 4);
                        ty = 2 + Math.random() * (MAP_SIZE - 4);
                    } while (isWall(tx, ty) || Math.sqrt((player.x - tx)**2 + (player.y - ty)**2) < 4);
                    e.x = tx; e.y = ty;
                }
                return;
            } else if (e.type.includes('boss') && e.state !== 'pain' && Math.random() < 0.5 * dt) { 
                e.state = 'invisible';
                e.stateTimer = 3.0;
                playSound(SoundType.SWOOSH);
                return;
            }

            const dist = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
            
            if (e.state === 'pain') {
                e.stateTimer -= dt;
                if (e.stateTimer <= 0) e.state = 'chase';
                return;
            }

            if (dist > 0.8) {
                const speed = (e.type.includes('boss') ? 1.5 : e.type === 'koldun' ? 2.5 : 2.0) * dt;
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const moveX = (dx / dist) * speed;
                const moveY = (dy / dist) * speed;
                if (!isWall(e.x + moveX, e.y)) e.x += moveX;
                if (!isWall(e.x, e.y + moveY)) e.y += moveY;
            } 
            
            if (dist < 1.2) {
                if (Math.random() < 2.0 * dt) {
                    player.hp -= e.type.includes('boss') ? 20 : 8;
                    flashScreen.current = 0.5;
                    playSound(SoundType.PLAYER_HIT);
                }
            }
        });

        // Wave Management
        let hudMessage = "";
        
        if (activeEnemies === 0 && !bossPhase.current) {
            if (isWaveActive.current) {
                isWaveActive.current = false; 
                waveDelayTimer.current = 4.0; 
                playSound(SoundType.TRANSFORM_SUCCESS); 
            }

            if (waveDelayTimer.current > 0) {
                waveDelayTimer.current -= dt;
                hudMessage = `ОТДЫХ: ${Math.ceil(waveDelayTimer.current)}...`;
                if (waveDelayTimer.current <= 0) {
                    if (currentRound.current < 3) {
                        currentRound.current += 1;
                        spawnWave(currentRound.current);
                    } else {
                        // Boss Spawn Phase
                        bossPhase.current = true;
                        playSound(SoundType.BOSS_ROAR);
                        
                        if (character === Character.BLACK_PLAYER) {
                            addNotification("КАНИЛА И СЕКСИЗМ", "text-purple-500");
                            ents.push({
                                id: 998, type: 'kanila_boss', x: MAP_SIZE/2 - 2, y: MAP_SIZE/2, active: true, hp: 400, state: 'idle', stateTimer: 0
                            });
                            ents.push({
                                id: 999, type: 'sexism_boss', x: MAP_SIZE/2 + 2, y: MAP_SIZE/2, active: true, hp: 400, state: 'idle', stateTimer: 0
                            });
                        } else {
                            addNotification("ГЛАВНЫЙ ИНКВИЗИТОР", "text-red-600");
                            ents.push({
                                id: 999, type: 'boss', x: MAP_SIZE/2, y: MAP_SIZE/2, active: true, hp: 600, state: 'idle', stateTimer: 0
                            });
                        }
                    }
                }
            } else {
                hudMessage = "ГОТОВНОСТЬ...";
            }
        } else {
            hudMessage = bossPhase.current ? "ФИНАЛ" : `ВОЛНА ${currentRound.current}/3`;
        }

        // Cleanup
        if (weaponRecoil.current > 0) weaponRecoil.current = Math.max(0, weaponRecoil.current - dt * 5);
        if (flashScreen.current > 0) flashScreen.current = Math.max(0, flashScreen.current - dt * 2);
        if (blindFold.current > 0) blindFold.current = Math.max(0, blindFold.current - dt * 0.5);
        setNotifications(prev => prev.map(n => ({ ...n, life: n.life - dt })).filter(n => n.life > 0));

        if (undadastandingRef.current >= MAX_UNDADA && !hasFinished.current) {
            hasFinished.current = true;
            setStatus('canceled'); 
            setTimeout(() => { playSound(SoundType.PLAYER_LOSE); onLose(); }, 3000);
        } else if (player.hp <= 0 && !hasFinished.current) {
            hasFinished.current = true;
            setStatus('lost');
            setTimeout(() => { playSound(SoundType.PLAYER_LOSE); onLose(); }, 2000);
        }

        setHudState({ hp: player.hp, round: currentRound.current, bossHp: totalBossHp, weaponFrame: weaponRecoil.current > 0.5 ? 1 : 0, message: hudMessage, undada: undadastandingRef.current, weaponName: WEAPONS[player.currentWeapon].name, weaponSymbol: WEAPONS[player.currentWeapon].symbol });
    };

    // --- Rendering ---
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use current internal canvas dimensions
        const w = canvas.width;
        const h = canvas.height;
        const player = playerRef.current;

        // 1. Clear the canvas fully to allow DynamicSky to show through
        ctx.clearRect(0, 0, w, h);

        // 2. Draw Floor ONLY (Remove Ceiling Drawing)
        const floorGrad = ctx.createLinearGradient(0, h/2, 0, h);
        floorGrad.addColorStop(0, '#333');
        floorGrad.addColorStop(1, '#555');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h/2, w, h/2);

        // 3. Wall Casting
        const zBuffer = new Array(w).fill(0);

        // Use a slight step adjustment or ensure integer increments to match pixels if needed,
        // but for dynamic width, iterating pixel by pixel (or every 2nd) works fine.
        // If we want consistent "fat pixels", we should adjust step based on ratio, but simple step=2 is generally ok.
        const rayStep = 2;

        for (let x = 0; x < w; x+=rayStep) {
            const cameraX = 2 * x / w - 1;
            const rayDirX = Math.cos(player.dir) + player.planeX * cameraX;
            const rayDirY = Math.sin(player.dir) + player.planeY * cameraX;

            let mapX = Math.floor(player.x);
            let mapY = Math.floor(player.y);
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let stepX, stepY, sideDistX, sideDistY;

            if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } 
            else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
            if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } 
            else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

            let hit = 0, side = 0, depth = 0;
            while (hit === 0 && depth < MAX_DEPTH) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } 
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (mapRef.current[mapX] && mapRef.current[mapX][mapY] > 0) hit = 1;
                depth++;
            }

            let perpWallDist;
            if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
            else            perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

            // Fill Z-buffer for all pixels in this strip
            for(let k=0; k<rayStep; k++) {
                if (x+k < w) zBuffer[x+k] = perpWallDist;
            }

            const lineHeight = Math.floor(h / perpWallDist);
            const drawStart = Math.max(0, -lineHeight / 2 + h / 2);
            const drawEnd = Math.min(h - 1, lineHeight / 2 + h / 2);

            let wallColorValue = side === 1 ? 180 : 220;
            const mapValue = mapRef.current[mapX][mapY];
            
            if (mapValue === 2) wallColorValue -= 50; // Pillar
            
            if (perpWallDist > MAX_DEPTH) wallColorValue = 0;
            else wallColorValue = Math.floor(wallColorValue * (1 - perpWallDist / MAX_DEPTH));
            
            // RED WALLS IN HELL (Boss Phase)
            const r = bossPhase.current ? Math.min(255, wallColorValue + 50) : wallColorValue;
            const g = bossPhase.current ? 0 : wallColorValue;
            const b = bossPhase.current ? 0 : wallColorValue;

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, drawStart, rayStep, drawEnd - drawStart);

            if (mapValue === 3 || mapValue === 4) {
                const wallHeight = drawEnd - drawStart;
                const paintingHeight = wallHeight * 0.5; 
                const paintingTop = drawStart + (wallHeight - paintingHeight) / 2;
                
                if (perpWallDist < 15) {
                    const frameColor = side === 1 ? '#b8860b' : '#ffd700';
                    ctx.fillStyle = frameColor;
                    ctx.fillRect(x, paintingTop, rayStep, paintingHeight); 
                    
                    let artColor = '#fff';
                    if (bossPhase.current) {
                        artColor = '#39ff14'; 
                    } else if (mapValue === 4) {
                        // 317 Painting Art (Golden/Yellow)
                        artColor = '#ffd700'; 
                    } else {
                        const artHash = (mapX * 13 + mapY * 7) % 5;
                        if (artHash === 0) artColor = '#ff4500';
                        else if (artHash === 1) artColor = '#1e90ff';
                        else if (artHash === 2) artColor = '#32cd32';
                        else if (artHash === 3) artColor = '#8a2be2';
                        else artColor = '#000';
                    }

                    const canvasHeight = paintingHeight * 0.8;
                    const canvasTop = paintingTop + (paintingHeight - canvasHeight) / 2;
                    ctx.fillStyle = artColor;
                    ctx.fillRect(x, canvasTop, rayStep, canvasHeight);
                    
                    // Specific detail for 317 Painting
                    if (mapValue === 4) {
                        const textHeight = canvasHeight * 0.5;
                        const textTop = canvasTop + (canvasHeight - textHeight) / 2;
                        ctx.fillStyle = '#000';
                        // Draw simple bars to simulate "317" text roughly
                        ctx.fillRect(x, textTop, rayStep, textHeight / 3);
                    }
                }
            }
        }

        // 4. Sprite Casting
        const sprites = entitiesRef.current
            .filter(e => e.active)
            .map(e => ({...e, dist: ((player.x - e.x)**2 + (player.y - e.y)**2) }))
            .sort((a, b) => b.dist - a.dist);

        for (const sprite of sprites) {
            if (sprite.state === 'invisible' && character !== Character.SEXISM && sprite.dist > 2) continue;

            const spriteX = sprite.x - player.x;
            const spriteY = sprite.y - player.y;
            const dirX = Math.cos(player.dir);
            const dirY = Math.sin(player.dir);
            const correctInvDet = 1.0 / (player.planeX * dirY - dirX * player.planeY);
            const transformX = correctInvDet * (dirY * spriteX - dirX * spriteY);
            const transformY = correctInvDet * (-player.planeY * spriteX + player.planeX * spriteY);
            const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(h / transformY));
            const spriteWidth = Math.abs(Math.floor(h / transformY));
            const drawStartY = Math.floor(-spriteHeight / 2 + h / 2);

            if (transformY > 0) {
                let emoji = '🥔';
                if (sprite.type === 'koldun') emoji = '👹';
                if (sprite.type === 'boss') emoji = '👺';
                if (sprite.type === 'kanila_boss') emoji = '🧢';
                if (sprite.type === 'sexism_boss') emoji = '👚';
                
                // Varied emojis for visitors and pristavuchiy
                if (sprite.type === 'visitor') emoji = sprite.visualVariant || '🧐';
                if (sprite.type === 'pristavuchiy') emoji = sprite.visualVariant || '🧟‍♂️'; 
                
                if (['sour_cream', 'machanka', 'shkvarki'].includes(sprite.type)) emoji = '🥘';
                if (['heavy_thoughts', 'chronos_soup', 'inverted_gaze', 'blind_faith'].includes(sprite.type)) emoji = '🔮';
                
                // Weapon drops visual
                if (sprite.type === 'weapon_fork') emoji = '🍴';
                if (sprite.type === 'weapon_knife') emoji = '🔪';
                if (sprite.type === 'weapon_ladle') emoji = '🥣';

                const centerStrip = Math.floor(spriteScreenX);
                if (centerStrip > 0 && centerStrip < w && transformY < zBuffer[centerStrip]) {
                    const shakeX = sprite.state === 'pain' ? (Math.random() - 0.5) * 10 : 0;
                    ctx.font = `${spriteHeight}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.beginPath();
                    ctx.ellipse(spriteScreenX + shakeX, drawStartY + spriteHeight, spriteWidth/2, spriteHeight/5, 0, 0, Math.PI*2);
                    ctx.fill();

                    if (sprite.state === 'invisible' && character === Character.SEXISM) ctx.globalAlpha = 0.3;
                    
                    // Highlight weapon drops
                    if (sprite.type.startsWith('weapon')) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = 'white';
                    }

                    ctx.fillStyle = 'white'; 
                    ctx.fillText(emoji, spriteScreenX + shakeX, drawStartY + spriteHeight/2);
                    ctx.globalAlpha = 1.0;
                    ctx.shadowBlur = 0;
                    
                    if (['boss', 'kanila_boss', 'sexism_boss', 'koldun', 'dranik'].includes(sprite.type)) {
                        const maxHp = sprite.type.includes('boss') ? (character === Character.BLACK_PLAYER ? 400 : 600) : (sprite.type === 'koldun' ? 60 : 30);
                        const hpPct = Math.max(0, sprite.hp / maxHp);
                        ctx.fillStyle = 'red';
                        ctx.fillRect(spriteScreenX - spriteWidth/2, drawStartY - 10, spriteWidth, 5);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(spriteScreenX - spriteWidth/2, drawStartY - 10, spriteWidth * hpPct, 5);
                    }
                }
            }
        }

        // 5. Weapon
        const currentWeapon = WEAPONS[player.currentWeapon];
        const bobX = Math.cos(weaponBob.current) * 10;
        const bobY = Math.abs(Math.sin(weaponBob.current)) * 10;
        const recoilY = weaponRecoil.current * 40;
        // Weapon positioning needs to scale with width slightly or stay centered
        const weaponX = w / 2 + 60 + bobX; 
        const weaponY = h - bobY + recoilY;

        ctx.font = '120px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.save();
        ctx.translate(weaponX, weaponY);
        ctx.scale(-1, 1); // Mirror weapon to look like it's in right hand
        ctx.fillStyle = currentWeapon.color;
        ctx.fillText(currentWeapon.symbol, 0, 0);
        ctx.restore();

        if (weaponRecoil.current > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 0, ${Math.random() * 0.5 + 0.2})`;
            ctx.beginPath();
            ctx.arc(w/2, h/2 + 20, 30 + Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }

        if (flashScreen.current > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${flashScreen.current})`;
            ctx.fillRect(0, 0, w, h);
        }
        if (blindFold.current > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${blindFold.current})`;
            ctx.fillRect(0, 0, w, h);
        }
    };

    useGameLoop((dt) => {
        update(dt);
        draw();
    }, status === 'playing' || status === 'waiting'); 

    // --- Touch Handlers ---
    const handleTouchStart = (key: string, e: React.TouchEvent) => {
        e.preventDefault(); 
        keysPressed.current[key] = true;
        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    };
    const handleTouchEnd = (key: string, e: React.TouchEvent) => {
        e.preventDefault();
        keysPressed.current[key] = false;
    };

    return (
        <div 
            ref={wrapperRef}
            className="w-full h-full flex flex-col items-center justify-center relative touch-none select-none overflow-hidden"
        >
            {/* Dynamic Sky is placed BEHIND the canvas */}
            <DynamicSky />

            {status === 'won' && <DranikiShooterWinScreen onContinue={onWin} />}
            {status === 'lost' && <div className="absolute inset-0 bg-red-900/80 z-20 flex items-center justify-center text-5xl font-mono text-white">ВЫ ПОГИБЛИ</div>}
            {status === 'canceled' && <div className="absolute inset-0 bg-purple-900/90 z-20 flex flex-col items-center justify-center text-center text-white px-4"><h2 className="text-4xl mb-4 font-bold">ВЫ ОТМЕНЕНЫ</h2><p className="text-xl">Сообщество не простило насилия над зрителем.</p></div>}
            
            <MinigameHUD>
                <div className="w-full flex flex-col gap-1 pointer-events-none">
                    <div className="flex justify-between items-start w-full">
                        {/* HP Section */}
                        <div className="flex flex-col items-start bg-black/40 p-2 rounded-lg border border-red-900/50 backdrop-blur-sm shadow-lg">
                            <span className="text-xl text-red-500 font-bold leading-none font-mono">HP {Math.ceil(hudState.hp)}%</span>
                            <div className="w-24 h-2 bg-gray-800 mt-1 rounded overflow-hidden">
                                <div style={{width: `${hudState.hp}%`}} className="h-full bg-red-600 transition-all duration-300"></div>
                            </div>
                        </div>

                        {/* Center Section: Message & Meter */}
                        <div className="flex flex-col items-center pt-2">
                             <div className="w-32 h-2 bg-gray-900 border border-gray-600 relative mb-1 rounded-full overflow-hidden opacity-80">
                                <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${Math.min(100, (hudState.undada / MAX_UNDADA) * 100)}%` }}></div>
                             </div>
                             <span className="text-yellow-400 text-lg font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center whitespace-nowrap">{hudState.message}</span>
                             {bossPhase.current && <span className="animate-pulse text-red-600 text-sm font-bold bg-black/50 px-2 rounded mt-1">BOSS: {Math.ceil(hudState.bossHp)}</span>}
                        </div>

                        {/* Weapon Section */}
                        <div className="flex flex-col items-end bg-black/40 p-2 rounded-lg border border-gray-600/50 backdrop-blur-sm shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl filter drop-shadow-md">{hudState.weaponSymbol}</span>
                                <span className="text-white font-bold text-sm tracking-wide hidden sm:inline">{hudState.weaponName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Area */}
                    <div className="flex flex-col items-center mt-4 w-full pointer-events-none">
                        {notifications.map(n => (
                            <div key={n.id} className={`text-lg font-bold ${n.color} animate-[fadeIn_0.2s_ease-out] drop-shadow-md bg-black/30 px-2 rounded mb-1`}>
                                {n.text}
                            </div>
                        ))}
                    </div>
                </div>
            </MinigameHUD>

            <canvas 
                ref={canvasRef} 
                width={canvasSize.width} 
                height={canvasSize.height} 
                className="w-full h-full absolute inset-0 z-10 pixelated-canvas"
                style={{ imageRendering: 'pixelated', backgroundColor: 'transparent' }} 
            />
            
            {/* Start Overlay - Only show if tutorial is DONE and instructions are closed */}
            {!hasGameStarted.current && !isInstructionModalVisible && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none w-full max-w-md px-4">
                    <div className="bg-black/70 p-6 rounded-xl border-4 border-yellow-500/50 backdrop-blur-sm flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                        <div className="text-yellow-400 font-bold font-mono text-2xl md:text-4xl animate-pulse text-center leading-tight" style={{textShadow: '2px 2px 0 #000'}}>
                            {startMessage}
                        </div>
                        <div className="text-white font-mono text-sm md:text-base bg-black/80 px-4 py-2 rounded border border-gray-500 flex items-center gap-2">
                            <span className="text-xl">🎮</span>
                            <span>{isMobile ? "ТРОНЬ ДЖОЙСТИК!" : "ЖМИ W, A, S, D + SPACE"}</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Mobile Controls Overlay - Uses useIsMobile hook */}
            {isMobile && (
                <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-end pb-8 px-4">
                    <div className="flex justify-between items-end">
                        <div className="relative w-48 h-48 pointer-events-auto opacity-80">
                            <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-gray-700/80 rounded-t flex items-center justify-center border-2 border-white/30 active:bg-white/50 active:border-white"
                                onTouchStart={(e) => handleTouchStart('KeyW', e)} onTouchEnd={(e) => handleTouchEnd('KeyW', e)}>▲</div>
                            <div className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-gray-700/80 rounded-b flex items-center justify-center border-2 border-white/30 active:bg-white/50 active:border-white"
                                onTouchStart={(e) => handleTouchStart('KeyS', e)} onTouchEnd={(e) => handleTouchEnd('KeyS', e)}>▼</div>
                            <div className="absolute top-1/3 left-0 w-1/3 h-1/3 bg-gray-700/80 rounded-l flex items-center justify-center border-2 border-white/30 active:bg-white/50 active:border-white"
                                onTouchStart={(e) => handleTouchStart('KeyA', e)} onTouchEnd={(e) => handleTouchEnd('KeyA', e)}>◄</div>
                            <div className="absolute top-1/3 right-0 w-1/3 h-1/3 bg-gray-700/80 rounded-r flex items-center justify-center border-2 border-white/30 active:bg-white/50 active:border-white"
                                onTouchStart={(e) => handleTouchStart('KeyD', e)} onTouchEnd={(e) => handleTouchEnd('KeyD', e)}>►</div>
                        </div>
                        
                        <div 
                            className="w-24 h-24 bg-red-600/80 rounded-full border-4 border-red-900 pointer-events-auto flex items-center justify-center active:bg-red-400 active:scale-95 transition-transform shadow-lg"
                            onTouchStart={(e) => handleTouchStart('Space', e)} onTouchEnd={(e) => handleTouchEnd('Space', e)}
                        >
                            <span className="font-bold text-white text-xl" style={{textShadow: '2px 2px 0 #000'}}>FIRE</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
