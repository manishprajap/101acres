// landing/components/Card.tsx

import React, { ReactNode } from "react";

// Props interface
interface CardProps {
  children: ReactNode;
  className?: string;
}

// Default Card export
export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow p-4 ${className}`}>
      {children}
    </div>
  );
}

// Optional CardContent named export
export function CardContent({ children, className = "" }: CardProps) {
  return <div className={className}>{children}</div>;
}
