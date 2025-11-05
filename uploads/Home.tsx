import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to model builder
    setLocation('/model-builder');
  }, [setLocation]);

  return null;
}
