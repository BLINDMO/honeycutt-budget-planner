import React from 'react';
import { motion } from 'framer-motion';
import './UpdateNotification.css';

interface UpdateNotificationProps {
    version: string;
    downloaded: boolean;
    downloadProgress?: number;
    onDownload?: () => void;
    onInstall: () => void;
    onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
    version,
    downloaded,
    downloadProgress,
    onDownload,
    onInstall,
    onDismiss
}) => {
    return (
        <motion.div
            className="update-notification glass-pane"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="update-icon">🎉</div>
            <div className="update-content">
                <h4>Update Available</h4>
                <p>Version {version} is ready</p>
                {downloadProgress !== undefined && downloadProgress < 100 && (
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${downloadProgress}%` }}
                        />
                    </div>
                )}
            </div>
            <div className="update-actions">
                <button
                    onClick={onDismiss}
                    className="btn-secondary btn-sm"
                >
                    Later
                </button>
                {!downloaded && onDownload && (
                    <button
                        onClick={onDownload}
                        className="btn-primary btn-sm"
                    >
                        Download
                    </button>
                )}
                {downloaded && (
                    <button
                        onClick={onInstall}
                        className="btn-primary btn-sm"
                    >
                        Install & Restart
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default UpdateNotification;
