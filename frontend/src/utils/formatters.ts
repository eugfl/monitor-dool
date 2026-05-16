/**
 * Formata uma string de data ISO para o padrão brasileiro: 15 de Maio de 2026
 */
export const formatDateLong = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Formata uma string de data ISO para o padrão brasileiro curto: 15/05/2026
 */
export const formatDateShort = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

/**
 * Formata números grandes (ex: 1234 -> 1.2k)
 */
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

/**
 * Capitaliza a primeira letra de uma string
 */
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
