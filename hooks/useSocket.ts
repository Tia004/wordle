import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Shared socket instance (recreated only if disconnected)
let sharedSocket: Socket | null = null;

export function useSocket() {
    const [connected, setConnected] = useState(sharedSocket?.connected ?? false);
    // Use state (not just ref) so components re-render when the socket becomes available
    const [socket, setSocket] = useState<Socket | null>(sharedSocket ?? null);

    useEffect(() => {
        // Reuse existing connected socket or create a new one
        if (!sharedSocket || !sharedSocket.connected) {
            sharedSocket?.removeAllListeners();
            sharedSocket?.disconnect();
            sharedSocket = io({
                path: '/socket.io',
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });
        }

        // Expose instance via state so dependents re-render once socket is ready
        setSocket(sharedSocket);

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        // Sync state immediately if already connected
        if (sharedSocket.connected) setConnected(true);

        sharedSocket.on('connect', handleConnect);
        sharedSocket.on('disconnect', handleDisconnect);
        sharedSocket.on('connect_error', (e) => {
            console.error('[socket] connect error:', e.message);
        });

        return () => {
            sharedSocket?.off('connect', handleConnect);
            sharedSocket?.off('disconnect', handleDisconnect);
        };
    }, []);

    return { socket, connected };
}
