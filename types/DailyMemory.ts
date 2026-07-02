export type CaptureMode = 'overall' | 'hourly';

export interface DailyMemoryEntry {
    date: string;
    overall: string;
    hourlyNotes: Record<string, string>;
    preferredMode: CaptureMode;
    updatedAt: string;
    needsSync: boolean;
    lastSyncedAt: string | null;
}

export interface PendingDayMemoryDeletion {
    date: string;
    deletedAt: string;
}

export type DailyMemoryMap = Record<string, DailyMemoryEntry>;