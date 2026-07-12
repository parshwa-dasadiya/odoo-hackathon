/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#4F46E5', // Deep Indigo (#4F46E5 family)
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        secondary: {
          50: '#F8FAFC', // Very light gray background
          100: '#F1F5F9',
          200: '#E2E8F0', // Subtle border
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569', // Body text
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A', // Title / Headings
          950: '#020617',
        },
        accent: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Accent teal
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981', // Emerald success
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B', // Amber warning
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E', // Rose danger
          600: '#E11D48',
          700: '#BE123C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px', // Consistency for inputs and buttons
        'xl': '16px', // Consistency for cards and modals
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        'premium': '0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.03), 0 0 0 1px rgba(226, 232, 240, 1)',
        'popover': '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 1)',
      },
    },
  },
  plugins: [],
}
