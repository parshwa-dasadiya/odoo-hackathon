import { useState, useCallback } from 'react';

/**
 * Custom hook for handling form state, validation, and submission.
 */
export const useForm = ({ initialValues = {}, validate, onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues((prev) => ({ ...prev, [name]: fieldValue }));
    
    // Clear error for this field as user types/modifies it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors && validationErrors[name] !== undefined) {
        setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
      }
    }
  }, [values, validate]);

  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);

    // Validate all fields
    let validationErrors = {};
    if (validate) {
      validationErrors = validate(values) || {};
    }

    // Filter out empty error strings
    const activeErrors = {};
    Object.keys(validationErrors).forEach((key) => {
      if (validationErrors[key]) {
        activeErrors[key] = validationErrors[key];
      }
    });

    // Set all fields to touched
    const touchedFields = {};
    Object.keys(values).forEach((key) => {
      touchedFields[key] = true;
    });
    setTouched(touchedFields);

    if (Object.keys(activeErrors).length > 0) {
      setErrors(activeErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Submission error in useForm', err);
      setErrors({ submit: err.message || 'Form submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
    resetForm,
  };
};

export default useForm;
