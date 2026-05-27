export type DniType = 'cedula' | 'dimex' | 'pasaporte';
export type Sex = 'male' | 'female';
export type UserRole = 'admon' | 'athlete';

export interface UserProfile {
  id_user: string;
  name: string;
  first_last_name: string;
  second_last_name: string;
  dni_type: DniType;
  dni: string;
  birth_date: string;
  sex: Sex;
  profile_image_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}