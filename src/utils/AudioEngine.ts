
// src/utils/AudioEngine.ts

// Enum for sound types
export enum SoundType {
  BUTTON_CLICK,
  GENERIC_CLICK,
  ITEM_CATCH_GOOD,
  ITEM_CATCH_BAD,
  ITEM_PLACE_SUCCESS,
  TRANSFORM_SUCCESS,
  PLAYER_HIT,
  PLAYER_LOSE,
  PLAYER_WIN,
  DESTROY,
  COUGH,
  ART_REVEAL,
  PUNISHMENT_CLICK,
  WIN_SHAMPANSKOE,
  WIN_KVIR,
  WIN_TANEC,
  WIN_KOMPLIMENT,
  WIN_FEMINITIV,
  WIN_BOITSOVSKIY,
  WIN_DOBRO,
  WIN_ALADKI,
  WIN_FRUKTY,
  WIN_NEPODAVIS,
  WIN_PYLESOS,
  WIN_KALENDAR,
  LOSE_KALENDAR,
  DADA_ECSTASY,
  // New granular sounds
  SWOOSH,
  PLOP,
  KISS_SPAWN,
  PARRY,
  FLIP,
  TEAR,
  LIQUID_CATCH,
  // Shooter Sounds
  SHOOT, // Generic fallback
  SHOOT_SPOON,
  SHOOT_FORK,
  SHOOT_KNIFE,
  SHOOT_LADLE,
  FOOTSTEP,
  HEAL_317,
  PICKUP_WEAPON,
  PICKUP_FOOD,
  PICKUP_BAD,
  ENEMY_DAMAGE,
  // Specific Deaths
  ENEMY_DEATH, // Fallback
  DEATH_DRANIK,
  DEATH_KOLDUN,
  DEATH_VISITOR,
  DEATH_BOSS,
  
  POWERUP,
  BOSS_ROAR,
  SPLAT,
  
  // Ne Podavis Specific
  SLAP,
  GASP,
}

export enum MusicType {
    MENU,
    AMBIENT_GALLERY,
    AMBIENT_KVIR,
    AMBIENT_DANCE,
    AMBIENT_ZEN,
    AMBIENT_STREET,
    AMBIENT_FEMINIST_FIGHT, // Used for 'Soberi Feminitiv'
    FIGHT_CLUB_THEME,       // New: Used for 'Boitsovskiy Klub'
    AMBIENT_KITCHEN,
    AMBIENT_TENSION,
    AMBIENT_NATURE, 
    LOOP_VACUUM,
    DOOM_FPS,
    // Seasonal Music
    SEASONAL_NEW_YEAR,
    SEASONAL_APRIL_FOOLS,
    SEASONAL_HALLOWEEN,
    SEASONAL_DADA_BIRTHDAY,
    SEASONAL_SEPTEMBER_3,
    SEASONAL_GONDOLIER,
    SEASONAL_GLITCH,
    SEASONAL_POTATO,
    // New types
    EXTERNAL_MP3_FOLDER,
    ROMANTIC_DOBRO,
    FRUIT_ARGUMENT
}

// !!! ВАЖНО: Файлы должны лежать в папке public/music/
const CUSTOM_PLAYLIST = [
    'xdm1.mp3',
    'xdm2.mp3',
    'xdm3.mp3',
    'xdm4.mp3',
    'xdm5.mp3',
    'xdm6.mp3',
    'xdm7.mp3',
    'xdm8.mp3',
    'xdm9.mp3',
    'xdm10.mp3',
    'xdm11.mp3',
    'xdm12.mp3',
    'xdm13.mp3'
];

// --- Volume Constants ---
// Громкость для MP3 файлов (0.0 - 1.0)
const VOL_MP3 = 0.6; 
// Громкость для синтезированных звуков (GainNode)
const VOL_SYNTH = 0.05;

let audioContext: AudioContext | null = null;
let isMutedGlobally = false;
let musicNodes: ({ disconnect: () => void; setParameter?: (param: 'pitch' | 'volume', value: number) => void; stop?: () => void })[] = [];
let musicGain: GainNode | null = null;
let activeHtmlAudio: HTMLAudioElement | null = null; // Для управления внешними MP3

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.");
    return null;
  }
};

