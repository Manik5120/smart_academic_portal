import { useState, useEffect } from 'react';
import { X, Mail, Key, Lock, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/auth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';

const ALLOWED_EMAIL_DOMAIN = 'nitsri.ac.in';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setEmail(initialEmail);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setCanResendOtp(false);
      setResendCountdown(60);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval;
    if (currentStep === 2 && resendCountdown > 0 && !canResendOtp) {
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendCountdown, canResendOtp]);

  const passwordCriteria = [
    {
      label: '8 to 20 characters',
      met: newPassword.length >= 8 && newPassword.length <= 20,
    },
    {
      label: 'At least one capital letter',
      met: /[A-Z]/.test(newPassword),
    },
    {
      label: 'At least one number',
      met: /\d/.test(newPassword),
    },
  ];

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
      return `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`;
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 20) return 'Password must be less than 20 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one capital letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setCurrentStep(2);
      setResendCountdown(60);
      setCanResendOtp(false);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      await authService.forgotPassword(email);
      setResendCountdown(60);
      setCanResendOtp(false);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setCurrentStep(1);
    setOtp('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-all ${
                  step <= currentStep ? 'bg-[#1266f1]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div
              role="alert"
              className="mb-4 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
            </div>
          )}

          {!success && (
            <>
              {/* Step 1: Request OTP */}
              {currentStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <Mail className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter your email to receive a password reset OTP
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={`your.email@${ALLOWED_EMAIL_DOMAIN}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    Back to login
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {currentStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <Key className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter the 6-digit OTP sent to your email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                      className="w-full text-center text-2xl tracking-widest"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || resendLoading}
                      className={`font-medium ${
                        canResendOtp
                          ? 'text-[#1266f1] hover:text-[#0d52d1]'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {resendLoading ? 'Resending...' : canResendOtp ? 'Resend OTP' : `Resend OTP in ${resendCountdown}s`}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {currentStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="h-12 w-12 text-[#1266f1] mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter your new password
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="8-20 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value.slice(0, 20))}
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value.slice(0, 20))}
                        className="w-full pr-10"
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
                  </div>

                  {newPassword && (
                    <div className="space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        Password must have:
                      </p>
                      <div className="space-y-2">
                        {passwordCriteria.map((criterion) => {
                          const Icon = criterion.met ? CheckCircle2 : X;
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

                  <Button
                    type="submit"
                    className="w-full bg-[#1266f1] hover:bg-[#0d52d1]"
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    Back
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
