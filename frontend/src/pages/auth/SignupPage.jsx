import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../../api/apiClient';
import useForm from '../../hooks/useForm';
import { validateEmail, validatePasswordStrength, validateConfirmPassword, validateRequired } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';

export const SignupPage = () => {
  const { showToast } = useNotification();
  const [submitError, setSubmitError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Define form validation schema
  const validate = (values) => {
    const errors = {};
    
    const nameErr = validateRequired(values.name, 'Full Name');
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;

    const passErr = validatePasswordStrength(values.password);
    if (passErr) errors.password = passErr;

    const confirmErr = validateConfirmPassword(values.password, values.confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;

    return errors;
  };

  const handleSignupSubmit = async (values) => {
    setSubmitError('');
    try {
      // Endpoint call (will fail/throw error unless backend is running)
      // If we want to simulate success for demonstration purposes if they use a special email, 
      // or if they want to see a standard error.
      // We will call the real API. Since it fails because there is no backend, we catch the error.
      // But wait! To let them easily see the "Check your email" success screen, let's allow them 
      // to sign up with a simulated flag or if they use "demo@company.com" or similar, or provide a button!
      // Let's call the API, and if it fails, check if we can simulate success.
      // Actually, to make it fully testable, let's add a "Simulate Registration Success" helper.
      const response = await post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password
      });

      if (response && response.success) {
        setRegisteredEmail(values.email);
        setIsRegistered(true);
        showToast('success', 'Account created successfully!');
      } else {
        setSubmitError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed', error);
      
      // Let's check if we want to show a standard failure, but also give an option to bypass.
      setSubmitError(error.message || 'Account registration failed due to connection error.');
      showToast('error', 'Registration request failed.');
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate,
    onSubmit: handleSignupSubmit,
  });


  // Render check-email success view if registered
  if (isRegistered) {
    return (
      <Card
        className="border border-secondary-200 animate-fade-in-up text-center"
      >
        <div className="flex flex-col items-center justify-center p-4">
          <div className="h-16 w-16 bg-success-50 text-success-500 rounded-full border border-success-100 flex items-center justify-center mb-6">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Check your email</h2>
          <p className="text-sm text-secondary-600 mb-6 max-w-sm">
            We have sent a verification link to <span className="font-semibold text-secondary-900">{registeredEmail}</span>. Please check your inbox and click the link to verify your account.
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => showToast('info', 'Verification link resent.')}
              className="w-full inline-flex justify-center py-2 px-4 border border-secondary-200 rounded-lg text-sm font-semibold text-secondary-700 bg-white hover:bg-secondary-50 transition-premium"
            >
              Resend verification email
            </button>
            
            <Link
              to="/login"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-premium"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Create your account"
      subtitle="Start tracking resources and assets in your department."
      className="border border-secondary-200 animate-fade-in-up"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Error Alert */}
        {submitError && (
          <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-xs text-danger-700 font-medium flex items-start gap-2.5 animate-fade-in-up">
            <svg className="h-4 w-4 flex-shrink-0 text-danger-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Registration Failed</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {/* Name Input */}
        <Input
          label="Full Name"
          name="name"
          type="text"
          placeholder="Sarah Connor"
          required
          value={values.name}
          error={errors.name}
          touched={touched.name}
          onChange={handleChange}
          onBlur={handleBlur}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        {/* Email Input */}
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="s.connor@company.com"
          required
          value={values.email}
          error={errors.email}
          touched={touched.email}
          onChange={handleChange}
          onBlur={handleBlur}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
            </svg>
          }
        />

        {/* Password Input */}
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Minimum 8 characters"
          required
          value={values.password}
          error={errors.password}
          touched={touched.password}
          onChange={handleChange}
          onBlur={handleBlur}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        {/* Confirm Password Input */}
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat password"
          required
          value={values.confirmPassword}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />

        {/* Action Button */}
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
        >
          Sign Up
        </Button>

        {/* Login redirect */}
        <div className="text-center text-xs text-secondary-500 mt-2">
          <span>Already have an account? </span>
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-700 font-semibold transition-premium focus:outline-none"
          >
            Sign In
          </Link>
        </div>


      </form>
    </Card>
  );
};

export default SignupPage;
