import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Materia } from '@/types';
import { formatDateShort } from '@/utils/formatters';

interface MateriaCardProps {
  materia: Materia;
  idx: number;
}

export function MateriaCard({ materia, idx }: MateriaCardProps) {
  const navigate = useNavigate();

  const getReadableType = (type: string) => {
    const types: Record<string, { label: string, desc: string }> = {
      'DECRETO': { label: 'Decreto', desc: 'Ato normativo do Executivo' },
      'PORTARIA': { label: 'Portaria', desc: 'Instrução de serviço/órgão' },
      'EDITAL': { label: 'Edital', desc: 'Comunicação oficial/Resumo' },
      'LICITACAO': { label: 'Licitação', desc: 'Processo de compra pública' },
      'CONTRATO': { label: 'Contrato', desc: 'Acordo firmado' },
      'NOMEACAO': { label: 'Nomeação', desc: 'Provimento de cargo público' },
      'EXONERACAO': { label: 'Exoneração', desc: 'Desligamento de cargo' },
    };
    return types[type] || { 
      label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(), 
      desc: 'Documento oficial' 
    };
  };

  const info = getReadableType(materia.tipo_documental);
  const publicationDate = materia.edicao_data || materia.created_at;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      onClick={() => navigate(`/materia/${materia.id}`)}
      className="p-5 border rounded-lg hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md hover:shadow-primary/5 bg-card hover:bg-primary/[0.01]"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded cursor-pointer">
            {info.label}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium border-l pl-2">
            <Info className="w-3 h-3 text-primary/60" />
            <span>{info.desc}</span>
          </div>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {formatDateShort(publicationDate)}
        </span>
      </div>
      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base leading-snug">
        {materia.titulo}
      </h3>
      <div className="mt-4 flex items-center justify-between border-t pt-4 border-dashed">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground/90 flex items-center gap-1">
            <span className="text-primary opacity-60">🏛️</span> 
            {materia.orgao || 'Secretaria Geral'}
          </span>
        </div>
        <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 cursor-pointer">
          Ver na Íntegra →
        </span>
      </div>
    </motion.div>
  );
}
