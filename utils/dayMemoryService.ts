import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../constants/firebase';
import { DailyMemoryMap, PendingDayMemoryDeletion } from '../types/DailyMemory';

export const DAILY_MEMORY_STORAGE_KEY = '@expensemate_daily_memories_v1';
export const DAILY_MEMORY_DELETIONS_KEY = '@expensemate_daily_memory_deletions_v1';
export const DAILY_MEMORY_SYNC_HOUR = 23;
export const DEFAULT_DAY_MEMORY_USER_ID = 'mock_user_id';

const DAILY_MEMORY_COLLECTION = 'dailyMemories';

export const HOURLY_SLOTS = [
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
];

const startOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};

const getDailyMemoryDocId = (userId: string, dateKey: string) => `${userId}_${dateKey}`;

export const buildEmptyHourlyNotes = () =>
    HOURLY_SLOTS.reduce<Record<string, string>>((accumulator, slot) => {
        accumulator[slot] = '';
        return accumulator;
    }, {});

export const formatStorageDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatFriendlyDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

export const formatSlotLabel = (slot: string) => {
    const [hours, minutes] = slot.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${normalizedHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const loadLocalDayMemories = async (): Promise<DailyMemoryMap> => {
    try {
        const stored = await AsyncStorage.getItem(DAILY_MEMORY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Failed to load local day memories:', error);
        return {};
    }
};

export const saveLocalDayMemories = async (entries: DailyMemoryMap) => {
    await AsyncStorage.setItem(DAILY_MEMORY_STORAGE_KEY, JSON.stringify(entries));
};

export const loadPendingDeletedDayMemories = async (): Promise<PendingDayMemoryDeletion[]> => {
    try {
        const stored = await AsyncStorage.getItem(DAILY_MEMORY_DELETIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load pending day memory deletions:', error);
        return [];
    }
};

export const savePendingDeletedDayMemories = async (deletions: PendingDayMemoryDeletion[]) => {
    await AsyncStorage.setItem(DAILY_MEMORY_DELETIONS_KEY, JSON.stringify(deletions));
};

export const queueDeletedDayMemory = async (dateKey: string) => {
    const deletions = await loadPendingDeletedDayMemories();
    const remaining = deletions.filter((entry) => entry.date !== dateKey);
    remaining.push({
        date: dateKey,
        deletedAt: new Date().toISOString(),
    });
    await savePendingDeletedDayMemories(remaining);
};

export const removePendingDeletedDayMemory = async (dateKey: string) => {
    const deletions = await loadPendingDeletedDayMemories();
    const nextDeletions = deletions.filter((entry) => entry.date !== dateKey);
    await savePendingDeletedDayMemories(nextDeletions);
};

export const getNextDayMemorySyncTime = (now: Date = new Date()) => {
    const next = new Date(now);
    next.setHours(DAILY_MEMORY_SYNC_HOUR, 0, 0, 0);

    if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1);
    }

    return next;
};

export const isDailyMemorySyncDue = (
    entries: DailyMemoryMap,
    deletions: PendingDayMemoryDeletion[],
    now: Date = new Date()
) => {
    const todayStart = startOfDay(now);
    const pendingEntries = Object.values(entries).filter((entry) => entry.needsSync);

    if (pendingEntries.length === 0 && deletions.length === 0) {
        return false;
    }

    if (now.getHours() >= DAILY_MEMORY_SYNC_HOUR) {
        return true;
    }

    const hasMissedEntryWindow = pendingEntries.some((entry) => new Date(entry.updatedAt) < todayStart);
    const hasMissedDeletionWindow = deletions.some((entry) => new Date(entry.deletedAt) < todayStart);

    return hasMissedEntryWindow || hasMissedDeletionWindow;
};

export const syncPendingDayMemories = async (
    userId: string = DEFAULT_DAY_MEMORY_USER_ID,
    sourceEntries?: DailyMemoryMap,
    sourceDeletions?: PendingDayMemoryDeletion[]
) => {
    const entries = sourceEntries ?? (await loadLocalDayMemories());
    const deletions = sourceDeletions ?? (await loadPendingDeletedDayMemories());
    const pendingEntries = Object.entries(entries).filter(([, entry]) => entry.needsSync);

    if (pendingEntries.length === 0 && deletions.length === 0) {
        return {
            syncedCount: 0,
            deletedCount: 0,
            updatedEntries: entries,
        };
    }

    const batch = writeBatch(db);
    const syncedAt = new Date().toISOString();

    pendingEntries.forEach(([dateKey, entry]) => {
        batch.set(doc(db, DAILY_MEMORY_COLLECTION, getDailyMemoryDocId(userId, dateKey)), {
            userId,
            date: dateKey,
            overall: entry.overall,
            hourlyNotes: entry.hourlyNotes,
            preferredMode: entry.preferredMode,
            updatedAt: entry.updatedAt,
            syncedAt,
        });
    });

    deletions.forEach((entry) => {
        batch.delete(doc(db, DAILY_MEMORY_COLLECTION, getDailyMemoryDocId(userId, entry.date)));
    });

    await batch.commit();

    const updatedEntries = { ...entries };

    pendingEntries.forEach(([dateKey, entry]) => {
        updatedEntries[dateKey] = {
            ...entry,
            needsSync: false,
            lastSyncedAt: syncedAt,
        };
    });

    await saveLocalDayMemories(updatedEntries);
    await savePendingDeletedDayMemories([]);

    return {
        syncedCount: pendingEntries.length,
        deletedCount: deletions.length,
        updatedEntries,
    };
};