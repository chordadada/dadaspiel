
import React from 'react';

import { NaleyShampanskogo } from './NaleyShampanskogo';
import { KvirKontrol } from './KvirKontrol';
import { PoiskiKartiny317 } from './PoiskiKartiny317';
import { TanecUZakrytyhDverey } from './TanecUZakrytyhDverey';
import { DadaisticheskiyKompliment } from './DadaisticheskiyKompliment';
import { ProhodKKino } from './ProhodKKino';
import { PereverniKalendar } from './PereverniKalendar';
import { SoberiFeminitiv } from './SoberiFeminitiv';
import { BoitsovskiyKlubFeminitivov } from './BoitsovskiyKlubFeminitivov';
// import { PrigotovlenieAladok } from './PrigotovlenieAladok'; // Archived
import { PoceluyDobra } from './PoceluyDobra';
import { FruktoviySpor } from './FruktoviySpor';
import { NePodavis } from './NePodavis';
import { ZasosPylesosa } from './ZasosPylesosa';
import { DranikiShooter } from './DranikiShooter';
import { DadaAudioPlayer } from './DadaAudioPlayer';

// Это карта (объект), которая сопоставляет строковый ID мини-игры
// (например, "1-1") с её React-компонентом.
// Это позволяет динамически выбирать и рендерить нужную мини-игру
// в главном компоненте App.tsx, не используя большой switch или if-else.
export const minigameComponentMap: { [key: string]: React.FC<{ onWin: () => void; onLose: () => void; isSlowMo?: boolean; isMinigameInverted?: boolean; }> } = {
    "1-1": NaleyShampanskogo,
    "1-2": KvirKontrol,
    "1-3": PoiskiKartiny317,
    "2-1": TanecUZakrytyhDverey,
    "2-2": PoceluyDobra, // Moved here
    "3-1": ProhodKKino,
    "3-2": PereverniKalendar,
    "4-1": SoberiFeminitiv,
    "4-2": BoitsovskiyKlubFeminitivov,
    "5-1": NePodavis, 
    "5-2": DadaisticheskiyKompliment, // Moved here
    "6-1": FruktoviySpor,
    "6-2": ZasosPylesosa, 
    "6-3": DranikiShooter, 
    "bonus-player": DadaAudioPlayer, 
};
