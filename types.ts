export interface Player {
  id: string;
  name: string;
  number: number;
}

export interface Fixture {
  id: string;
  home: Player;
  away: Player | null; // Null implies a "Bye" or waiting
}

export enum AppStage {
  INPUT = 'INPUT',
  DRAW = 'DRAW',
  FINISHED = 'FINISHED'
}

export interface DrawState {
  upcomingPlayers: Player[];
  fixtures: Fixture[];
  currentHomePlayer: Player | null; // For the current active fixture building
  lastDrawnNumber: number | null; // To trigger animation
}