export const toggleMuteState = (): boolean => {
  isMutedGlobally = !isMutedGlobally;
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    if (musicGain) {
        musicGain.gain.setTargetAtTime(isMutedGlobally ? 0 : VOL_SYNTH, ctx.currentTime, 0.1);
    }
  }
  // Также управляем громкостью HTML Audio элемента, если он есть
  if (activeHtmlAudio) {
      activeHtmlAudio.volume = isMutedGlobally ? 0 : VOL_MP3;
  }
  return isMutedGlobally;
};

export const getMuteState = (): boolean => isMutedGlobally;

// --- Preload Function ---
// Загружает файлы в кеш браузера, не декодируя их в память (чтобы не забить RAM).
export const preloadMusic = async () => {
    try {
        console.log("AudioEngine: Starting background music preload...");
        for (const track of CUSTOM_PLAYLIST) {
            const url = `music/${track}`;
            // fetch кладет файл в disk cache браузера
            await fetch(url, { priority: 'low' }).catch(e => console.warn(`Failed to preload ${track}`, e));
        }
        console.log("AudioEngine: Music preload complete.");
    } catch (e) {
        console.warn("AudioEngine: Preload interrupted", e);
    }
};

export const stopMusic = () => {
    musicNodes.forEach(node => {
        if (node.disconnect) node.disconnect();
        if (node.stop) node.stop();
    });
    musicNodes = [];
    if (musicGain) {
        musicGain.disconnect();
        musicGain = null;
    }
    // Останавливаем MP3, если играет
    if (activeHtmlAudio) {
        activeHtmlAudio.pause();
        activeHtmlAudio.src = "";
        activeHtmlAudio = null;
    }
};

export const updateMusicParameter = (param: 'pitch' | 'volume', value: number) => {
    musicNodes.forEach(node => {
        if (node.setParameter) {
            node.setParameter(param, value);
        }
    });
};

