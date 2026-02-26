import Dashboard from './components/Dashboard';
import Builder from './components/Builder';
import { useCVStore } from './store/cvStore';

import { Toaster } from './components/ui/sonner';

function App() {
  const activeCVId = useCVStore((state) => state.activeCVId);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      {activeCVId ? <Builder /> : <Dashboard />}
      <Toaster />
    </div>
  );
}

export default App;
