import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SplashScreenProps {
    onComplete: () => void;
}

type SplashPhase = 'reveal' | 'hold' | 'exit';

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMINGS = {
    REVEAL_DURATION: 1500,
    HOLD_DURATION: 3700,
    EXIT_DURATION: 1000,
    EXIT_START: 6200,
} as const;

const PARTICLE_COUNT = 15;

// ============================================================================
// SPLASH SCREEN COMPONENT
// ============================================================================

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<SplashPhase>('reveal');

    // ========================================================================
    // PHASE MANAGEMENT
    // ========================================================================

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase('hold'), TIMINGS.REVEAL_DURATION),
            setTimeout(() => setPhase('exit'), TIMINGS.EXIT_START - TIMINGS.EXIT_DURATION),
            setTimeout(onComplete, TIMINGS.EXIT_START),
        ];

        // Cleanup all timers on unmount
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    // ========================================================================
    // ANIMATION VARIANTS
    // ========================================================================

    const containerVariants = useMemo(() => ({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: {
            opacity: 0,
            scaleX: 1.2,
            scaleY: 0.8,
            filter: 'blur(20px)',
            y: 50,
        },
    }), []);

    const titleVariants = useMemo(() => ({
        initial: { opacity: 0, y: 30, letterSpacing: '0.2em' },
        animate: { opacity: 1, y: 0, letterSpacing: '0.5em' },
    }), []);

    const dividerVariants = useMemo(() => ({
        initial: { scaleX: 0 },
        animate: { scaleX: 1 },
    }), []);

    const subtitleVariants = useMemo(() => ({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
    }), []);

    // ========================================================================
    // PARTICLE GENERATION
    // ========================================================================

    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
            yOffset: -100 - Math.random() * 100,
            xOffset: (Math.random() - 0.5) * 50,
        }));
    }, []);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <AnimatePresence mode="wait">
            {phase !== 'exit' && (
                <motion.div
                    className="splash-screen"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 1.0, ease: 'anticipate' }}
                    role="banner"
                    aria-label="Honeycutt Budget Planner splash screen"
                >
                    {/* Vignette overlay */}
                    <div className="splash-vignette" aria-hidden="true" />

                    {/* Main content */}
                    <div className="splash-content">
                        <motion.h1
                            className="splash-title"
                            variants={titleVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        >
                            Honeycutt
                        </motion.h1>

                        <motion.div
                            className="title-divider"
                            variants={dividerVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.5, duration: 0.8 }}
                            aria-hidden="true"
                        />

                        <motion.p
                            className="splash-subtitle"
                            variants={subtitleVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 1.0, duration: 0.8 }}
                        >
                            Budget Planner
                        </motion.p>
                    </div>

                    {/* Animated particles */}
                    <div className="splash-particles" aria-hidden="true">
                        {particles.map((particle) => (
                            <motion.div
                                key={particle.id}
                                className="particle"
                                initial={{ opacity: 0, y: 0 }}
                                animate={{
                                    opacity: [0, 0.5, 0],
                                    y: particle.yOffset,
                                    x: particle.xOffset,
                                }}
                                transition={{
                                    duration: particle.duration,
                                    repeat: Infinity,
                                    delay: particle.delay,
                                    ease: 'linear',
                                }}
                                style={{
                                    left: particle.left,
                                    bottom: '0%',
                                }}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;