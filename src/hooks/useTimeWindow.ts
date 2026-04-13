import { useState, useEffect } from 'react';
import { isSubmissionWindow } from '../utils/date';

export function useTimeWindow(): boolean {
  const [isOpen, setIsOpen] = useState<boolean>(isSubmissionWindow);

  useEffect(() => {
    const id = setInterval(() => {
      setIsOpen(isSubmissionWindow());
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  return isOpen;
}
