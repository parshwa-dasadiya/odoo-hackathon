import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { validateEmail, validateRequired } from '../../utils/validators';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useNotification } from '../../context/NotificationContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [submitError, setSubmitError] = useState('');

  // Define form validation schema
  const validate = (values) => {
    const errors = {};
    const emailErr = validateEmail(values.email);
    if (emailErr) errors.email = emailErr;
    
    const passErr = validateRequired(values.password, 'Password');
    if (passErr) errors.password = passErr;
    
    return errors;
  };

  const handleLoginSubmit = async (values) => {
    setSubmitError('');
    const result = await login(values.email, values.password);
    
    if (result.success) {
      showToast('success', 'Logged in successfully!');
      navigate('/dashboard');
    } else {
      setSubmitError(result.message);
      showToast('error', 'Login attempt failed.');
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
    initialValues: { email: '', password: '' },
    validate,
    onSubmit: handleLoginSubmit,
  });


  return (
    <Card 
      title="Welcome back" 
      subtitle="Enter your credentials to access your organization dashboard."
      className="border border-secondary-200 animate-fade-in-up"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Error Banner */}
        {submitError && (
          <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-xs text-danger-700 font-medium flex items-start gap-2.5 animate-fade-in-up">
            <svg className="h-4 w-4 flex-shrink-0 text-danger-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold mb-0.5">Authentication Failed</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {/* Email Input */}
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@company.com"
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
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
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
          <div className="flex items-center justify-end text-xs mt-1">
            <Link 
              to="/forgot-password" 
              className="text-primary-600 hover:text-primary-700 font-medium transition-premium focus:outline-none"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
        >
          Sign In
        </Button>

        {/* Signup redirection */}
        <div className="text-center text-xs text-secondary-500 mt-2">
          <span>Don't have an account? </span>
          <Link 
            to="/signup" 
            className="text-primary-600 hover:text-primary-700 font-semibold transition-premium focus:outline-none"
          >
            Create an account
          </Link>
        </div>


      </form>
    </Card>
  );
};

export default LoginPage;
