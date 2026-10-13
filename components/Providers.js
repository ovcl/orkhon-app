'use client';

import { MotionConfig } from 'framer-motion';
import OfflineIndicator from './OfflineIndicator';
import KioskMode from './KioskMode';

// Апп даяарх client талын тохиргоо: хөдөлгөөн багасгах тохиргоог хүндэтгэх,
// сүлжээний төлөв, киоск горим.
export default function Providers({ children }) {
    return (
        <MotionConfig reducedMotion="user">
            <OfflineIndicator />
            <KioskMode />
            {children}
        </MotionConfig>
    );
}
