// components/BodyWrapper.tsx
'use client';

import React, { useEffect, useState } from 'react';

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); 
  }, []);

  if (!mounted) return null; 

  return (
    <body className="league_spartan_dd95a8dc-module__NbvN5a__variable font-body text-base text-black">
      {children}
    </body>
  );
}
