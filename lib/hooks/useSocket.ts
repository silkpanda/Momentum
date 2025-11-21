// lib/hooks/useSocket.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, SocketEventName } from '../socket';

/**
 * Custom hook for WebSocket functionality
 * Automatically connects on mount and disconnects on unmount
 */
export function useSocket() {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = getSocket();

        // Cleanup on unmount
        return () => {
            // Note: We don't disconnect here as other components might be using it
            // The socket will disconnect when the user navigates away or closes the tab
        };
    }, []);

    return socketRef.current;
}

/**
 * Custom hook to listen to a specific WebSocket event
 * @param eventName - The name of the event to listen to
 * @param callback - The callback function to execute when the event is received
 */
export function useSocketEvent<T = any>(
    eventName: SocketEventName | string,
    callback: (data: T) => void
) {
    const socket = useSocket();
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!socket) return;

        const handler = (data: T) => {
            callbackRef.current(data);
        };

        // Subscribe to event
        socket.on(eventName, handler);

        // Cleanup: unsubscribe from event
        return () => {
            socket.off(eventName, handler);
        };
    }, [socket, eventName]);
}

/**
 * Custom hook to emit WebSocket events
 */
export function useSocketEmit() {
    const socket = useSocket();

    const emit = useCallback(
        (eventName: string, data?: any) => {
            if (socket?.connected) {
                socket.emit(eventName, data);
            } else {
                console.warn('[WebSocket] Cannot emit event - socket not connected:', eventName);
            }
        },
        [socket]
    );

    return emit;
}

/**
 * Custom hook to get socket connection status
 */
export function useSocketStatus() {
    const socket = useSocket();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        setIsConnected(socket.connected);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    return isConnected;
}

// Import useState for useSocketStatus
import { useState } from 'react';
