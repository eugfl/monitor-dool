export type EntityValue =
  | string
  | number
  | boolean
  | null
  | EntityValue[]
  | { [key: string]: EntityValue };

export interface Materia {
  id: number;
  materia_id_original: string;
  titulo: string;
  orgao: string | null;
  tipo_documental: string;
  url: string | null;
  created_at: string;
  edicao_id?: number;
  texto?: string;
  entidades?: Record<string, EntityValue>;
  updated_at?: string;
}

export interface Edicao {
  id: number;
  numero: number;
  data: string;
  tipo: string | null;
  total_materias: number;
  created_at: string;
  url_original?: string | null;
  updated_at?: string | null;
}

export interface StatsOrgao {
  label: string;
  value: number;
}

export interface DashboardStats {
  total_materias: number;
  total_edicoes: number;
  total_orgaos: number;
  recent_nominations: number;
  recent_edicts: number;
}
