import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearAuthSession, getUser } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Calendar,
  ClipboardList,
  FolderOpen,
  Users,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Shield,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getUser());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setStats({
      total_users: 0,
      students: 0,
      faculty: 0,
      admins: 1,
    });

    const fetchStats = async () => {
      try {
        if (user.role === 'admin') {
          try {
            const data = await api('/admin/stats');
            setStats(data);
          } catch (err) {
            if (err.status === 401) return;
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    return user?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getQuickActions = () => {
    const actions = [
      {
        label: 'Timetable',
        href: '/timetable',
        icon: Calendar,
        desc: 'View your class schedule'
      },
    ];

    if (user?.role === 'faculty') {
      actions.push(
        { label: 'Attendance', href: '/attendance', icon: ClipboardList, desc: 'Mark attendance' },
        { label: 'Materials', href: '/materials', icon: FolderOpen, desc: 'Upload study materials' }
      );
    }

    if (user?.role === 'student') {
      actions.push({ label: 'Materials', href: '/materials', icon: FolderOpen, desc: 'Access study materials' });
    }

    if (user?.role === 'admin') {
      actions.push({ label: 'Manage Users', href: '/admin/users', icon: Users, desc: 'Add, edit, or remove users' });
    }

    return actions;
  };

  const getStatCards = () => {
    const baseStats = stats || { total_users: 0, students: 0, faculty: 0, admins: 1 };

    if (user?.role === 'admin') {
      return [
        { label: 'Total Users', value: baseStats.total_users || 0, icon: Users },
        { label: 'Students', value: baseStats.students || 0, icon: GraduationCap },
        { label: 'Faculty', value: baseStats.faculty || 0, icon: Shield },
        { label: 'Admins', value: baseStats.admins || 1, icon: CheckCircle },
      ];
    }

    if (user?.role === 'student') {
      return [
        { label: 'Semester', value: `${user?.semester || '-'}`, icon: BookOpen },
        { label: 'Section', value: user?.section || '-', icon: Users },
        { label: 'Status', value: 'Active', icon: CheckCircle },
        { label: 'Materials', value: 'View', icon: FolderOpen },
      ];
    }

    if (user?.role === 'faculty') {
      return [
        { label: 'Department', value: user?.department || 'CSE', icon: Shield },
        { label: 'Status', value: 'Active', icon: CheckCircle },
        { label: 'Attendance', value: 'Mark', icon: ClipboardList },
        { label: 'Materials', value: 'Upload', icon: FolderOpen },
      ];
    }

    return [];
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {getDisplayName()}!
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'student' && `Semester ${user?.semester} • Section ${user?.section}`}
            {user?.role === 'faculty' && `Faculty • ${user?.department || 'Computer Science & Engineering'}`}
            {user?.role === 'admin' && 'System Administrator'}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getStatCards().map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-[#1266f1]/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-[#1266f1]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {getQuickActions().map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#1266f1] hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="h-10 w-10 rounded-lg bg-[#1266f1]/10 flex items-center justify-center flex-shrink-0">
                <action.icon className="h-5 w-5 text-[#1266f1]" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="border-[#1266f1]/30 bg-[#1266f1]/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-[#1266f1] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Welcome to Academic Portal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your centralized dashboard for managing academic activities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
