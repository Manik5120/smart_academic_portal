import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Mail, Lock, User, Briefcase, XCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { setToken, setUser } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Input, Label } from '../components/ui/input';
import { Button } from '../components/ui/button';
import nitLogo from '../../../uploads/National_Institute_of_Technology,_Srinagar_Logo.png';
import clgBg from '../../../uploads/clg_bg.webp';

const ALLOWED_EMAIL_DOMAIN = 'nitsri.ac.in';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: 'student',
    semester: '1',
    section: 'A',
    roll_number: '',
    employee_id: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextIsLogin = searchParams.get('mode') !== 'register';
    setIsLogin(prev => (prev === nextIsLogin ? prev : nextIsLogin));
  }, [searchParams]);

  const passwordCriteria = [
    {
      label: '8 to 20 characters',
      met: formData.password.length >= 8 && formData.password.length <= 20,
    },
    {
      label: 'At least one capital letter',
      met: /[A-Z]/.test(formData.password),
    },
    {
      label: 'At least one number',
      met: /\d/.test(formData.password),
    },
  ];

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          return 'Please enter a valid email address';
        }
        if (!value.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
          return `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`;
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 20) return 'Password must be less than 20 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one capital letter';
        if (!/\d/.test(value)) return 'Password must contain at least one number';
        return '';
      case 'confirm_password':
        if (!isLogin && !value) return 'Please confirm your password';
        if (!isLogin && value !== formData.password) return 'Passwords do not match';
        return '';
      case 'full_name':
        if (!isLogin && !value) return 'Full name is required';
        return '';
      case 'roll_number':
        if (!isLogin && formData.role === 'student' && !value) return 'Roll number is required';
        return '';
      case 'employee_id':
        if (!isLogin && formData.role === 'faculty' && !value) return 'Faculty ID is required';
        return '';
      case 'semester':
      case 'section':
        if (!isLogin && formData.role === 'student' && !value) {
          return `${name === 'semester' ? 'Semester' : 'Section'} is required`;
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name]) }));
  };

  const resetAuthForm = () => {
    setErrors({});
    setTouched({});
    setSubmitError('');
    setFormData({
      email: '',
      password: '',
      confirm_password: '',
      full_name: '',
      role: 'student',
      semester: '1',
      section: 'A',
      roll_number: '',
      employee_id: '',
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = isLogin
      ? ['email', 'password']
      : [
          'email',
          'password',
          'confirm_password',
          'full_name',
          ...(formData.role === 'student' ? ['semester', 'section', 'roll_number'] : []),
          ...(formData.role === 'faculty' ? ['employee_id'] : []),
        ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched(
        Object.keys(validationErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
      );
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const data = await authService.login(formData.email, formData.password);
        setToken(data.access_token);
        setUser(data.user);
        navigate('/dashboard');
      } else {
        const registerData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
        };

        if (formData.role === 'student') {
          registerData.semester = parseInt(formData.semester);
          registerData.section = formData.section;
          registerData.roll_number = formData.roll_number;
        } else if (formData.role === 'faculty') {
          registerData.employee_id = formData.employee_id;
        }

        await authService.register(registerData);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('mode');
        setSearchParams(nextParams, { replace: true });
        setIsLogin(true);
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setSubmitError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const nextIsLogin = !isLogin;
    const nextParams = new URLSearchParams(searchParams);
    if (nextIsLogin) {
      nextParams.delete('mode');
    } else {
      nextParams.set('mode', 'register');
    }

    setSearchParams(nextParams, { replace: true });
    setIsLogin(nextIsLogin);
    resetAuthForm();
  };

  const openLoginMode = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('mode');
    setSearchParams(nextParams, { replace: true });
    setIsLogin(true);
    resetAuthForm();
  };

  const openRegisterMode = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', 'register');
    setSearchParams(nextParams, { replace: true });
    setIsLogin(false);
    resetAuthForm();
  };

  const switchRegistrationRole = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      password: '',
      confirm_password: '',
    }));

    setErrors(prev => ({
      ...prev,
      password: '',
      confirm_password: '',
      roll_number: '',
      employee_id: '',
      semester: '',
      section: '',
    }));

    setTouched(prev => ({
      ...prev,
      password: false,
      confirm_password: false,
      roll_number: false,
      employee_id: false,
      semester: false,
      section: false,
    }));
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${clgBg})` }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/30 dark:bg-gray-950/60 backdrop-blur-[2px]" />

      <div className="absolute left-4 top-4 z-20 md:left-6 md:top-6">
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:text-[#1266f1]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <img
            src={nitLogo}
            alt="National Institute of Technology, Srinagar Logo"
            className="h-40 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Academic Portal
          </h1>
          {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Department of Computer Science & Engineering
          </p> */}
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            type="button"
            onClick={openLoginMode}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isLogin
                ? 'bg-white dark:bg-gray-700 text-[#1266f1] dark:text-[#5a9fff] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={openRegisterMode}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isLogin
                ? 'bg-white dark:bg-gray-700 text-[#1266f1] dark:text-[#5a9fff] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        <Card className="border-white/40 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/10">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Submit Error */}
              {submitError && (
                <div
                  role="alert"
                  className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  {submitError}
                </div>
              )}

              {/* Registration Fields */}
              {!isLogin && (
                <>
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => switchRegistrationRole('student')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'student'
                          ? 'border-[#1266f1] bg-[#1266f1]/10 dark:bg-[#1266f1]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Briefcase className="h-5 w-5 text-[#1266f1] dark:text-[#5a9fff]" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchRegistrationRole('faculty')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.role === 'faculty'
                          ? 'border-[#1266f1] bg-[#1266f1]/10 dark:bg-[#1266f1]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <User className="h-5 w-5 text-[#1266f1] dark:text-[#5a9fff]" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Faculty</span>
                    </button>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChange={e => handleChange('full_name', e.target.value)}
                        onBlur={() => handleBlur('full_name')}
                        className={`pl-10 ${touched.full_name && errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        aria-invalid={touched.full_name && errors.full_name ? 'true' : 'false'}
                        aria-describedby={touched.full_name && errors.full_name ? 'full_name-error' : undefined}
                      />
                    </div>
                    {touched.full_name && errors.full_name && (
                      <p id="full_name-error" className="text-xs text-red-600 dark:text-red-400">
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* Student Fields */}
                  {formData.role === 'student' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester" className="text-gray-700 dark:text-gray-300">
                          Semester
                        </Label>
                        <select
                          id="semester"
                          value={formData.semester}
                          onChange={e => handleChange('semester', e.target.value)}
                          onBlur={() => handleBlur('semester')}
                          className={`flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1266f1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                            touched.semester && errors.semester ? 'border-red-500 focus-visible:ring-red-500' : ''
                          }`}
                          aria-invalid={touched.semester && errors.semester ? 'true' : 'false'}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s.toString()}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                        {touched.semester && errors.semester && (
                          <p className="text-xs text-red-600 dark:text-red-400">{errors.semester}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="section" className="text-gray-700 dark:text-gray-300">
                          Section
                        </Label>
                        <select
                          id="section"
                          value={formData.section}
                          onChange={e => handleChange('section', e.target.value)}
                          onBlur={() => handleBlur('section')}
                          className={`flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1266f1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                            touched.section && errors.section ? 'border-red-500 focus-visible:ring-red-500' : ''
                          }`}
                          aria-invalid={touched.section && errors.section ? 'true' : 'false'}
                        >
                          {['A', 'B'].map(s => (
                            <option key={s} value={s}>
                              Section {s}
                            </option>
                          ))}
                        </select>
                        {touched.section && errors.section && (
                          <p className="text-xs text-red-600 dark:text-red-400">{errors.section}</p>
                        )}
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="roll_number" className="text-gray-700 dark:text-gray-300">
                          Enroll No.
                        </Label>
                        <Input
                          id="roll_number"
                          type="text"
                          placeholder="2022BCSE021"
                          value={formData.roll_number}
                          onChange={e => handleChange('roll_number', e.target.value.toUpperCase())}
                          onBlur={() => {
                            handleChange('roll_number', formData.roll_number.toUpperCase());
                            handleBlur('roll_number');
                          }}
                          className={`uppercase ${touched.roll_number && errors.roll_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          aria-invalid={touched.roll_number && errors.roll_number ? 'true' : 'false'}
                        />
                        {touched.roll_number && errors.roll_number && (
                          <p className="text-xs text-red-600 dark:text-red-400">{errors.roll_number}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.role === 'faculty' && (
                    <div className="space-y-2">
                      <Label htmlFor="employee_id" className="text-gray-700 dark:text-gray-300">
                        Faculty ID
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="employee_id"
                          type="text"
                          placeholder="e.g., FAC001"
                          value={formData.employee_id}
                          onChange={e => handleChange('employee_id', e.target.value)}
                          onBlur={() => handleBlur('employee_id')}
                          className={`pl-10 ${touched.employee_id && errors.employee_id ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          aria-invalid={touched.employee_id && errors.employee_id ? 'true' : 'false'}
                          aria-describedby={touched.employee_id && errors.employee_id ? 'employee_id-error' : undefined}
                        />
                      </div>
                      {touched.employee_id && errors.employee_id && (
                        <p id="employee_id-error" className="text-xs text-red-600 dark:text-red-400">
                          {errors.employee_id}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={`your.email@${ALLOWED_EMAIL_DOMAIN}`}
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={`pl-10 ${touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                    aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                  />
                </div>
                {touched.email && errors.email && (
                  <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8-20 characters"
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value.slice(0, 20))}
                    onBlur={() => handleBlur('password')}
                    className={`pl-10 pr-10 ${touched.password && errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                    aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
                {!isLogin && formData.password && (
                  <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Password must have:
                    </p>
                    <div className="space-y-2">
                      {passwordCriteria.map((criterion) => {
                        const Icon = criterion.met ? CheckCircle2 : XCircle;
                        return (
                          <div
                            key={criterion.label}
                            className={`flex items-center gap-2 text-xs font-medium ${
                              criterion.met
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{criterion.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password - Only for registration */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={formData.confirm_password}
                      onChange={e => handleChange('confirm_password', e.target.value.slice(0, 20))}
                      onBlur={() => handleBlur('confirm_password')}
                      className={`pl-10 pr-10 ${touched.confirm_password && errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      aria-invalid={touched.confirm_password && errors.confirm_password ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.confirm_password && errors.confirm_password && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.confirm_password}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-[#1266f1] hover:bg-[#0d52d1] text-white font-medium shadow-lg shadow-[#1266f1]/25 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Toggle Link */}
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-[#1266f1] dark:text-[#5a9fff] hover:text-[#0d52d1] dark:hover:text-[#7ab3ff] font-medium cursor-pointer transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Footer - Full Width */}
      <footer className="relative z-10 bg-white dark:bg-gray-900 py-2 text-center shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          National Institute of Technology, Srinagar &copy; {new Date().getFullYear()} - All rights reserved.
        </p>
      </footer>
    </div>
  );
}
