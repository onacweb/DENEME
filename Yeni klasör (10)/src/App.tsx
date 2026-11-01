import { useState } from 'react';
import Landing from '@/components/Landing';
import Admin from '@/components/Admin';

export default function App() {
  const [admin, setAdmin] = useState(false);
  if (admin) return <Admin onExit={() => setAdmin(false)} />;
  return <Landing onAdminClick={() => setAdmin(true)} />;
}
