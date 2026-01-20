import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TutorialOverlay.css';

interface TutorialStep {
    target: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tutorialSteps: TutorialStep[] = [
    {
        target: '.bills-pane',
        title: 'Your Main Bills',
        description: 'This is where all your upcoming bills are displayed, sorted by due date.',
        position: 'right',
    },
    {
        target: '.add-note-btn',
        title: 'Add Notes',
        description: 'Click the + button to add notes to any bill. Perfect for reminders!',
        position: 'right',
    },
    {
        target: '.edit-mode-btn',
        title: 'Edit Mode',
        description: 'Toggle this to update bill amounts, delete bills, or make quick changes.',
        position: 'bottom',
    },
    {
        target: '.payoff-info-btn',
        title: 'Payoff Calculator',
        description: 'Click the ℹ icon to see how different payment amounts affect your payoff timeline.',
        position: 'left',
    },
    {
        target: '.mark-paid-btn',
        title: 'Mark as Paid',
        description: 'Click the checkmark to mark a bill as paid. It will move to the Paid column.',
        position: 'left',
    },
    {
        target: '.new-month-btn',
        title: 'Start New Month',
        description: 'Ready for the next month? Click here to archive paid bills and roll over balances.',
        position: 'bottom',
    },
    {
        target: '.stats-pane',
        title: 'Your Bill Summary',
        description: 'Track your total due, what\'s coming in the next 2 weeks, and remaining bills.',
        position: 'top',
    },
    {
        target: '.history-btn',
        title: 'Payment History',
        description: 'View your past payments and archived months here.',
        position: 'bottom',
    },
];

interface TutorialOverlayProps {
    onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState<DOMRect | null>(null);
    const step = tutorialSteps[currentStep];

    if (!step) return null;

    useEffect(() => {
        const updatePosition = () => {
            const el = document.querySelector(step.target);
            if (el) {
                // Smooth scroll to element so it's in view
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                setCoords(el.getBoundingClientRect());
            } else {
                setCoords(null);
            }
        };

        // Initial update
        // Small timeout to allow render/scroll to settle
        const timer = setTimeout(updatePosition, 100);

        // Update on resize
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
            clearTimeout(timer);
        };
    }, [currentStep, step.target]);

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    // Calculate tooltip styles - FIXED POSITION "HUD" STYLE
    const getTooltipStyles = () => {
        // Position the text window in the "safe zone" (bottom-left quadrant of Bills Pane)
        // regardless of where the target element is.
        return {
            position: 'fixed',
            zIndex: 10001,
            top: 'auto',
            bottom: '25%',       // Lower third of the screen
            left: '35%',         // Center of the main "Bills" pane (approx)
            right: 'auto',
            transform: 'translateX(-50%)', // Center horizontally on the 35% mark
        } as React.CSSProperties;
    };

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-backdrop" onClick={handleSkip} />

            {/* Highlight Box */}
            <AnimatePresence>
                {coords && (
                    <motion.div
                        className="tutorial-highlight-box"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                            height: coords.height
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {coords && (
                    <motion.div
                        key={currentStep}
                        className="tutorial-spotlight"
                        style={getTooltipStyles() as any}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="tutorial-content glass-pane">
                            <div className="tutorial-header">
                                <h3>{step.title}</h3>
                                <div className="tutorial-step-info">
                                    <span className="tutorial-step-counter">
                                        {currentStep + 1} / {tutorialSteps.length}
                                    </span>
                                </div>
                            </div>
                            <p>{step.description}</p>
                            <div className="tutorial-actions">
                                <button className="btn-secondary" onClick={handleSkip}>
                                    Skip
                                </button>
                                <button className="btn-primary" onClick={handleNext}>
                                    {currentStep < tutorialSteps.length - 1 ? 'Next' : 'Finish'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TutorialOverlay;
