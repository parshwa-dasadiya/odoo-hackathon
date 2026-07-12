# AssetFlow Design System

This document outlines the visual guidelines, tokens, and style definitions for the AssetFlow frontend. The styling is built using utility classes in Tailwind CSS, configured in `tailwind.config.js`.

## Typography

We use the **Inter** font family, loaded via Google Fonts. 

- **Headings**: `font-semibold text-secondary-900`
- **Body Text**: `font-normal text-secondary-600`
- **Helper Text / Labels**: `text-sm text-secondary-500`

### Font Sizes
- `text-xs` (12px) - Captions, indicators
- `text-sm` (14px) - Form labels, tables, secondary text, button labels
- `text-base` (16px) - General body text, inputs
- `text-lg` (18px) - Card titles, navigation items
- `text-xl` (20px) - Page sections
- `text-2xl` (24px) - Component header titles
- `text-3xl` (30px) - Large hero headings, login title

## Color Palette

| Token | CSS Class | Color Hex | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | `bg-primary-600` | `#4F46E5` | Deep Indigo for primary actions, active navigation states |
| **Secondary (Bg)** | `bg-secondary-50` | `#F8FAFC` | Main application backdrop |
| **Secondary (Border)** | `border-secondary-200` | `#E2E8F0` | Default border for inputs, separators, and cards |
| **Secondary (Text)** | `text-secondary-600` | `#475569` | Default body font color |
| **Secondary (Heading)** | `text-secondary-900` | `#0F172A` | Primary heading colors and bold identifiers |
| **Accent** | `text-accent-500` | `#0EA5E9` | Highlights, hyperlinks, focused borders |
| **Success** | `text-success-500` | `#10B981` | Positive feedback, "Available" status badge |
| **Warning** | `text-warning-500` | `#F59E0B` | Warning actions, "Under Maintenance" badge |
| **Danger** | `text-danger-500` | `#F43F5E` | Destructive actions, validation errors, alerts |

## Borders & Corners

We maintain a consistent border-radius rule for elements to look unified:
- **Buttons, Inputs, Badges, Tabs**: `rounded-lg` (12px)
- **Cards, Modals, Containers**: `rounded-xl` (16px)

## Shadows

- **Subtle (Inputs, Buttons)**: `shadow-sm`
- **Card Shadow (Default)**: `shadow-card` (custom: light gray outline + soft blur)
- **Overlay Shadow (Modals, Popovers)**: `shadow-popover` (custom: deeper elevation blur)

## Spacing Rhythm

We strictly adhere to a 4px-base grid system. In Tailwind utilities, these map directly:
- **4px**: `p-1`, `m-1`, `gap-1`, `space-x-1`
- **8px**: `p-2`, `m-2`, `gap-2`, `space-x-2`
- **12px**: `p-3`, `m-3`, `gap-3`, `space-x-3`
- **16px**: `p-4`, `m-4`, `gap-4`, `space-x-4`
- **24px**: `p-6`, `m-6`, `gap-6`, `space-x-6`
- **32px**: `p-8`, `m-8`, `gap-8`, `space-x-8`
