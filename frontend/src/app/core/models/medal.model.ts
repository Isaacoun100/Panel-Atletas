export type MedalType = 'gold' | 'silver' | 'bronze';

export interface Medal {
  id_medal: string;
  id_user: string;
  competition_name: string;
  year: number;
  medal_type: MedalType;
  users_profiles?: {
    name: string;
    first_last_name: string;
  };
}