'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type ParamValue = string | string[] | number | boolean | null;

interface UseURLStateOptions {
    shallow?: boolean;
}

/**
 * Hook to sync state with URL query parameters
 * Enables shareable filter URLs
 */
export function useURLState<T extends Record<string, ParamValue>>(
    initialState: T,
    options: UseURLStateOptions = {}
): [T, (updates: Partial<T>) => void, () => void] {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { shallow = true } = options;

    // Parse URL params to state
    const parseParams = useCallback((): T => {
        const parsed: Record<string, ParamValue> = { ...initialState };

        for (const key of Object.keys(initialState)) {
            const value = searchParams.get(key);
            const allValues = searchParams.getAll(key);

            if (allValues.length > 1) {
                // Multiple values = array
                parsed[key] = allValues;
            } else if (value !== null) {
                // Check if it should be a number
                if (typeof initialState[key] === 'number') {
                    parsed[key] = Number(value);
                } else if (typeof initialState[key] === 'boolean') {
                    parsed[key] = value === 'true';
                } else if (Array.isArray(initialState[key])) {
                    parsed[key] = value ? value.split(',') : [];
                } else {
                    parsed[key] = value;
                }
            }
        }

        return parsed as T;
    }, [searchParams, initialState]);

    const [state, setState] = useState<T>(parseParams);

    // Update state when URL changes
    useEffect(() => {
        setState(parseParams());
    }, [parseParams]);

    // Update URL when state changes
    const updateState = useCallback((updates: Partial<T>) => {
        const newState = { ...state, ...updates };
        setState(newState);

        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(newState)) {
            if (value === null || value === undefined || value === '') continue;
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    params.set(key, value.join(','));
                }
            } else if (typeof value === 'boolean') {
                if (value) params.set(key, 'true');
            } else if (typeof value === 'number') {
                if (value !== 0) params.set(key, String(value));
            } else {
                params.set(key, String(value));
            }
        }

        const queryString = params.toString();
        const newURL = queryString ? `${pathname}?${queryString}` : pathname;

        if (shallow) {
            window.history.replaceState(null, '', newURL);
        } else {
            router.push(newURL);
        }
    }, [state, pathname, router, shallow]);

    // Clear all filters
    const clearState = useCallback(() => {
        setState(initialState);
        window.history.replaceState(null, '', pathname);
    }, [initialState, pathname]);

    return [state, updateState, clearState];
}

/**
 * Save filter presets to localStorage
 */
export function useSavedFilters<T>(key: string) {
    const [presets, setPresets] = useState<Array<{ name: string; filters: T }>>([]);

    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setPresets(JSON.parse(saved));
            } catch {
                // Invalid JSON, ignore
            }
        }
    }, [key]);

    const savePreset = (name: string, filters: T) => {
        const updated = [...presets, { name, filters }];
        setPresets(updated);
        localStorage.setItem(key, JSON.stringify(updated));
    };

    const deletePreset = (name: string) => {
        const updated = presets.filter(p => p.name !== name);
        setPresets(updated);
        localStorage.setItem(key, JSON.stringify(updated));
    };

    const loadPreset = (name: string): T | null => {
        const preset = presets.find(p => p.name === name);
        return preset?.filters || null;
    };

    return { presets, savePreset, deletePreset, loadPreset };
}