export const startMusic = (type: MusicType) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (Browser Autoplay Policy)
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
            // Context will be resumed on next user interaction in playSound
        });
    }

    stopMusic();

    // Setup Gain Node for Web Audio
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(0, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(isMutedGlobally ? 0 : VOL_SYNTH, ctx.currentTime + 1);
    musicGain.connect(ctx.destination);
    
    // Helper for Oscillator based music
    const playSimpleSound = (freq: number, duration: number, volume: number, oscType: OscillatorType, startTime: number = 0) => {
        if (!ctx || !musicGain) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(musicGain);
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    };

    switch(type) {
        // ... Existing music cases ...
        case MusicType.EXTERNAL_MP3_FOLDER: {
            if (CUSTOM_PLAYLIST.length === 0) return;
            const randomTrack = CUSTOM_PLAYLIST[Math.floor(Math.random() * CUSTOM_PLAYLIST.length)];
            const audioPath = `music/${randomTrack}`;
            const audio = new Audio(audioPath);
            audio.loop = true;
            audio.volume = isMutedGlobally ? 0 : VOL_MP3;
            // Промис может быть отклонен из-за политики автовоспроизведения, это нормально
            audio.play().catch(() => {});
            activeHtmlAudio = audio;
            musicNodes.push({ disconnect: () => { if (activeHtmlAudio === audio) { audio.pause(); activeHtmlAudio = null; } } });
            break;
        }
        case MusicType.MENU: {
            const notes = [110, 138.59, 164.81, 220, 164.81, 138.59];
            let noteIndex = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                playSimpleSound(notes[noteIndex % notes.length], 0.6, 0.8, 'triangle');
                noteIndex++;
            }, 500);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_STREET: {
            const playCar = () => { if (!musicGain) return; playSimpleSound(350, 0.4, 0.3, 'sawtooth'); playSimpleSound(420, 0.4, 0.3, 'sawtooth'); };
            const playBird = () => { if (!musicGain) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain).connect(musicGain!); osc.type = 'sine'; osc.frequency.setValueAtTime(1500, ctx.currentTime); osc.frequency.linearRampToValueAtTime(2500, ctx.currentTime + 0.1); osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3); };
            const scheduler = setInterval(() => { if (Math.random() < 0.1) playBird(); if (Math.random() < 0.05) playCar(); }, 1000);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.FRUIT_ARGUMENT: 
        case MusicType.AMBIENT_NATURE: {
            const scale = [329.63, 392.00, 440.00, 493.88, 523.25]; 
            const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } if (Math.random() < 0.6) { const freq = scale[Math.floor(Math.random() * scale.length)]; playSimpleSound(freq, 0.3, 0.5, 'sine'); } }, 400);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_KVIR: {
             let beat = 0;
             const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const bassNotes = [110, 110, 0, 110, 130, 0, 146, 130]; const note = bassNotes[beat % 8]; if (note > 0) playSimpleSound(note, 0.15, 0.6, 'square'); if (beat % 2 === 1) playSimpleSound(4000, 0.05, 0.1, 'triangle'); beat++; }, 250);
             musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_FEMINIST_FIGHT: { // Soberi Feminitiv
            let tick = 0;
            const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const baseFreq = tick < 8 ? 65.41 : (tick < 12 ? 77.78 : 87.31); playSimpleSound(baseFreq, 0.1, 0.7, 'sawtooth'); if (tick % 4 === 0) playSimpleSound(baseFreq * 2, 0.1, 0.3, 'square'); tick = (tick + 1) % 16; }, 150);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.FIGHT_CLUB_THEME: { // Fight Club specific: Breakbeat/Big Beat style
            let tick = 0;
            const scheduler = setInterval(() => {
                if (!musicGain) { clearInterval(scheduler); return; }
                const t = ctx.currentTime;
                
                // Heavy Kick on 0, 2 (sometimes offbeat)
                if (tick % 8 === 0 || tick % 8 === 2.5) {
                    const osc = ctx.createOscillator(); const g = ctx.createGain();
                    osc.connect(g).connect(musicGain!);
                    osc.frequency.setValueAtTime(120, t);
                    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.2);
                    g.gain.setValueAtTime(1.0, t);
                    g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                    osc.start(t); osc.stop(t + 0.2);
                }
                
                // Snare/Noise Snap on 4
                if (tick % 8 === 4) {
                    const bufferSize = ctx.sampleRate * 0.1;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.7, t);
                    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                    noise.connect(noiseGain).connect(musicGain!);
                    noise.start(t);
                }

                // Gritty Bassline (Acid-ish)
                if (tick % 2 === 0) {
                    const osc = ctx.createOscillator();
                    osc.type = 'sawtooth';
                    // F#1 -> A1 -> E1 -> F#1 pattern
                    const note = [46.25, 46.25, 55.0, 41.20][Math.floor(tick / 16) % 4];
                    osc.frequency.setValueAtTime(note, t);
                    
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.Q.value = 5;
                    filter.frequency.setValueAtTime(200, t);
                    filter.frequency.linearRampToValueAtTime(800, t + 0.2);

                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.5, t);
                    g.gain.linearRampToValueAtTime(0, t + 0.2);

                    osc.connect(filter).connect(g).connect(musicGain!);
                    osc.start(t); osc.stop(t + 0.2);
                }

                tick++;
            }, 120); // ~125 BPM
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.AMBIENT_KITCHEN: { 
            const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain).connect(musicGain!); osc.type = 'sine'; const startFreq = 200 + Math.random() * 300; osc.frequency.setValueAtTime(startFreq, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(startFreq + 200, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.5, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1); }, 200);
            musicNodes.push({ disconnect: () => clearInterval(scheduler) });
            break;
        }
        case MusicType.ROMANTIC_DOBRO: {
            const chords = [[261.63, 329.63, 392.00], [293.66, 349.23, 440.00], [392.00, 493.88, 587.33], [261.63, 329.63, 392.00]];
            let chordIdx = 0;
            const lfo = ctx.createOscillator(); lfo.frequency.value = 5; const lfoGain = ctx.createGain(); lfoGain.gain.value = 5; lfo.start(); lfo.connect(lfoGain);
            const playChord = () => { if (!musicGain) return; const currentChord = chords[chordIdx % chords.length]; currentChord.forEach((freq, i) => { const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = freq; lfoGain.connect(osc.frequency); osc.connect(gain).connect(musicGain!); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 1); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4); osc.start(); osc.stop(ctx.currentTime + 4); }); chordIdx++; };
            playChord(); const scheduler = setInterval(playChord, 4000);
            musicNodes.push({ disconnect: () => { clearInterval(scheduler); lfo.stop(); lfo.disconnect(); } });
            break;
        }
        case MusicType.LOOP_VACUUM: {
            const noise = ctx.createBufferSource(); const bufferSize = ctx.sampleRate * 2; const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); let data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5; noise.buffer = buffer; noise.loop = true;
            const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = 5;
            const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.5; const lfoGain = ctx.createGain(); lfoGain.gain.value = 400; lfo.connect(lfoGain).connect(filter.frequency); filter.frequency.value = 600;
            const mainGain = ctx.createGain(); mainGain.gain.value = 0.8;
            noise.connect(filter).connect(mainGain).connect(musicGain); lfo.start(); noise.start();
            const thumpScheduler = setInterval(() => { if (!musicGain) return; playSimpleSound(60, 0.1, 0.8, 'square'); }, 500);
            musicNodes.push({ disconnect: () => { noise.stop(); lfo.stop(); clearInterval(thumpScheduler); }, setParameter: (param, value) => { if (param === 'pitch') { noise.playbackRate.setTargetAtTime(value, ctx.currentTime, 0.1); lfo.frequency.setTargetAtTime(0.5 * value, ctx.currentTime, 0.1); } } });
            break;
        }
        case MusicType.AMBIENT_GALLERY: { const scheduler = setInterval(() => { if (Math.random() < 0.2) { playSimpleSound(220 + Math.random() * 220, 3, 0.4, 'sine'); } }, 5000); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.AMBIENT_DANCE: { 
            // House/Lounge style. Less annoying, more groovy.
            let beat = 0;
            const scheduler = setInterval(() => { 
                if (!musicGain) { clearInterval(scheduler); return; } 
                const t = ctx.currentTime;
                
                // Deep Kick (4/4)
                if (beat % 4 === 0) {
                    const osc = ctx.createOscillator(); const g = ctx.createGain();
                    osc.connect(g).connect(musicGain!);
                    osc.frequency.setValueAtTime(100, t);
                    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.3);
                    g.gain.setValueAtTime(0.8, t);
                    g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                    osc.start(t); osc.stop(t + 0.3);
                }
                
                // Closed Hat (every beat)
                const bufferSize = ctx.sampleRate * 0.05;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 6000;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.1, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
                noise.connect(noiseFilter).connect(noiseGain).connect(musicGain!);
                noise.start(t);

                // Smooth Bass (Walking)
                if (beat % 4 === 0 || beat % 4 === 2) {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    // C2 - G2 - A2 - F2 pattern (roughly 65, 98, 110, 87 Hz)
                    const notes = [65.41, 98.00, 110.00, 87.31];
                    const note = notes[Math.floor(beat / 8) % 4];
                    osc.frequency.setValueAtTime(note, t);
                    const g = ctx.createGain();
                    g.gain.setValueAtTime(0.4, t);
                    g.gain.linearRampToValueAtTime(0, t + 0.3);
                    osc.connect(g).connect(musicGain!);
                    osc.start(t); osc.stop(t + 0.3);
                }
                
                // Soft Chord Pad (every 16 beats)
                if (beat % 32 === 0) {
                    const chord = [261.63, 311.13, 392.00, 466.16]; // Cm7
                    chord.forEach(freq => {
                        const osc = ctx.createOscillator(); osc.type = 'triangle';
                        const g = ctx.createGain();
                        osc.connect(g).connect(musicGain!);
                        osc.frequency.value = freq;
                        g.gain.setValueAtTime(0, t);
                        g.gain.linearRampToValueAtTime(0.1, t + 1);
                        g.gain.linearRampToValueAtTime(0, t + 4);
                        osc.start(t); osc.stop(t + 4);
                    });
                }

                beat++; 
            }, 125); 
            musicNodes.push({ disconnect: () => clearInterval(scheduler) }); 
            break; 
        }
        case MusicType.AMBIENT_ZEN: { const playPad = () => playSimpleSound(110 + Math.random() * 50, 8, 0.3, 'triangle'); playPad(); const scheduler = setInterval(playPad, 7000); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.AMBIENT_TENSION: { const drone = ctx.createOscillator(); const drone2 = ctx.createOscillator(); drone.type = 'sawtooth'; drone2.type = 'sawtooth'; drone.frequency.value = 82; drone2.frequency.value = 82.5; drone.connect(musicGain); drone2.connect(musicGain); drone.start(); drone2.start(); musicNodes.push({ disconnect: () => { drone.stop(); drone2.stop(); } }); break; }
        // Seasonal Logic
        case MusicType.SEASONAL_NEW_YEAR: { const notes = [329, 329, 329, 329, 329, 329, 329, 392, 261, 293, 329]; const durations = [0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2, 0.1, 0.8]; let idx = 0; const playNote = () => { if (!musicGain) return; playSimpleSound(notes[idx], durations[idx], 0.5, 'sine'); const nextDelay = durations[idx] * 1000; idx = (idx + 1) % notes.length; const timeout = setTimeout(playNote, nextDelay); musicNodes.push({ disconnect: () => clearTimeout(timeout) }); }; playNote(); break; }
        case MusicType.SEASONAL_APRIL_FOOLS: { const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const freq = Math.random() > 0.5 ? 200 + Math.random() * 100 : 800 + Math.random() * 200; playSimpleSound(freq, 0.1, 0.5, 'sawtooth'); }, 150); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_HALLOWEEN: { const notes = [329.63, 415.30, 329.63, 415.30, 329.63, 415.30, 329.63, 392.00]; let idx = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } playSimpleSound(notes[idx % notes.length] / 2, 0.3, 0.6, 'sawtooth'); idx++; }, 300); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_DADA_BIRTHDAY: { const notes = [261, 261, 293, 261, 349, 329]; let idx = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const detune = 1 + (Math.random() - 0.5) * 0.1; playSimpleSound(notes[idx % notes.length] * detune, 0.4, 0.5, 'triangle'); idx++; }, 600); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_SEPTEMBER_3: { const notes = [392, 392, 349, 311, 293, 261, 0, 466, 466, 415, 392, 349, 311, 0]; let idx = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const freq = notes[idx % notes.length]; if (freq > 0) playSimpleSound(freq, 0.3, 0.6, 'square'); idx++; }, 400); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_GONDOLIER: { const notes = [392, 349, 329, 293, 261, 293, 329, 293]; let idx = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } playSimpleSound(notes[Math.floor(idx / 4) % notes.length], 0.15, 0.5, 'sine'); idx++; }, 150); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_GLITCH: { const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } if (Math.random() < 0.3) return; const oscType: OscillatorType = Math.random() > 0.5 ? 'sawtooth' : 'square'; playSimpleSound(100 + Math.random() * 1000, 0.05 + Math.random() * 0.2, 0.4, oscType); }, 100); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.SEASONAL_POTATO: { const notes = [65, 98, 65, 98]; let idx = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } playSimpleSound(notes[idx % notes.length], 0.4, 0.8, 'square'); if (idx % 2 === 0) playSimpleSound(800, 0.05, 0.2, 'sawtooth'); idx++; }, 500); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break; }
        case MusicType.DOOM_FPS: {
            const bassOsc = ctx.createOscillator(); bassOsc.type = 'sawtooth'; bassOsc.frequency.value = 55; const distortion = ctx.createWaveShaper(); function makeDistortionCurve(amount: number) { const k = typeof amount === 'number' ? amount : 50; const n_samples = 44100; const curve = new Float32Array(n_samples); const deg = Math.PI / 180; for (let i = 0; i < n_samples; ++i ) { const x = i * 2 / n_samples - 1; curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) ); } return curve; } distortion.curve = makeDistortionCurve(400); distortion.oversample = '4x'; const bassGain = ctx.createGain(); bassGain.gain.value = 0.4; bassOsc.connect(distortion).connect(bassGain).connect(musicGain); bassOsc.start(); musicNodes.push({ disconnect: () => bassOsc.stop() });
            let beat = 0; const scheduler = setInterval(() => { if (!musicGain) { clearInterval(scheduler); return; } const t = ctx.currentTime; if (beat % 4 === 0) { const osc = ctx.createOscillator(); const g = ctx.createGain(); osc.connect(g).connect(musicGain!); osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.5); osc.start(t); osc.stop(t + 0.5); } if (beat % 4 === 2) { const noise = ctx.createBufferSource(); const b = ctx.createBuffer(1, 44100 * 0.2, 44100); const d = b.getChannelData(0); for(let i=0; i<b.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3; noise.buffer = b; const g = ctx.createGain(); noise.connect(g).connect(musicGain!); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.2); noise.start(t); } beat++; }, 125); musicNodes.push({ disconnect: () => clearInterval(scheduler) }); break;
        }
    }
};

