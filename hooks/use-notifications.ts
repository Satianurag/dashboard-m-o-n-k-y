"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Notification } from '@/types/dashboard';

// --- API Functions (Local / No-op) ---

async function fetchNotifications(): Promise<Notification[]> {
    return [
        {
            id: '1',
            title: 'Daily Rewards Distributed',
            message: 'You have received 45.2 XAND for 99.8% uptime yesterday.',
            type: 'success',
            read: false,
            timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
        },
        {
            id: '2',
            title: 'Node Update Available',
            message: 'pNode v0.8.2 is now available. Update recommended for optimal performance.',
            type: 'info',
            read: false,
            timestamp: new Date(Date.now() - 3600 * 5000).toISOString(), // 5 hours ago
        },
        {
            id: '3',
            title: 'Network Alert',
            message: 'High latency detected in EU-West region due to increased traffic.',
            type: 'warning',
            read: true,
            timestamp: new Date(Date.now() - 86400 * 1000).toISOString(), // 1 day ago
        },
        {
            id: '4',
            title: 'New Peer Connected',
            message: 'Your node just peered with Node #8821 (Xandeum Foundation).',
            type: 'success',
            read: true,
            timestamp: new Date(Date.now() - 86400 * 2000).toISOString(), // 2 days ago
        },
        {
            id: '5',
            title: 'Storage Goal Met',
            message: 'Your allocated storage usage has reached 50%.',
            type: 'info',
            read: true,
            timestamp: new Date(Date.now() - 86400 * 4000).toISOString(), // 4 days ago
        }
    ];
}

async function markAsRead(id: string): Promise<void> {
    // No-op
}

async function deleteNotification(id: string): Promise<void> {
    // No-op
}

async function markAllAsRead(): Promise<void> {
    // No-op
}

// --- Hook ---

export function useNotifications() {
    const queryClient = useQueryClient();
    const notificationsKey = ['notifications'];

    // 1. Fetch Notifications
    const {
        data: notifications = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: notificationsKey,
        queryFn: fetchNotifications,
    });

    // 2. Mutations
    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKey });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            toast.success('Notification deleted');
            queryClient.invalidateQueries({ queryKey: notificationsKey });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            toast.success('All marked as read');
            queryClient.invalidateQueries({ queryKey: notificationsKey });
        },
    });

    // Derived state
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        notifications,
        isLoading,
        error,
        unreadCount,
        markAsRead: (id: string) => markReadMutation.mutate(id),
        deleteNotification: (id: string) => deleteMutation.mutate(id),
        markAllAsRead: () => markAllReadMutation.mutate(),
    };
}
