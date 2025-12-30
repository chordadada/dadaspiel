
import React, { useMemo } from 'react';
import { useSettings } from '../../context/GameContext';
import { SeasonalEvent } from '../../../types';

export const Title: React.FC<{ onTitleClick: () => void }> = ({ onTitleClick }) => {
    const { seasonalEvent, seasonalAnimationsEnabled } = useSettings();

    const titleText = useMemo(() => {
        if (!seasonalAnimationsEnabled) return "ДАДАШПИЛЬ";

        switch (seasonalEvent) {
            case SeasonalEvent.NEW_YEAR: return "🍊ДАДАШПИЛЬ🍾";
            case SeasonalEvent.APRIL_FOOLS: return "ОТЧЁТ О ШПИЛЕ №317";
            case SeasonalEvent.HALLOWEEN: return "ДАДАШРЭКЛ";
            case SeasonalEvent.DADA_BIRTHDAY: return "ДАДРДАДР";
            case SeasonalEvent.SEPTEMBER_3: return "3СЕНТЯБРЯ";
            case SeasonalEvent.GONDOLIER_DAY: return "ТЫГОНДОЛЬЕР";
            case SeasonalEvent.GLITCH_DAY: return "ERROR_NULL";
            case SeasonalEvent.POTATO_SALVATION: return "ДАДРАНІКІ";
            default: return "ДАДАШПИЛЬ";
        }
    }, [seasonalEvent, seasonalAnimationsEnabled]);

    const titleStyle = useMemo(() => {
        if (!seasonalAnimationsEnabled) return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-yellow-300";

        if (seasonalEvent === SeasonalEvent.APRIL_FOOLS) {
            return "text-6xl font-sans font-normal text-gray-400 my-8 no-animation tracking-tight";
        }
        if (seasonalEvent === SeasonalEvent.HALLOWEEN) {
            return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-orange-500 drop-shadow-[0_5px_5px_rgba(0,0,0,1)]";
        }
        if (seasonalEvent === SeasonalEvent.GONDOLIER_DAY) {
             return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-bounce text-cyan-300 drop-shadow-[0_5px_5px_rgba(0,0,100,0.5)]";
        }
        if (seasonalEvent === SeasonalEvent.DADA_BIRTHDAY) {
             return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-pink-400 drop-shadow-[0_5px_5px_rgba(255,105,180,0.5)]";
        }
        if (seasonalEvent === SeasonalEvent.SEPTEMBER_3) {
             return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-orange-600 drop-shadow-[0_5px_5px_rgba(255,69,0,0.5)]";
        }
        if (seasonalEvent === SeasonalEvent.GLITCH_DAY) {
             return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 text-white font-mono animate-[pulse_0.1s_infinite]";
        }
        if (seasonalEvent === SeasonalEvent.POTATO_SALVATION) {
             return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-bounce text-yellow-600 drop-shadow-[0_5px_0px_#5D4037]";
        }
        return "text-6xl md:text-8xl font-bold text-center cursor-pointer my-8 animate-pulse text-yellow-300";
    }, [seasonalEvent, seasonalAnimationsEnabled]);

    return (
        <h1 onClick={onTitleClick} className={titleStyle}>
            {titleText}
        </h1>
    );
};
