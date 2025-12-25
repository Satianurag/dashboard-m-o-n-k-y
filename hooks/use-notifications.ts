'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/dashboard';

// Query key
const notificationsKey = ['notifications'] as const;

// Fetch notifications from Supabase
async function fetchNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .is('user_id', null) // System-wide notifications only
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type as Notification['type'],
        priority: row.priority as Notification['priority'],
        read: row.read,
        timestamp: row.created_at,
    }));
}

// Mark notification as read
async function markAsRead(id: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
}

// Delete notification
async function deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete notification: ${error.message}`);
    }
}

/**
 * TanStack Query hook for real-time notifications
 * 
 * Features:
 * - Fetches from Supabase with caching
 * - Real-time subscription for instant updates
 * - Optimistic updates for mark as read/delete
 * - Auto-refetch on window focus
 * - Background polling fallback
 */
export function useNotifications() {
    const queryClient = useQueryClient();

    // Query for notifications
    const query = useQuery({
        queryKey: notificationsKey,
        queryFn: fetchNotifications,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute as backup
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // Mark as read mutation with optimistic update
    const markAsReadMutation = useMutation({
        mutationFn: markAsRead,
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationsKey });

            // Snapshot previous value
            const previous = queryClient.getQueryData<Notification[]>(notificationsKey);

            // Optimistically update to mark as read
            queryClient.setQueryData<Notification[]>(notificationsKey, (old) =>
                old?.map(n => n.id === id ? { ...n, read: true } : n)
            );

            return { previous };
        },
        onError: (err, id, context) => {
            // Rollback on error
            if (context?.previous) {
                queryClient.setQueryData(notificationsKey, context.previous);
            }
        },
        onSettled: () => {
            // Always refetch after mutation
            queryClient.invalidateQueries({ queryKey: notificationsKey });
        },
    });

    // Delete mutation with optimistic update
    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: notificationsKey });
            const previous = queryClient.getQueryData<Notification[]>(notificationsKey);

            // Optimistically remove notification
            queryClient.setQueryData<Notification[]>(notificationsKey, (old) =>
                old?.filter(n => n.id !== id)
            );

            return { previous };
        },
        onError: (err, id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(notificationsKey, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKey });
        },
    });

    // Real-time subscription for instant updates
    useEffect(() => {
        const channel = supabase
            .channel('notifications_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'notifications',
                    filter: 'user_id=is.null', // System notifications only
                },
                (payload) => {
                    console.log('Notification change detected:', payload);
                    // Invalidate and refetch when changes occur
                    queryClient.invalidateQueries({ queryKey: notificationsKey });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time notifications subscribed');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return {
        notifications: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        markAsRead: markAsReadMutation.mutate,
        deleteNotification: deleteMutation.mutate,
        isMarkingAsRead: markAsReadMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
