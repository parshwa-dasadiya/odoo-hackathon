import React, { useEffect, useRef } from 'react';
import Button from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const dialogRef = useRef(null);

  // Focus trap and escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-fade-in-up"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`w-full bg-white rounded-xl shadow-popover overflow-hidden border border-secondary-200 animate-fade-in-up ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
          <h3 id="modal-title" className="text-base font-semibold text-secondary-900 leading-6">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-secondary-400 hover:text-secondary-500 hover:bg-secondary-50 transition-premium focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto text-sm text-secondary-600">
          {children}
        </div>

        {/* Modal Footer */}
        {footer !== undefined && (
          <div className="px-6 py-4 border-t border-secondary-100 bg-secondary-50 flex justify-end gap-3">
            {footer || (
              <>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={onClose}>
                  Confirm
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
