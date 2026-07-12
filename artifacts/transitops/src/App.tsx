import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Shell } from '@/components/shell';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Fleet from '@/pages/fleet';
import Drivers from '@/pages/drivers';
import Trips from '@/pages/trips';
import Maintenance from '@/pages/maintenance';
import FuelExpenses from '@/pages/fuel-expenses';
import Analytics from '@/pages/analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/drivers" component={Drivers} />
        <Route path="/trips" component={Trips} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/fuel-expenses" component={FuelExpenses} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/">
          {() => {
            window.location.replace('/dashboard');
            return null;
          }}
        </Route>
        <Route>
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
            <h1 className="text-4xl font-bold font-mono text-primary">404</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-sm">Sector Not Found</p>
          </div>
        </Route>
      </Switch>
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
