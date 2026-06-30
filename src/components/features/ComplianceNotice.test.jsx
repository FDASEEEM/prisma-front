import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ComplianceNotice from './ComplianceNotice';

describe('ComplianceNotice', () => {
  it('muestra el motivo de bloqueo normativo', () => {
    render(<ComplianceNotice blocked reason="Informe vencido (Decreto 170/2010)" />);
    expect(screen.getByText(/no conforme a normativa/i)).toBeInTheDocument();
    expect(screen.getByText(/Decreto 170\/2010/)).toBeInTheDocument();
  });

  it('lista las advertencias no bloqueantes', () => {
    render(<ComplianceNotice warnings={['Revisar Q2', 'Revisar Q5']} />);
    expect(screen.getByText('Revisar Q2')).toBeInTheDocument();
    expect(screen.getByText('Revisar Q5')).toBeInTheDocument();
  });

  it('no renderiza nada sin bloqueo ni warnings', () => {
    const { container } = render(<ComplianceNotice />);
    expect(container).toBeEmptyDOMElement();
  });
});
