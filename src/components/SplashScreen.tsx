import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

interface SplashScreenProps {
    onComplete: () => void;
}

type SplashPhase = 'reveal' | 'hold' | 'exit';

const TIMINGS = {
    REVEAL_DURATION: 1800,
    EXIT_START: 5800,
} as const;

const PARTICLE_COUNT = 25;

// Premium SVG Logo — Shield crest with clipboard checkmark (bill tracking theme)
const HoneycuttLogo: React.FC<{ size?: number }> = ({ size = 150 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="splash-logo-svg"
    >
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0d170" />
                <stop offset="40%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#a88725" />
            </linearGradient>
            <linearGradient id="gold-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f5e6a3" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="gold-fill" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(212,175,55,0.08)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0.02)" />
            </linearGradient>
            <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5e6a3" />
                <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <filter id="soft-glow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* === OUTER SHIELD — pointed bottom crest === */}
        <motion.path
            d="M100 10 L170 40 L170 120 Q170 160 100 200 Q30 160 30 120 L30 40 Z"
            stroke="url(#gold-gradient)"
            strokeWidth="1.8"
            fill="url(#gold-fill)"
            filter="url(#soft-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.0, ease: 'easeInOut' }}
        />

        {/* Inner shield border */}
        <motion.path
            d="M100 20 L162 46 L162 118 Q162 154 100 190 Q38 154 38 118 L38 46 Z"
            stroke="url(#gold-light)"
            strokeWidth="0.6"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
        />

        {/* === CLIPBOARD / LEDGER — central document shape === */}
        {/* Clipboard top clip */}
        <motion.path
            d="M88 52 L88 48 Q88 44 92 44 L108 44 Q112 44 112 48 L112 52"
            stroke="url(#gold-gradient)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
        />

        {/* Document body */}
        <motion.rect
            x="72" y="52" width="56" height="78" rx="4"
            stroke="url(#gold-gradient)"
            strokeWidth="1.2"
            fill="rgba(212,175,55,0.04)"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
            style={{ transformOrigin: '100px 52px' }}
        />

        {/* === BILL LINES — representing tracked items === */}
        {/* Line 1 with small checkbox */}
        <motion.rect x="80" y="64" width="6" height="6" rx="1"
            stroke="url(#gold-gradient)" strokeWidth="0.8" fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2, duration: 0.3 }} />
        <motion.line x1="90" y1="67" x2="118" y2="67"
            stroke="url(#gold-gradient)" strokeWidth="0.8" strokeLinecap="round"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ delay: 1.25, duration: 0.3 }}
            style={{ transformOrigin: '90px 67px' }} />

        {/* Line 2 with checkbox */}
        <motion.rect x="80" y="76" width="6" height="6" rx="1"
            stroke="url(#gold-gradient)" strokeWidth="0.8" fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
            transition={{ delay: 1.35, duration: 0.3 }} />
        <motion.line x1="90" y1="79" x2="114" y2="79"
            stroke="url(#gold-gradient)" strokeWidth="0.8" strokeLinecap="round"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ delay: 1.4, duration: 0.3 }}
            style={{ transformOrigin: '90px 79px' }} />

        {/* Line 3 with checkbox */}
        <motion.rect x="80" y="88" width="6" height="6" rx="1"
            stroke="url(#gold-gradient)" strokeWidth="0.8" fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
            transition={{ delay: 1.5, duration: 0.3 }} />
        <motion.line x1="90" y1="91" x2="116" y2="91"
            stroke="url(#gold-gradient)" strokeWidth="0.8" strokeLinecap="round"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ delay: 1.55, duration: 0.3 }}
            style={{ transformOrigin: '90px 91px' }} />

        {/* Line 4 with checkbox */}
        <motion.rect x="80" y="100" width="6" height="6" rx="1"
            stroke="url(#gold-gradient)" strokeWidth="0.8" fill="none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
            transition={{ delay: 1.65, duration: 0.3 }} />
        <motion.line x1="90" y1="103" x2="112" y2="103"
            stroke="url(#gold-gradient)" strokeWidth="0.8" strokeLinecap="round"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.5, scaleX: 1 }}
            transition={{ delay: 1.7, duration: 0.3 }}
            style={{ transformOrigin: '90px 103px' }} />

        {/* === DOLLAR SIGN — small, at top of document (bill value) === */}
        <motion.text
            x="100" y="50"
            textAnchor="middle"
            fontFamily="'Outfit', 'Georgia', serif"
            fontSize="9"
            fontWeight="600"
            fill="url(#gold-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.0, duration: 0.4 }}
        >
            $
        </motion.text>

        {/* === LARGE CHECKMARK — sweeping across the clipboard === */}
        <motion.path
            d="M82 85 L95 100 L122 65"
            stroke="url(#check-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ delay: 1.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* === BOTTOM DECORATIVE ELEMENTS === */}

        {/* Horizontal accent line below clipboard */}
        <motion.line x1="65" y1="142" x2="135" y2="142"
            stroke="url(#gold-gradient)" strokeWidth="0.5" strokeLinecap="round"
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 0.3, scaleX: 1 }}
            transition={{ delay: 2.0, duration: 0.5 }}
            style={{ transformOrigin: '100px 142px' }} />

        {/* Small diamond accent */}
        <motion.path
            d="M100 150 L104 155 L100 160 L96 155 Z"
            fill="url(#gold-gradient)"
            filter="url(#glow)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
        />

        {/* Corner accents inside shield */}
        <motion.path d="M50 50 L60 50 M50 50 L50 60"
            stroke="url(#gold-gradient)" strokeWidth="0.6" strokeLinecap="round"
            initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
            transition={{ delay: 1.0, duration: 0.4 }} />
        <motion.path d="M150 50 L140 50 M150 50 L150 60"
            stroke="url(#gold-gradient)" strokeWidth="0.6" strokeLinecap="round"
            initial={{ opacity: 0 }} animate={{ opacity: 0.25 }}
            transition={{ delay: 1.0, duration: 0.4 }} />
    </svg>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<SplashPhase>('reveal');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('hold'), TIMINGS.REVEAL_DURATION),
            setTimeout(() => setPhase('exit'), TIMINGS.EXIT_START - 800),
            setTimeout(onComplete, TIMINGS.EXIT_START),
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    // Smooth progress bar animation
    useEffect(() => {
        const totalDuration = TIMINGS.EXIT_START;
        const startTime = Date.now();
        let raf: number;
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(elapsed / totalDuration, 1);
            // Ease-out cubic for natural deceleration
            const eased = 1 - Math.pow(1 - pct, 3);
            setProgress(eased * 100);
            if (pct < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const containerVariants = useMemo(() => ({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, scale: 1.05, filter: 'blur(12px)' },
    }), []);

    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 3,
            duration: 4 + Math.random() * 3,
            yOffset: -150 - Math.random() * 150,
            xOffset: (Math.random() - 0.5) * 80,
            size: 1 + Math.random() * 2.5,
        }));
    }, []);

    return (
        <AnimatePresence mode="wait">
            {phase !== 'exit' && (
                <motion.div
                    className="splash-screen"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    role="banner"
                    aria-label="Honeycutt Budget Planner splash screen"
                >
                    <div className="splash-vignette" aria-hidden="true" />
                    <div className="splash-radial-glow" aria-hidden="true" />

                    <div className="splash-content">
                        {/* Logo */}
                        <motion.div
                            className="splash-logo-container"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <HoneycuttLogo size={155} />
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            className="splash-title"
                            initial={{ opacity: 0, y: 20, letterSpacing: '0.15em' }}
                            animate={{ opacity: 1, y: 0, letterSpacing: '0.45em' }}
                            transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
                        >
                            Honeycutt
                        </motion.h1>

                        {/* Divider */}
                        <motion.div
                            className="title-divider"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 1.0, duration: 0.8 }}
                            aria-hidden="true"
                        />

                        {/* Subtitle */}
                        <motion.p
                            className="splash-subtitle"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.8 }}
                        >
                            Budget Planner
                        </motion.p>

                        {/* Progress bar */}
                        <motion.div
                            className="splash-progress-container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8, duration: 0.5 }}
                        >
                            <div className="splash-progress-track">
                                <div
                                    className="splash-progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                                <div
                                    className="splash-progress-glow"
                                    style={{ left: `${progress}%` }}
                                />
                            </div>
                            <motion.span
                                className="splash-loading-text"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 2.0, duration: 0.5 }}
                            >
                                Loading
                            </motion.span>
                        </motion.div>
                    </div>

                    {/* Particles */}
                    <div className="splash-particles" aria-hidden="true">
                        {particles.map((p) => (
                            <motion.div
                                key={p.id}
                                className="particle"
                                initial={{ opacity: 0, y: 0 }}
                                animate={{
                                    opacity: [0, 0.6, 0],
                                    y: p.yOffset,
                                    x: p.xOffset,
                                }}
                                transition={{
                                    duration: p.duration,
                                    repeat: Infinity,
                                    delay: p.delay,
                                    ease: 'linear',
                                }}
                                style={{
                                    left: p.left,
                                    bottom: '0%',
                                    width: p.size,
                                    height: p.size,
                                }}
                            />
                        ))}
                    </div>

                    {/* Corner accents */}
                    <div className="splash-corner splash-corner-tl" aria-hidden="true" />
                    <div className="splash-corner splash-corner-br" aria-hidden="true" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
