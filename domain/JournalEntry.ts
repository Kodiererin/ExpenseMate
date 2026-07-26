export interface JournalEntry {
    id: string;
    date: string; // Format: "YYYY-MM-DD"
    text: string; // What the user learnt / did / achieved
    mood?: string; // Optional mood emoji
    createdAt: string; // ISO date string
}
