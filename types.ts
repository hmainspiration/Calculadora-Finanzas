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

export type CalculationMode = 'sundays' | 'weeks' | 'days';

export interface GomerConfig {
  monthlyThreshold: number;
  customCategories: CustomCategory[];
  
  // Visual & Labels (New)
  titheLabel: string;
  titheAcronym: string;
  offeringLabel: string;
  offeringAcronym: string;
  
  // Logic Settings
  calculationMode: CalculationMode; // Default 'sundays'
  directionTithePercentage: number; // Default 10
  enableGomerLogic: boolean; // Toggle for the complex remnant logic
  
  // Visibility Settings
  showLocalAvailable: boolean; // Default false
  showTotalIncome: boolean; // Default true
}

export interface FinancialReport {
  sundaysInMonth: number;
  weeklyThreshold: number;
  totalBase: number;
  totalTithes: number;
  totalOfferings: number;
  totalOthers: number;
  directionTithe: number;
  available: number; // Total available (Net Base + Others)
  ministerAmount: number; // Strictly from Net Base (D+O - 10%)
  remnant: number; // Strictly from Net Base (D+O - 10%)
  isGoalMet: boolean;
  byCategory: Record<string, number>;
}