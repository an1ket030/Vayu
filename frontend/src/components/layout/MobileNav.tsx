import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Navigation, Activity, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

const MobileNav = () => {
  const items = [
    { icon: LayoutDashboard, href: '/' },
    { icon: Map, href: '/map' },
    { icon: Navigation, href: '/route' },
    { icon: Activity, href: '/exposure' },
    { icon: Calendar, href: '/forecast' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-6 z-[2000]">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) => cn(
            "p-2 rounded-lg transition-colors",
            isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
          )}
        >
          <item.icon size={20} />
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
