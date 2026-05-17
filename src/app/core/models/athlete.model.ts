// src/app/core/models/athlete.model.ts

export type DistrictOfResidence = 'san_pedro' | 'sabanilla' | 'mercedes' | 'san_rafael' | 'other';
export type SatisfactionLevel = 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied';
export type FacilitySatisfactionLevel = 'yes' | 'no' | 'partial';
export type DisabilityType = 'physical' | 'cognitive';

export interface Athlete {
  id_user: string;
  phone: string;
  district_of_residence: DistrictOfResidence;
  legal_guardian_name: string | null;
  legal_guardian_phone: string | null;
  nacional_games_participation: boolean;
  international_games_participation: boolean;
  weekly_exercise: number;
  has_family_support: boolean;
  satisfaction_level: SatisfactionLevel;
  has_family_in_committee: boolean;
  has_previous_committee: boolean;
  previous_committee_name: string | null;
  is_club_member: boolean;
  club_name: string | null;
  facility_satisfaction_level: FacilitySatisfactionLevel;
  has_disability: boolean;
  disability_type: DisabilityType | null;
  disability_description: string | null;
  has_functional_classification: boolean;
  classification_category: string | null;
  classification_document_url: string | null;
  accepts_data_usage: boolean;
  accepts_info_accuracy: boolean;
}