export const playSound = (type: SoundType) => {
    if (isMutedGlobally) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(e => console.error("AudioContext resume failed", e));

    const t = ctx.currentTime;
    let osc: OscillatorNode;
    let gain: GainNode;
  
    const play = (freq: number, duration: number, volume: number, type: OscillatorType, ramp: 'linear' | 'exponential' = 'exponential') => {
        osc = ctx.createOscillator();
        gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        if (ramp === 'exponential') {
            gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        } else {
            gain.gain.linearRampToValueAtTime(0.0001, t + duration);
        }
        osc.start(t);
        osc.stop(t + duration);
    };

    const playNoise = (duration: number, volume: number, filterType: BiquadFilterType, filterFreq: number) => {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { output[i] = (Math.random() * 2 - 1) * 0.2; }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = filterFreq;
        gain = ctx.createGain();
        noise.connect(filter).connect(gain).connect(ctx.destination);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        noise.start(t);
    }

    switch (type) {
        // ... (All existing cases remain the same)
        case SoundType.SHOOT_SPOON: play(300, 0.1, 0.3, 'sine'); osc!.frequency.exponentialRampToValueAtTime(100, t + 0.1); break;
        case SoundType.SHOOT_FORK: play(1500, 0.05, 0.2, 'triangle'); break; 
        case SoundType.SHOOT_KNIFE: play(800, 0.1, 0.1, 'sawtooth'); osc!.frequency.linearRampToValueAtTime(1200, t + 0.1); break; 
        case SoundType.SHOOT_LADLE: play(100, 0.4, 0.4, 'square'); osc!.frequency.exponentialRampToValueAtTime(50, t + 0.4); break; 
        case SoundType.FOOTSTEP: playNoise(0.05, 0.15, 'lowpass', 600); break; 
        case SoundType.HEAL_317: [440, 554, 659, 880].forEach((freq, i) => setTimeout(() => play(freq, 1.0, 0.1, 'sine'), i * 100)); break;
        case SoundType.PICKUP_WEAPON: play(440, 0.1, 0.2, 'square'); setTimeout(() => play(880, 0.2, 0.2, 'square'), 50); break;
        case SoundType.PICKUP_FOOD: play(300, 0.1, 0.3, 'sine'); setTimeout(() => play(400, 0.1, 0.3, 'sine'), 100); break;
        case SoundType.PICKUP_BAD: play(200, 0.3, 0.2, 'sawtooth'); osc!.frequency.linearRampToValueAtTime(150, t + 0.3); break;
        case SoundType.ENEMY_DAMAGE: playNoise(0.1, 0.2, 'lowpass', 800); break;
        case SoundType.DEATH_DRANIK: playNoise(0.1, 0.2, 'lowpass', 300); play(120, 0.15, 0.25, 'sawtooth'); break;
        case SoundType.DEATH_KOLDUN: play(1200, 0.3, 0.2, 'square'); osc!.frequency.exponentialRampToValueAtTime(100, t + 0.3); break;
        case SoundType.DEATH_VISITOR: play(600, 0.3, 0.25, 'triangle'); osc!.frequency.linearRampToValueAtTime(300, t + 0.3); break;
        case SoundType.DEATH_BOSS: playNoise(1.5, 0.5, 'lowpass', 150); play(60, 1.5, 0.4, 'sawtooth'); osc!.frequency.linearRampToValueAtTime(20, t + 1.5); break;
        case SoundType.ENEMY_DEATH: play(50, 0.3, 0.4, 'sawtooth'); playNoise(0.2, 0.2, 'lowpass', 500); break;
        case SoundType.SWOOSH: playNoise(0.2, 0.1, 'bandpass', 1000); break;
        case SoundType.PLOP: play(200, 0.1, 0.2, 'sine'); osc!.frequency.exponentialRampToValueAtTime(100, t + 0.1); break;
        case SoundType.KISS_SPAWN: play(1200, 0.05, 0.1, 'sine'); break;
        case SoundType.PARRY: play(1500, 0.1, 0.2, 'square'); setTimeout(() => playNoise(0.08, 0.1, 'highpass', 4000), 10); break;
        case SoundType.FLIP: playNoise(0.08, 0.2, 'highpass', 2000); break;
        case SoundType.TEAR: playNoise(0.3, 0.2, 'bandpass', 1500); break;
        case SoundType.LIQUID_CATCH: play(3000, 0.05, 0.05, 'triangle'); break;
        case SoundType.SHOOT: playNoise(0.15, 0.3, 'lowpass', 2000); play(100, 0.1, 0.5, 'square'); break; 
        case SoundType.POWERUP: play(440, 0.1, 0.1, 'square'); setTimeout(() => play(880, 0.2, 0.1, 'square'), 100); break;
        case SoundType.BOSS_ROAR: playNoise(1.5, 0.5, 'lowpass', 200); play(50, 1.5, 0.5, 'sawtooth'); break;
        case SoundType.SPLAT: playNoise(0.1, 0.2, 'lowpass', 600); break;
        
        // SLAP (Sharp low noise)
        case SoundType.SLAP: playNoise(0.1, 0.5, 'lowpass', 1000); break;
        
        // GASP (Rising breathable sound)
        case SoundType.GASP:
            playNoise(0.6, 0.3, 'bandpass', 1500);
            const gaspOsc = ctx.createOscillator();
            const gaspGain = ctx.createGain();
            gaspOsc.connect(gaspGain).connect(ctx.destination);
            gaspOsc.type = 'triangle';
            gaspOsc.frequency.setValueAtTime(300, t);
            gaspOsc.frequency.linearRampToValueAtTime(500, t + 0.5);
            gaspGain.gain.setValueAtTime(0, t);
            gaspGain.gain.linearRampToValueAtTime(0.2, t + 0.3);
            gaspGain.gain.linearRampToValueAtTime(0, t + 0.6);
            gaspOsc.start(t); gaspOsc.stop(t + 0.6);
            break;

        // DADA ECSTASY: Updated Logic (Ticking -> Swell -> Pop)
        case SoundType.DADA_ECSTASY: {
            // 1. Ticking / Clicking (starts slow, speeds up)
            // Simulating a geiger counter or timer ticking
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            clickOsc.type = 'square';
            clickOsc.frequency.value = 800; // High pitch click
            clickOsc.connect(clickGain).connect(ctx.destination);
            
            // Create a custom pulsing gain curve for clicking effect
            clickGain.gain.setValueAtTime(0, t);
            
            // Schedule clicks up to 11s (match visual explosion)
            let time = t;
            let interval = 0.5; // Start interval (500ms)
            while (time < t + 11) {
                clickGain.gain.setValueAtTime(0, time);
                clickGain.gain.linearRampToValueAtTime(0.05, time + 0.01);
                clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
                time += interval;
                interval *= 0.9; // Speed up
                if (interval < 0.05) interval = 0.05; // Cap speed
            }
            clickOsc.start(t);
            clickOsc.stop(t + 11);

            // 2. Swelling Pad (Starts at 3s, grows until 11s)
            const swellOsc = ctx.createOscillator();
            const swellGain = ctx.createGain();
            swellOsc.type = 'sawtooth';
            swellOsc.frequency.setValueAtTime(55, t + 3); // Low bass
            swellOsc.frequency.linearRampToValueAtTime(220, t + 11); // Rise pitch
            
            // Lowpass filter to open up the sound
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, t + 3);
            filter.frequency.exponentialRampToValueAtTime(2000, t + 11);

            swellOsc.connect(filter).connect(swellGain).connect(ctx.destination);
            swellGain.gain.setValueAtTime(0, t + 3);
            swellGain.gain.linearRampToValueAtTime(0.2, t + 11); // Ear-safe volume cap
            swellOsc.start(t + 3);
            swellOsc.stop(t + 11);

            // 3. The Pop (at 11s, synced with visual explosion)
            const popNoise = ctx.createBufferSource();
            const bufferSize = ctx.sampleRate * 0.5; // 0.5 sec burst
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            popNoise.buffer = buffer;
            const popGain = ctx.createGain();
            popGain.gain.setValueAtTime(0.4, t + 11);
            popGain.gain.exponentialRampToValueAtTime(0.001, t + 11.5);
            popNoise.connect(popGain).connect(ctx.destination);
            popNoise.start(t + 11);

            break; 
        }
            
        case SoundType.BUTTON_CLICK: play(440, 0.1, 0.1, 'triangle'); osc!.frequency.exponentialRampToValueAtTime(880, t + 0.1); break;
        case SoundType.GENERIC_CLICK: play(200, 0.05, 0.1, 'square'); break;
        case SoundType.ITEM_CATCH_GOOD: play(880, 0.1, 0.1, 'sine'); break;
        case SoundType.ITEM_CATCH_BAD: play(110, 0.2, 0.15, 'sawtooth'); break;
        case SoundType.ITEM_PLACE_SUCCESS: play(523.25, 0.1, 0.1, 'sine'); setTimeout(() => play(659.25, 0.1, 0.1, 'sine'), 80); break;
        case SoundType.TRANSFORM_SUCCESS: play(300, 0.2, 0.08, 'sawtooth'); osc!.frequency.exponentialRampToValueAtTime(1200, t + 0.2); break;
        case SoundType.PLAYER_HIT: play(164, 0.3, 0.2, 'square'); break;
        case SoundType.PLAYER_LOSE: play(220, 0.8, 0.2, 'sawtooth'); osc!.frequency.exponentialRampToValueAtTime(55, t + 0.8); break;
        case SoundType.PLAYER_WIN: [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => { setTimeout(() => play(freq, 0.2, 0.15, 'triangle'), i * 100); }); break;
        case SoundType.DESTROY: playNoise(0.15, 0.2, 'lowpass', 10000); break;
        case SoundType.COUGH: playNoise(0.2, 0.3, 'bandpass', 600); break;
        case SoundType.ART_REVEAL: playNoise(0.2, 0.3, 'highpass', 1000); [523, 622, 783, 1046].forEach((freq, i) => setTimeout(() => play(freq, 0.4, 0.1, 'triangle'), 100 + i * 50)); break;
        case SoundType.PUNISHMENT_CLICK: play(220, 0.3, 0.2, 'sawtooth'); osc!.frequency.exponentialRampToValueAtTime(180, t + 0.3); break;
        case SoundType.WIN_SHAMPANSKOE: play(150, 0.1, 0.4, 'sawtooth'); setTimeout(() => play(300, 0.1, 0.3, 'sawtooth'), 50); break;
        case SoundType.WIN_KVIR: [261, 329, 392, 523, 659, 783, 1046].forEach((freq, i) => setTimeout(() => play(freq, 0.5, 0.1, 'triangle'), 500 + i * 100)); break;
        case SoundType.WIN_TANEC: setTimeout(() => play(330, 0.3, 0.2, 'sawtooth'), 500); setTimeout(() => play(440, 0.3, 0.2, 'sawtooth'), 600); break;
        case SoundType.WIN_KOMPLIMENT: play(110, 3, 0.2, 'sawtooth'); osc!.frequency.linearRampToValueAtTime(111, t+3); break;
        case SoundType.WIN_FEMINITIV: play(2000, 1.5, 0.1, 'sine'); setTimeout(() => play(2500, 1.5, 0.1, 'sine'), 100); break;
        case SoundType.WIN_BOITSOVSKIY: playNoise(1, 0.3, 'lowpass', 10000); setTimeout(() => { play(523, 1.5, 0.15, 'square'); play(659, 1.5, 0.15, 'square'); }, 500); break;
        case SoundType.WIN_DOBRO: play(440, 1, 0.2, 'triangle'); osc!.frequency.exponentialRampToValueAtTime(1760, t + 1); break;
        case SoundType.WIN_ALADKI: playNoise(1, 0.1, 'highpass', 5000); break;
        case SoundType.WIN_FRUKTY: play(440, 0.15, 0.1, 'square'); setTimeout(() => play(587, 0.15, 0.1, 'square'), 200); setTimeout(() => play(783, 0.3, 0.1, 'square'), 400); break;
        case SoundType.WIN_NEPODAVIS: play(110, 0.1, 0.3, 'square'); setTimeout(() => { play(1046, 1, 0.15, 'triangle'); play(1318, 1, 0.15, 'triangle'); }, 300); break;
        case SoundType.WIN_PYLESOS: playNoise(1.5, 0.3, 'bandpass', 300); setTimeout(() => play(80, 0.1, 0.4, 'sine'), 1100); break;
        case SoundType.WIN_KALENDAR: playNoise(8, 0.1, 'highpass', 4000); break;
        case SoundType.LOSE_KALENDAR: [220, 261, 329].forEach(freq => play(freq, 1.5, 0.15, 'triangle')); setTimeout(() => playNoise(1.0, 0.08, 'highpass', 3000), 500); break;
  }
};
