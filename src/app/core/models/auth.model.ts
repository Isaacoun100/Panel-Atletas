export interface UpdateUserResponse {
  id: string;
  email: string;
  app_metadata: { role: string; is_active: boolean };
}

export interface SignInResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
    app_metadata: {
      role: string;
      is_active?: boolean;
    };
  };
}

export interface SignUpResponse {
  access_token?: string;
  user: {
    id: string;
    email: string;
  };
}

export type RegisterUserDniType = 'cedula' | 'dimex' | 'pasaporte';
export type RegisterUserSex = 'male' | 'female';

export interface AdminRegisterUserRequest {
  email: string;
  password: string;
  name: string;
  first_last_name: string;
  second_last_name?: string;
  dni_type: RegisterUserDniType;
  dni: string;
  birth_date: string;
  sex: RegisterUserSex;
}

export interface AdminRegisterUserResponse {
  success: boolean;
  user_id?: string;
  id_user?: string;
  userId?: string;
  user?: {
    id?: string;
  };
  email: string;
}

export interface AdminRegisterAthleteRequest {
  email: string;
  password: string;
  name: string;
  first_last_name: string;
  second_last_name?: string;
  dni_type: RegisterUserDniType;
  dni: string;
  birth_date: string;
  sex: RegisterUserSex;
  phone: string;
  district_of_residence: string;
  legal_guardian_name: string | null;
  legal_guardian_phone: string | null;
  nacional_games_participation: boolean;
  international_games_participation: boolean;
  weekly_exercise: number;
  has_family_support: boolean;
  satisfaction_level: string;
  has_family_in_committee: boolean;
  has_previous_committee: boolean;
  previous_committee_name: string | null;
  is_club_member: boolean;
  club_name: string | null;
  facility_satisfaction_level: string;
  has_disability: boolean;
  disability_type: string | null;
  disability_description: string | null;
  has_functional_classification: boolean;
  classification_category: string | null;
  classification_document_url: string | null;
  accepts_data_usage: boolean;
  accepts_info_accuracy: boolean;
  disciplines: Array<{
    id: number;
    is_representative: boolean;
  }>;
  medals: Array<{
    competition_name: string;
    year: number;
    medal_type: string;
  }>;
}

export interface AdminRegisterAthleteResponse {
  success: boolean;
  user_id: string;
  email: string;
}
