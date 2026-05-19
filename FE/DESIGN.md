# FitGainer Design System v1.0

## 🎯 Vision
**FitGainer** is a health-forward fitness platform for underweight users gaining muscle and strength. The design reflects vitality, progress, and scientific precision—clean, purposeful, and trustworthy without corporate coldness.

---

## 🎨 Design Philosophy

### Tone & Aesthetic
- **Minimalist Vitality**: Clean layouts with breathing space, but energized by strategic color and motion.
- **Health-Centric**: Color palette inspired by nature, energy, and biological precision. Avoid generic tech blues.
- **Progressive**: Smooth transitions and micro-interactions reward user actions without distraction.
- **Accessible**: High contrast, readable typography, keyboard-navigable interactions.

---

## 🌈 Color Palette

### Primary Colors
```css
--color-primary: #10b981;        /* Emerald Green (health, growth, vitality) */
--color-primary-light: #d1fae5;
--color-primary-dark: #059669;
```

### Secondary Colors
```css
--color-accent: #f59e0b;         /* Amber (energy, warmth, motivation) */
--color-accent-light: #fef3c7;
--color-accent-dark: #d97706;
```

### Neutral & Background
```css
--color-bg-dark: #0f172a;        /* Deep slate (modern dark mode) */
--color-bg-card: #1e293b;        /* Card backgrounds */
--color-bg-input: #334155;       /* Input fields */
--color-text-primary: #f8fafc;   /* Off-white (less harsh than pure white) */
--color-text-secondary: #cbd5e1; /* Muted silver-gray */
--color-text-tertiary: #94a3b8;  /* Dimmed text */
--color-border: #475569;         /* Subtle borders */
--color-error: #ef4444;          /* Red for errors */
--color-success: #10b981;        /* Green for success (same as primary) */
```

### Gradients
```css
--gradient-primary: linear-gradient(135deg, #10b981 0%, #059669 100%);
--gradient-accent: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
--gradient-dark: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
```

---

## 🔤 Typography

### Font Stack
```css
/* Display (Headlines, Strong Emphasis) */
--font-display: 'Poppins', sans-serif;
font-weight: 700; /* Bold for impact */

/* Body & UI (Readable, Precise) */
--font-body: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 400-500;
```

### Type Scale
```
H1: 32px / 1.2em (bold, display font)   — Page titles, brand
H2: 24px / 1.3em (bold, display font)   — Section headers
H3: 20px / 1.35em (semibold)            — Card titles
Body: 16px / 1.5em (regular)            — Default text
Small: 14px / 1.5em (regular)           — Secondary text, labels
Label: 13px / 1.4em (medium)            — Form labels, badges
```

### Line Height & Letter Spacing
- Headlines: `letter-spacing: -0.5px` (tight, modern)
- Body: `letter-spacing: 0px` (natural)
- Labels: `letter-spacing: 0.3px` (slight spacing for clarity)

---

## 🎯 Component Design Principles

### Buttons
- **Primary Button**: Emerald green background, white text, 8px radius, no border
- **Secondary Button**: Transparent with emerald border, 8px radius
- **State**: Hover = darker shade (05966), Active = even darker, Disabled = gray
- **Padding**: 12px 24px (comfortable touch targets)
- **Font**: 16px, medium weight, uppercase (0.5px tracking)
- **Transition**: `all 0.2s ease`

### Input Fields
- **Background**: `#334155` (subtle, not pure black)
- **Border**: 1px solid `#475569`, focus = 2px solid `#10b981`
- **Padding**: 12px 16px
- **Border Radius**: 8px
- **Placeholder**: `#94a3b8` (muted gray)
- **Font**: 16px, body font
- **Focus Ring**: No outline; use border color change for accessibility

### Cards & Containers
- **Background**: `#1e293b` (slightly lighter than page)
- **Border**: 1px solid `#475569` (optional, use shadow instead)
- **Shadow**: `0 4px 6px rgba(0, 0, 0, 0.1)` (subtle depth)
- **Border Radius**: 12px
- **Padding**: 24px (generous internal spacing)

### Dividers & Borders
- **Color**: `#475569` (subtle, not harsh)
- **Thickness**: 1px
- **Use sparingly**: Prefer whitespace over visual separators

---

## 🎬 Motion & Interaction

### Transition Timing
- **Quick**: 0.15s (button hovers, simple state changes)
- **Standard**: 0.3s (page transitions, form interactions)
- **Slow**: 0.5s (entrance animations, loading states)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (Material motion curve)

### Animations
- **Page Load**: Staggered fade-in of sections (100ms delay between elements)
- **Button Hover**: Scale to 1.02 + shadow increase
- **Input Focus**: Border color shift + subtle shadow
- **Error State**: Shake animation (3 pixels left-right) + color change
- **Success Toast**: Slide in from right, auto-dismiss after 3s

### Cursor & Feedback
- **Cursor**: Pointer on interactive elements
- **Hover States**: Color change + slight scale/lift effect
- **Active States**: Darker color + no scale (pressed feeling)

---

## 🏗️ Layout Principles

