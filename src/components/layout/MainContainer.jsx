/**
 * MainContainer Component
 * Contenedor principal con SideNav y TopNav
 * Layout: SideNav (fixed left) + TopNav (sticky top) + Main Content
 */

import React from 'react';
import SideNav from './SideNav';
import TopNav from './TopNav';

const MainContainer = ({ children, title = 'Aula Orgánica' }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* SideNav - Fixed left sidebar (hidden on mobile) */}
      <SideNav />

      {/* Main column offset by sidebar width so sticky TopNav doesn't cover SideNav */}
      <div className="flex flex-col min-h-screen md:ml-72">
        {/* TopNav - Sticky top */}
        <TopNav title={title} />

        {/* Main Content */}
        <main className="flex-1 pt-4 pb-8 px-6 md:px-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainContainer;
