import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        
        // In development, you might want to report to an error service
        if (process.env.NODE_ENV === 'development') {
            console.error('Error details:', {
                error: error.toString(),
                stack: error.stack,
                componentStack: errorInfo.componentStack
            });
        }
    }

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <h2>Something went wrong</h2>
                    <p>We apologize for the inconvenience. Please restart the application.</p>
                    {process.env.NODE_ENV === 'development' && (
                        <details style={{ marginTop: '1rem', textAlign: 'left' }}>
                            <summary>Error Details</summary>
                            <pre style={{ 
                                backgroundColor: 'var(--color-bg-tertiary)', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                overflow: 'auto',
                                maxWidth: '80vw',
                                fontSize: '0.875rem'
                            }}>
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    )}
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--color-accent-gold)',
                            color: 'black',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
