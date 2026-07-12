import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../../api/apiClient';
import useForm from '../../hooks/useForm';
import { validateEmail, validatePasswordStrength, validateConfirmPassword, validateRequired } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // OTP Timer Cooldown Effect
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const triggerCooldown = () => {
    setCooldown(30); // 30 second countdown
  };

  // Form hook for Step 1
  const validateStep1 = (values) => {
    const errors = {};
    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;
    return errors;
  };

  const handleStep1Submit = async (values) => {
    setSubmitError('');
    try {
      const response = await post('/auth/forgot-password', { email: values.email });
      
      // Since it will throw error because no backend, we handle that.
      // But we simulate successful step progression for demonstration purposes.
      if (response && response.success) {
        setEmail(values.email);
        setStep(2);
        triggerCooldown();
        showToast('success', 'OTP sent to your email.');
      } else {
        setSubmitError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Step 1 failed', err);
      setSubmitError(err.message || 'Could not connect to the server to send OTP.');
      showToast('error', 'Request failed.');
    }
  };

  const form1 = useForm({
    initialValues: { email: '' },
    validate: validateStep1,
    onSubmit: handleStep1Submit,
  });

  // Form hook for Step 2
  const validateStep2 = (values) => {
    const errors = {};
    
    const otpErr = validateRequired(values.otp, 'OTP Code');
    if (otpErr) errors.otp = otpErr;

    const passErr = validatePasswordStrength(values.password);
    if (passErr) errors.password = passErr;

    const confirmErr = validateConfirmPassword(values.password, values.confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;

    return errors;
  };

  const handleStep2Submit = async (values) => {
    setSubmitError('');
    try {
      const response = await post('/auth/reset-password', {
        email,
        otp: values.otp,
        password: values.password,
      });

      if (response && response.success) {
        showToast('success', 'Password reset successfully! Please log in.');
        navigate('/login');
      } else {
        setSubmitError(response.message || 'Reset password failed.');
      }
    } catch (err) {
      console.error('Step 2 failed', err);
      setSubmitError(err.message || 'Failed to verify OTP code.');
      showToast('error', 'Reset failed.');
    }
  };

  const form2 = useForm({
    initialValues: { otp: '', password: '', confirmPassword: '' },
    validate: validateStep2,
    onSubmit: handleStep2Submit,
  });

  // Presentation tool: bypass Step 1
  const handleSimulateStep1Success = () => {
    if (!form1.values.email) {
      showToast('warning', 'Please enter an email first.');
      return;
    }
    const emailErr = validateEmail(form1.values.email);
    if (emailErr) {
      showToast('error', emailErr);
      return;
    }
    setEmail(form1.values.email);
    setStep(2);
    triggerCooldown();
    showToast('success', 'OTP simulated successfully! (Enter any 6 digits)');
  };

  // Presentation tool: bypass Step 2
  const handleSimulateStep2Success = () => {
    if (!form2.values.otp || !form2.values.password || !form2.values.confirmPassword) {
      showToast('warning', 'Please fill out all fields first.');
      return;
    }
    const validationErrors = validateStep2(form2.values);
    const cleanErrors = Object.keys(validationErrors).filter(key => validationErrors[key]);
    if (cleanErrors.length > 0) {
      showToast('error', 'Please resolve validation errors first.');
      return;
    }

    showToast('success', 'Demo password reset successful!');
    navigate('/login');
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setSubmitError('');
    try {
      triggerCooldown();
      showToast('info', 'New OTP code requested.');
      // Actually call endpoint
      await post('/auth/forgot-password', { email });
    } catch (err) {
      // Cooldown remains, network failure shown
      console.log('Resend OTP connection fail (expected)', err);
    }
  };

  return (
    <Card
      title="Reset your password"
      subtitle={
        step === 1 
          ? "Enter your email address and we'll send you an OTP code." 
          : `We sent a code to ${email}. Enter it below with your new password.`
      }
      className="border border-secondary-200 animate-fade-in-up"
    >
      
      {/* Step 1 Form */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit} className="flex flex-col gap-4">
          {submitError && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-xs text-danger-700 font-medium flex items-start gap-2.5 animate-fade-in-up">
              <svg className="h-4 w-4 flex-shrink-0 text-danger-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Request Failed</p>
                <p>{submitError}</p>
              </div>
            </div>
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="s.connor@company.com"
            required
            value={form1.values.email}
            error={form1.errors.email}
            touched={form1.touched.email}
            onChange={form1.handleChange}
            onBlur={form1.handleBlur}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
            }
          />

          <Button
            type="submit"
            loading={form1.isSubmitting}
            className="w-full"
          >
            Send OTP Code
          </Button>

          <div className="text-center text-xs text-secondary-500 mt-2">
            <Link 
              to="/login" 
              className="text-primary-600 hover:text-primary-700 font-semibold transition-premium focus:outline-none"
            >
              Back to Sign In
            </Link>
          </div>

          {/* Hackathon simulated step bypass */}
          <div className="pt-4 border-t border-secondary-100 flex flex-col items-center">
            <button
              type="button"
              onClick={handleSimulateStep1Success}
              className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 bg-accent-50/50 hover:bg-accent-50 border border-accent-200/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-premium"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Simulate OTP Request Success
            </button>
          </div>
        </form>
      )}

      {/* Step 2 Form */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit} className="flex flex-col gap-4">
          {submitError && (
            <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-xs text-danger-700 font-medium flex items-start gap-2.5 animate-fade-in-up">
              <svg className="h-4 w-4 flex-shrink-0 text-danger-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Verification Failed</p>
                <p>{submitError}</p>
              </div>
            </div>
          )}

          {/* OTP Code */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="OTP Code"
              name="otp"
              type="text"
              placeholder="e.g. 123456"
              required
              value={form2.values.otp}
              error={form2.errors.otp}
              touched={form2.touched.otp}
              onChange={form2.handleChange}
              onBlur={form2.handleBlur}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
            <div className="flex items-center justify-end text-xs mt-1">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={cooldown > 0}
                className={`font-semibold transition-premium focus:outline-none ${
                  cooldown > 0 
                    ? 'text-secondary-400 cursor-not-allowed' 
                    : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP Code'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <Input
            label="New Password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            value={form2.values.password}
            error={form2.errors.password}
            touched={form2.touched.password}
            onChange={form2.handleChange}
            onBlur={form2.handleBlur}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          {/* Confirm Password */}
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            required
            value={form2.values.confirmPassword}
            error={form2.errors.confirmPassword}
            touched={form2.touched.confirmPassword}
            onChange={form2.handleChange}
            onBlur={form2.handleBlur}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          <Button
            type="submit"
            loading={form2.isSubmitting}
            className="w-full"
          >
            Reset Password
          </Button>

          <div className="text-center text-xs text-secondary-500 mt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary-600 hover:text-primary-700 font-semibold transition-premium focus:outline-none"
            >
              Back to Step 1
            </button>
          </div>

          {/* Hackathon simulated Step 2 bypass */}
          <div className="pt-4 border-t border-secondary-100 flex flex-col items-center">
            <button
              type="button"
              onClick={handleSimulateStep2Success}
              className="text-[11px] font-semibold text-accent-600 hover:text-accent-700 bg-accent-50/50 hover:bg-accent-50 border border-accent-200/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-premium"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simulate Reset Success
            </button>
          </div>
        </form>
      )}

    </Card>
  );
};

export default ForgotPasswordPage;
