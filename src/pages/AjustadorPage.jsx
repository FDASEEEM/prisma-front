/**
 * AjustadorPage
 * Página del Ajustador IA
 */

import React from 'react';
import { MainContainer, Card } from '../components';

const AjustadorPage = () => {
  return (
    <MainContainer title="Ajustador IA">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="font-headline text-4xl text-on-surface tracking-tight">
            Ajustador IA
          </h1>
          <p className="text-on-surface-variant mt-2">Adapta tu contenido con inteligencia artificial</p>
        </header>

        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-md border border-outline-variant/15">
          <p className="text-sm text-on-surface-variant">
            Los componentes del Ajustador IA se agregarán en los siguientes commits
          </p>
        </div>
      </div>
    </MainContainer>
  );
};

export default AjustadorPage;
