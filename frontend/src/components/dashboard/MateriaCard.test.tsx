import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MateriaCard } from './MateriaCard';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('MateriaCard', () => {
  it('shows an honest fallback when orgao is missing', () => {
    render(
      <MateriaCard
        idx={0}
        materia={{
          id: 1,
          materia_id_original: '123',
          titulo: 'Teste de publicação',
          orgao: null,
          tipo_documental: 'DECRETO',
          url: null,
          created_at: '2026-05-20',
        }}
      />,
    );

    expect(screen.getByText('Órgão não identificado')).toBeInTheDocument();
    expect(screen.queryByText('Secretaria Geral')).not.toBeInTheDocument();
  });
});
