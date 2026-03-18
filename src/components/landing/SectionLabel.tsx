import React from 'react';

interface SectionLabelProps {
  text: string;
  className?: string;
}

const SectionLabel: React.FC<SectionLabelProps> = ({ text, className = '' }) => (
  <p className={`font-pixel text-[8px] text-muted-foreground tracking-widest mb-4 ${className}`}>
    // {text}
  </p>
);

export default SectionLabel;
