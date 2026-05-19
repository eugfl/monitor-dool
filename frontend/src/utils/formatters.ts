const parseDate = (date: string | Date) => {
  if (date instanceof Date) return date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T12:00:00`);
  }

  return new Date(date);
};

/**
 * Formata uma string de data ISO para o padrao brasileiro: 15 de maio de 2026
 */
export const formatDateLong = (date: string | Date) => {
  return parseDate(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formata uma string de data ISO para o padrao brasileiro curto: 15/05/2026
 */
export const formatDateShort = (date: string | Date) => {
  return parseDate(date).toLocaleDateString('pt-BR');
};

/**
 * Formata numeros grandes (ex: 1234 -> 1,2 mil)
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
