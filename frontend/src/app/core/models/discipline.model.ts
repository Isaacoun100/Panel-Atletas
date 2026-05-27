
export type DisciplineType = 'sport' | 'recreational';

export interface Discipline {
  id_discipline: number;
  name: string;
  discipline_type: DisciplineType;
  is_active: boolean;
}

export interface UserDiscipline {
  id_user_discipline: number;
  fk_user: string;
  fk_discipline: number;
  is_representative: boolean;
  disciplines?: {
    name: string;
    discipline_type: DisciplineType;
  };
}