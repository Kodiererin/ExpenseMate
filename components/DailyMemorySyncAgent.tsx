import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
    DEFAULT_DAY_MEMORY_USER_ID,
    getNextDayMemorySyncTime,
    isDailyMemorySyncDue,
    loadLocalDayMemories,
    loadPendingDeletedDayMemories,
    syncPendingDayMemories,
} from '../utils/dayMemoryService';

export default function DailyMemorySyncAgent() {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const syncingRef = useRef(false);

    useEffect(() => {
        let disposed = false;

        const clearScheduledSync = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const runSyncIfDue = async () => {
            if (disposed || syncingRef.current) {
                return;
            }

            syncingRef.current = true;

            try {
                const [entries, deletions] = await Promise.all([
                    loadLocalDayMemories(),
                    loadPendingDeletedDayMemories(),
                ]);

                if (!isDailyMemorySyncDue(entries, deletions)) {
                    return;
                }

                await syncPendingDayMemories(DEFAULT_DAY_MEMORY_USER_ID, entries, deletions);
            } catch (error) {
                console.error('Failed to sync daily memories:', error);
            } finally {
                syncingRef.current = false;
            }
        };

        const scheduleNextSync = () => {
            clearScheduledSync();

            const nextSync = getNextDayMemorySyncTime();
            const delay = Math.max(nextSync.getTime() - Date.now(), 1000);

            timeoutRef.current = setTimeout(async () => {
                await runSyncIfDue();

                if (!disposed) {
                    scheduleNextSync();
                }
            }, delay);
        };

        void runSyncIfDue();
        scheduleNextSync();

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                void runSyncIfDue();
                scheduleNextSync();
            }
        });

        return () => {
            disposed = true;
            clearScheduledSync();
            subscription.remove();
        };
    }, []);

    return null;
}