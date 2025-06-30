
export interface CardioValues {
  duration: string;
  level: string;
  rpm: string;
}

export interface CardioMainValues extends CardioValues {
  cycles: string;
}

export interface CardioProtocolData {
  warmup: CardioValues;
  main: CardioMainValues;
  high: CardioMainValues;
  cooldown: CardioValues;
}

export interface SplitWeights {
  set1: string;
  set2: string;
  set3: string;
}

export interface Exercise {
  name: string;
  hint?: string;
  reps: string;
  weightMode: "standard" | "split";
  weight: string;
  splitWeights: SplitWeights;
  progress: [boolean, boolean, boolean];
  isDone: boolean;
}

export interface WorkoutDay {
  day: string;
  icon: string;
  exercises: Exercise[];
  isCompleted: boolean;
}

export interface WorkoutSettings {
  cardioVisible: boolean;
  sectionsOrder: ('cardio' | 'strength')[];
  activeSplit: '5-day' | '3-day';
  theme: 'light' | 'dark';
  language: 'en' | 'ro';
}

export interface WorkoutPlan {
  userName: string;
  cardio: CardioProtocolData;
  fiveDaySplit: WorkoutDay[];
  threeDaySplit: WorkoutDay[];
  settings: WorkoutSettings;
}

export interface UserProfile {
  firstName: string;
  dateOfBirth?: string;
  dobDay?: string;
  dobMonth?: string;
  dobYear?: string;
  weight?: string;
  height?: string;
  gender?: 'male' | 'female' | 'other';
  email: string | null;
  photoURL: string | null;
  workoutId: string;
  isAdmin?: boolean;
}
