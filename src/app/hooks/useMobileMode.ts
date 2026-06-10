import { useEffect, useState } from 'react';

function getIsMobile(): boolean {
  return (
    ('ontouchstart' in window) ||
    window.innerWidth < 640
  );
}

export function useMobileMode() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(getIsMobile());

    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
