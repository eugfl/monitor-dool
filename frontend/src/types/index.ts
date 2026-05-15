export interface Materia {
  id: number;
  dool_id: string;
  edicao_id: number;
  titulo: string;
  orgao: string | null;
  tipo_documental: string | null;
  resumo: string | null;
  texto: string;
  url_origem: string;
  data_publicacao: string;
  entidades: Record<string, any>;
  hash_conteudo: string;
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
  orgao: string;
  count: number;
}

export interface DashboardStats {
  total_materias: number;
  total_edicoes: number;
  total_orgaos: number;
  recent_nominations: number;
  recent_edicts: number;
}
