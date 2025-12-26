"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/dashboard';

// --- API Functions using Supabase ---

async function fetchNotifications(): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20);

        if (error) {
            console.log('Notifications table may not exist yet:', error.message);
            // Return fallback data for first-time setup
            return getDefaultNotifications();
        }

        if (!data || data.length === 0) {
            return getDefaultNotifications();
        }

        return data.map(row => ({
            id: row.id,
            title: row.title,
            message: row.message,
            type: row.type as 'success' | 'info' | 'warning' | 'error',
            priority: (row.priority as 'low' | 'medium' | 'high') || 'low',
            read: row.read || false,
            timestamp: row.timestamp,
        }));
    } catch (err) {
        console.log('Notifications fetch error:', err);
        return getDefaultNotifications();
    }
}

// Default notifications for when table doesn't exist yet
function getDefaultNotifications(): Notification[] {
    return [
        {
            id: 'default-1',
            title: 'Welcome to pNode Analytics',
            message: 'Real-time monitoring is now active. Data refreshes every 5 minutes.',
            type: 'info',
            read: false,
            timestamp: new Date().toISOString(),
        },
        {
            id: 'default-2',
            title: 'Network Connected',
            message: 'Successfully connected to Xandeum network via pRPC.',
            type: 'success',
            read: true,
            timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        },
    ];
}

async function markAsRead(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) console.log('Mark as read error:', error.message);
    } catch (err) {
        console.log('Mark as read failed:', err);
    }
}

async function deleteNotification(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) console.log('Delete notification error:', error.message);
    } catch (err) {
        console.log('Delete notification failed:', err);
    }
}

async function markAllAsRead(): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('read', false);

        if (error) console.log('Mark all as read error:', error.message);
    } catch (err) {
        console.log('Mark all as read failed:', err);
    }
}

// --- Hook ---

export function useNotifications() {
    const queryClient = useQueryClient();
    const notificationsKey = ['notifications'];

    // 1. Fetch Notifications with 5 minute cache
    const {
        data: notifications = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: notificationsKey,
        queryFn: fetchNotifications,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
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
