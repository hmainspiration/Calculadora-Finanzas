export enum TransactionType {
  TITHE = 'DIEZMO',
  OFFERING = 'OFRENDA',
  OTHER = 'OTRO'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryName?: string; // For custom categories or sub-types
  date: string; // ISO String
  note?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
}

export interface GomerConfig {
  monthlyThreshold: number;
  customCategories: CustomCategory[];
  // Advanced Settings
  directionTithePercentage: number; // Default 10
  enableGomerLogic: boolean; // Toggle for the complex remnant logic
}

export interface FinancialReport {
  sundaysInMonth: number;
  weeklyThreshold: number;
  totalBase: number;
  totalTithes: number;
  totalOfferings: number;
  totalOthers: number;
  directionTithe: number;
  available: number;
  ministerAmount: number;
  remnant: number;
  isGoalMet: boolean;
  byCategory: Record<string, number>;
}