### Spacing Scale (8px base)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Page Layout (Auth Pages)
- **Max Width**: 1200px (centered)
- **Padding**: 32px on desktop, 20px on mobile
- **Grid**: Asymmetric layout; content slightly left, decorative elements right

### Form Layout
- **Column Width**: 100% on mobile, 50% on desktop
- **Form Gap**: 20px between fields
- **Label to Input**: 8px gap

---

## 📱 Responsive Breakpoints

```css
mobile:   320px - 640px
tablet:   641px - 1024px
desktop:  1025px+
```

### Adjustments
- **Mobile**: Stack everything, larger touch targets (44px minimum)
- **Tablet**: 2-column layouts, 12px form gaps
- **Desktop**: Multi-column, 20px+ form gaps

---

## 🌙 Dark Mode (Default)

FitGainer operates in **dark mode by default**:
- **Reason**: Fitness dashboards feel modern and less fatiguing; aligns with premium app aesthetic
- **Background**: Deep slate (#0f172a)
- **Cards**: Lighter slate (#1e293b)
- **Text**: Off-white (#f8fafc) for reduced eye strain
- **Accent**: Emerald and amber pop against dark background

**Light mode** can be added as a secondary theme (not included in v1.0).

---

## ♿ Accessibility

### Color Contrast
- Text on primary: 4.5:1 minimum (WCAG AA)
- Interactive elements: Clear focus indicators (emerald border)

### Keyboard Navigation
- Tab order follows visual flow
- Focus visible on all interactive elements
- Form submission via Enter key

### Form Accessibility
- `<label>` associated with `<input>` via `htmlFor` / `id`
- Error messages linked to inputs via `aria-describedby`
- Required fields marked with `aria-required="true"`

---

## 🎨 Design Assets

### Icons
- **Style**: Clean, minimal line icons (2px stroke)
- **Size**: 20px (default), 24px (large), 16px (small)
- **Color**: Inherit text color or use accent colors

### Decorative Elements
- **Gradient Mesh**: Subtle animated gradients in background (optional)
- **Blob Shapes**: SVG blobs for visual interest (opacity: 0.05-0.1)
- **Grid Background**: Faint grid pattern (opacity: 0.03, skip this if feels busy)

---

## 📐 Component Specifications

### Button Component
```
Size: 12px 24px padding
Height: 44px (touch-friendly)
Font: 14px, medium, uppercase
Radius: 8px
Transition: 0.2s ease
States: default, hover, active, disabled
```

### Input Component
```
Size: 16px 12px padding
Height: 44px
Font: 16px, body
Radius: 8px
Border: 1px solid #475569
Focus: 2px solid #10b981 (no outline)
States: default, focus, error, disabled
```

### Card Component
```
Padding: 24px
Radius: 12px
Background: #1e293b
Border: optional 1px #475569
Shadow: 0 4px 6px rgba(0,0,0,0.1)
```

---

## 🎭 Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #10b981;
  --color-accent: #f59e0b;
  --color-bg-dark: #0f172a;
  --color-bg-card: #1e293b;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  
  /* Typography */
  --font-display: 'Poppins', sans-serif;
  --font-body: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-standard: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## 📋 Page-Specific Guidelines

### Login Page
- **Hero**: Left side with brand + tagline
- **Form**: Right side, clean and minimal
- **CTA**: "Don't have an account? Sign up here" (accent color link)
- **Decorative**: Subtle gradient blob in background

### Register Page
- **Hero**: Same branding as login
- **Form**: Multi-step or single-step (progressive disclosure)
- **Password Strength**: Visual indicator (color bar, text label)
- **CTA**: "Already have an account? Log in" (accent color link)

### Navbar (Authenticated)
- **Logo**: Left side, medium size
- **Navigation**: Center (Dashboard, Admin link if applicable)
- **User Menu**: Right side (email, logout)
- **Style**: Minimal borders, subtle background

---

## 🚀 Implementation Notes

1. **CSS-First**: Use CSS Grid/Flexbox for layouts; minimize JavaScript for positioning
2. **Animations**: Prefer CSS `@keyframes` over JS for performance
3. **Responsive**: Mobile-first approach; enhance for larger screens
4. **Performance**: Lazy-load images, defer non-critical animations
5. **Testing**: Verify on Chrome, Firefox, Safari, Edge (Windows + macOS)

---

## 📞 Design Review Checklist

- [ ] Colors match palette exactly
- [ ] Typography follows scale and font stack
- [ ] Spacing uses 8px grid consistently
- [ ] Buttons are 44px+ height (touch-friendly)
- [ ] Focus states visible on all interactive elements
- [ ] Animations use correct timing curves
- [ ] Forms are accessible (labels, aria attributes)
- [ ] Dark mode is default and legible
- [ ] Hover states provide clear feedback
- [ ] Loading states are clear and animated
- [ ] Error states are distinct (red + icon)
- [ ] Success messages are celebratory but brief

---

## Version History
- **v1.0** (2026-05-16): Initial design system for Auth UI (Login, Register, Navbar)

