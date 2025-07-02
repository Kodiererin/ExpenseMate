export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  monthYear: string; // Format: "July 2025"
  createdAt: string; // ISO date string
}
