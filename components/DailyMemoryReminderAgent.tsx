import { useEffect } from 'react';
import { AppState } from 'react-native';
import { scheduleDayMemoryReminder } from '../utils/dayMemoryReminderService';
import { loadLocalDayMemories } from '../utils/dayMemoryService';

export default function DailyMemoryReminderAgent() {
    useEffect(() => {
        let disposed = false;

        const refreshReminder = async () => {
            if (disposed) {
                return;
            }

            try {
                const entries = await loadLocalDayMemories();
                await scheduleDayMemoryReminder(entries);
            } catch (error) {
                console.error('Failed to refresh day reminder schedule:', error);
            }
        };

        void refreshReminder();

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                void refreshReminder();
            }
        });

        return () => {
            disposed = true;
            subscription.remove();
        };
    }, []);

    return null;
}