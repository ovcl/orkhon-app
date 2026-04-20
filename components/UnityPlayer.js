'use client';

import { useEffect, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import styles from './UnityPlayer.module.css';

/**
 * UnityPlayer Component
 * Embeds Unity WebGL build into React application
 * Handles communication between Unity and React
 */
export default function UnityPlayer({ onReady, onError }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const {
        unityProvider,
        isLoaded: unityIsLoaded,
        loadingProgression,
        sendMessage,
        addEventListener,
        removeEventListener,
    } = useUnityContext({
        loaderUrl: '/unity-build/Build.loader.js',
        dataUrl: '/unity-build/Build.data.unityweb',
        frameworkUrl: '/unity-build/Build.framework.js.unityweb',
        codeUrl: '/unity-build/Build.wasm.unityweb',
    });

    // Update loading progress
    useEffect(() => {
        setLoadingProgress(loadingProgression * 100);
    }, [loadingProgression]);

    // Handle Unity loaded
    useEffect(() => {
        if (unityIsLoaded) {
            setIsLoaded(true);
            if (onReady) {
                onReady({ sendMessage });
            }
        }
    }, [unityIsLoaded, onReady, sendMessage]);

    // Listen for messages from Unity
    useEffect(() => {
        const handleSiteSelected = (siteId) => {
            console.log('Unity: Site selected', siteId);
            // You can handle site selection here
        };

        const handleAIRequest = (siteId) => {
            console.log('Unity: AI request for site', siteId);
            // Fetch AI description and send back to Unity
            fetchAIDescription(siteId);
        };

        addEventListener('OnSiteSelected', handleSiteSelected);
        addEventListener('OnAIRequest', handleAIRequest);

        return () => {
            removeEventListener('OnSiteSelected', handleSiteSelected);
            removeEventListener('OnAIRequest', handleAIRequest);
        };
    }, [addEventListener, removeEventListener]);

    // Fetch AI description and send to Unity
    const fetchAIDescription = async (siteId) => {
        try {
            const response = await fetch('/api/ai-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });

            const data = await response.json();

            if (response.ok) {
                // Send AI response back to Unity
                sendMessage('AIManager', 'ReceiveAIResponse', data.response);
            } else {
                console.error('AI request failed:', data.error);
                sendMessage('AIManager', 'ReceiveAIError', data.error);
            }
        } catch (error) {
            console.error('Error fetching AI description:', error);
            sendMessage('AIManager', 'ReceiveAIError', error.message);
        }
    };

    return (
        <div className={styles.container}>
            {!isLoaded && (
                <div className={styles.loadingScreen}>
                    <div className={styles.loadingContent}>
                        <div className={styles.spinner}></div>
                        <h2>Loading Virtual Tour...</h2>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <p>{Math.round(loadingProgress)}%</p>
                    </div>
                </div>
            )}

            <Unity
                unityProvider={unityProvider}
                className={styles.unityCanvas}
                style={{
                    width: '100%',
                    height: '100%',
                    visibility: isLoaded ? 'visible' : 'hidden',
                }}
            />
        </div>
    );
}
