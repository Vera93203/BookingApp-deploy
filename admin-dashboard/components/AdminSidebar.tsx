'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  LayoutDashboard, Users, Building2, UserPlus, CalendarCheck,
  LogOut, Shield, ChevronLeft, Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partners', label: 'Partners', icon: UserPlus },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-primary-dark min-h-screen flex flex-col transition-all duration-200`}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">UCLICK-Y</span>
              <span className="text-gray-400 text-xs block">Admin</span>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive ? 'bg-accent text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <item.icon size={20} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={() => { Cookies.remove('admin_token'); router.push('/login'); }}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
