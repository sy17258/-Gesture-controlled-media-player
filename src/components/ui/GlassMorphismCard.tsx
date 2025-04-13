
import React, { ReactNode } from 'react';

interface GlassMorphismCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassMorphismCard = ({ 
  children, 
  className = '',
  hoverEffect = false
}: GlassMorphismCardProps) => {
  return (
    <div 
      className={`glass-morphism rounded-lg p-6 transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-[0_8px_20px_-2px_rgba(0,0,0,0.5)] hover:bg-white/10' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassMorphismCard;
