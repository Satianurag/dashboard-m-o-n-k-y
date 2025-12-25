"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Notification } from '@/types/dashboard';

// --- API Functions (Local / No-op) ---

async function fetchNotifications(): Promise<Notification[]> {
    return [];
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
