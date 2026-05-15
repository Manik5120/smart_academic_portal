import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Mail,
  Shield,
  GraduationCap,
  Briefcase,
  Users,
  X,
  Check,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { adminService } from '../services/admin';
import { getUser } from '../lib/api';

export default function AdminUsersPage() {
  const currentUser = getUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    semester: '1',
    section: 'A',
    department: '',
  });

  // Fetch users with all filters
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (semesterFilter) params.semester = parseInt(semesterFilter);
      if (sectionFilter) params.section = sectionFilter;

      const data = await adminService.getUsers(params);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when any filter changes
  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, semesterFilter, sectionFilter]);

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'student',
      semester: '1',
      section: 'A',
      department: '',
    });
    setEditingUser(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const openEditForm = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      semester: user.semester?.toString() || '1',
      section: user.section || 'A',
      department: user.department || '',
    });
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, {
          full_name: formData.full_name,
          semester: formData.role === 'student' ? parseInt(formData.semester) : null,
          section: formData.role === 'student' ? formData.section : null,
          department: formData.role === 'faculty' ? formData.department : null,
        });
      } else {
        const userData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
        };

        if (formData.role === 'student') {
          userData.semester = parseInt(formData.semester);
          userData.section = formData.section;
        } else if (formData.role === 'faculty') {
          userData.department = formData.department || 'Computer Science & Engineering';
        }

        await adminService.createUser(userData);
      }

      closeForm();
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (user) => {
    setDeleteConfirm(user);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await adminService.deleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setSemesterFilter('');
    setSectionFilter('');
  };

  const hasActiveFilters = searchQuery || roleFilter || semesterFilter || sectionFilter;

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Admin' },
      faculty: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Faculty' },
      student: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Student' },
    };
    return badges[role] || badges.student;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Shield;
      case 'faculty': return Briefcase;
      case 'student': return GraduationCap;
      default: return Shield;
    }
  };

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage students, faculty, and administrators
          </p>
        </div>
        <Button
          onClick={openAddForm}
          className="gap-2 bg-[#1266f1] hover:bg-[#0d52d1]"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#1266f1]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#1266f1]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.students}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Faculty</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.faculty}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Admins</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.admins}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1266f1] focus:border-transparent"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admins</option>
        </select>

        {/* Semester Filter */}
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1266f1] focus:border-transparent"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <option key={s} value={s.toString()}>Sem {s}</option>
          ))}
        </select>

        {/* Section Filter */}
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1266f1] focus:border-transparent"
        >
          <option value="">All Sections</option>
          {['A', 'B'].map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-10 gap-1"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'Add New User'}</CardTitle>
              <CardDescription>
                {editingUser ? 'Update user information' : 'Create a new user account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['student', 'faculty', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                          formData.role === role
                            ? 'border-[#1266f1] bg-[#1266f1]/10 dark:bg-[#1266f1]/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {React.createElement(getRoleIcon(role), {
                          className: `h-5 w-5 ${formData.role === role ? 'text-[#1266f1] dark:text-[#5a9fff]' : 'text-gray-400'}`
                        })}
                        <span className="text-xs font-medium capitalize">{role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!!editingUser}
                    />
                  </div>
                </div>

                {formData.role === 'student' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm cursor-pointer"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s.toString()}>Semester {s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Section</Label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm cursor-pointer"
                        required
                      >
                        {['A', 'B'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {!editingUser && (
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="8-20 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value.slice(0, 20) })}
                      required
                      minLength={8}
                      maxLength={20}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#1266f1] hover:bg-[#0d52d1]"
                  >
                    {submitting ? 'Processing...' : editingUser ? 'Update User' : 'Create User'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
              <CardDescription>
                Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{users.length} users {hasActiveFilters && '(filtered)'}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1266f1]"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => {
              const badge = getRoleBadge(user.role);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#1266f1]/10 flex items-center justify-center text-[#1266f1] font-semibold text-sm">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {user.role === 'student' && (
                          <>
                            <span>Sem {user.semester}</span>
                            <span>•</span>
                            <span>Sec {user.section}</span>
                          </>
                        )}
                        {user.role === 'faculty' && user.department && (
                          <span>{user.department}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditForm(user)}
                      disabled={user.id === currentUser?.id}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(user)}
                      disabled={user.id === currentUser?.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-16 px-6">
            <Shield className="h-16 w-16 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {hasActiveFilters ? 'No users found matching your filters.' : 'No users yet. Add a user to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
