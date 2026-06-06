import { Outlet, NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { routes } from '@/router/routes';

export const Layout = () => {
  return (
    <div className="min-h-screen">
      <nav className="flex gap-1 border-b bg-background px-4 py-3">
        {routes.map(({ path, label }) => (
          <Button key={path} asChild variant="ghost">
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                isActive ? 'bg-muted font-semibold' : 'text-muted-foreground'
              }
            >
              {label}
            </NavLink>
          </Button>
        ))}
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};
