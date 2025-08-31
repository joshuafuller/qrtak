# Agency Customization Guide

## TAK Onboarding Platform - Professional Emergency Operations Interface

This guide explains how to customize the TAK Onboarding Platform for your agency, department, or organization. The platform has been designed with easy customization in mind, allowing you to adapt it to match your organizational branding and requirements.

## Quick Start Customization

All customization is done through CSS custom properties (variables) at the top of `/src/styles/main.css`. Simply modify these values to match your agency's branding:

### 1. Agency Colors

```css
:root {
  /* ================================
     AGENCY BRANDING - CUSTOMIZE THESE
     ================================ */
  
  /* Agency Primary Colors - Your main brand colors */
  --agency-primary: #1f2937;           /* Main brand color */
  --agency-primary-light: #374151;     /* Lighter variant */
  --agency-primary-dark: #111827;      /* Darker variant */
  
  /* Agency Secondary Colors - Action and highlight colors */
  --agency-secondary: #1d4ed8;         /* Secondary brand color */
  --agency-secondary-light: #3b82f6;   /* Lighter variant */
  --agency-secondary-dark: #1e40af;    /* Darker variant */
  
  /* Agency Accent Color - Status and success indicators */
  --agency-accent: #059669;            /* Accent color */
  --agency-accent-light: #10b981;      /* Light accent */
  --agency-accent-dark: #047857;       /* Dark accent */
}
```

### 2. Agency Logo

```css
:root {
  /* Agency Logo Configuration */
  --agency-logo-url: url('path/to/your/logo.svg');  /* Your logo file */
  --agency-logo-width: 2rem;                        /* Logo width */
  --agency-logo-height: 2rem;                       /* Logo height */
  --agency-show-logo: block;                        /* Show logo */
  --agency-hide-title-icon: none;                   /* Hide default icon */
}
```

### 3. Agency Name and Text

```css
:root {
  /* Agency Name - Customize organization name */
  --agency-name: 'Your Department Name';
  --agency-subtitle: 'Professional TAK Configuration Platform';
}
```

## Pre-Made Color Schemes

Choose from these professional color schemes or use them as starting points:

### Fire Department (Red)
```css
--agency-primary: #991b1b;
--agency-primary-light: #dc2626;
--agency-primary-dark: #7f1d1d;
--agency-secondary: #ea580c;
--agency-secondary-light: #f97316;
--agency-secondary-dark: #c2410c;
--agency-accent: #059669;
```

### Police Department (Blue)
```css
--agency-primary: #1e3a8a;
--agency-primary-light: #3b82f6;
--agency-primary-dark: #1e40af;
--agency-secondary: #0891b2;
--agency-secondary-light: #0ea5e9;
--agency-secondary-dark: #0e7490;
--agency-accent: #059669;
```

### Military (Olive)
```css
--agency-primary: #365314;
--agency-primary-light: #4d7c0f;
--agency-primary-dark: #1a2e05;
--agency-secondary: #a16207;
--agency-secondary-light: #ca8a04;
--agency-secondary-dark: #92400e;
--agency-accent: #059669;
```

### EMS/Medical (Green)
```css
--agency-primary: #14532d;
--agency-primary-light: #16a34a;
--agency-primary-dark: #052e16;
--agency-secondary: #0891b2;
--agency-secondary-light: #0ea5e9;
--agency-secondary-dark: #0e7490;
--agency-accent: #dc2626;
```

### Federal/Government (Gray)
```css
--agency-primary: #374151;
--agency-primary-light: #6b7280;
--agency-primary-dark: #1f2937;
--agency-secondary: #1d4ed8;
--agency-secondary-light: #3b82f6;
--agency-secondary-dark: #1e40af;
--agency-accent: #059669;
```

## Typography Customization

### Font Selection
```css
:root {
  /* Agency Typography - Customize fonts */
  --agency-font-primary: 'Roboto', 'Segoe UI', system-ui, sans-serif;
  --agency-font-mono: 'Roboto Mono', 'SF Mono', monospace;
}
```

### Popular Professional Font Combinations

#### Modern Sans-Serif
```css
--agency-font-primary: 'Inter', 'Segoe UI', system-ui, sans-serif;
--agency-font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

#### Government Standard
```css
--agency-font-primary: 'Source Sans Pro', 'Segoe UI', system-ui, sans-serif;
--agency-font-mono: 'Source Code Pro', 'Monaco', monospace;
```

#### Emergency Services
```css
--agency-font-primary: 'Open Sans', 'Segoe UI', system-ui, sans-serif;
--agency-font-mono: 'Ubuntu Mono', 'Monaco', monospace;
```

## Advanced Customization

### Header Customization

The platform includes a professional auto-hide header system. You can customize its behavior:

```css
:root {
  /* Header System */
  --header-height: 3.25rem;              /* Standard header height */
  --header-height-compact: 2.25rem;      /* Compact auto-hide height */
  --header-padding: var(--spacing-lg);   /* Header internal padding */
}
```

### QR Code Styling

Customize the QR code containers:

```css
:root {
  /* QR Code System */
  --qr-size: 320px;                      /* Desktop QR container size */
  --qr-size-mobile: 280px;               /* Mobile QR container size */
  --qr-border-width: 2px;                /* QR container border width */
  --qr-padding: var(--spacing-xl);       /* QR container internal padding */
}
```

### Professional Effects

Control the subtle professional effects:

```css
:root {
  /* Professional Effects */
  --backdrop-blur: blur(8px);                            /* Background blur effect */
  --backdrop-opacity: rgba(15, 23, 42, 0.8);            /* Overlay opacity */
  
  /* Animation System */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);      /* Fast interactions */
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);      /* Standard interactions */
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);      /* Slower transitions */
}
```

## Logo Implementation

### Step-by-Step Logo Setup

1. **Prepare Your Logo**
   - Use SVG format for best scalability
   - Ensure the logo works on both light and dark backgrounds
   - Recommended size: 32x32px to 48x48px

2. **Add Logo File**
   ```bash
   # Place your logo file in the public directory
   cp your-logo.svg public/agency-logo.svg
   ```

3. **Update CSS Variables**
   ```css
   :root {
     --agency-logo-url: url('/agency-logo.svg');
     --agency-logo-width: 2rem;
     --agency-logo-height: 2rem;
     --agency-show-logo: block;
     --agency-hide-title-icon: none;
   }
   ```

4. **Update HTML Title (Optional)**
   ```html
   <!-- In index.html -->
   <title>Your Agency - TAK Onboarding Platform</title>
   <meta name="description" content="Your Agency TAK client configuration platform">
   ```

## Theme Variations

### Dark Theme Customization

The platform automatically adapts your colors for dark mode. You can customize the dark theme specifically:

```css
[data-theme="dark"] {
  /* Override any dark theme colors if needed */
  --color-primary: /* your dark theme primary color */;
  --color-background: /* your dark theme background */;
}
```

### High Contrast Support

The platform supports high contrast mode automatically. No additional configuration needed.

## Mobile Optimization

The platform is fully responsive. You can adjust mobile-specific settings:

```css
@media (max-width: 768px) {
  :root {
    --qr-size-mobile: 240px;           /* Smaller QR codes on mobile */
    --header-padding: var(--spacing-sm); /* Tighter mobile padding */
  }
}
```

## Print Optimization

For QR code printing, customize print styles:

```css
@media print {
  .qr-container {
    border: 3px solid #000 !important;  /* High contrast borders for printing */
  }
}
```

## Implementation Checklist

- [ ] Choose your agency color scheme
- [ ] Update agency name and subtitle
- [ ] Add your agency logo (if available)
- [ ] Test on different screen sizes
- [ ] Test in both light and dark modes
- [ ] Test print functionality
- [ ] Verify accessibility with high contrast mode
- [ ] Test with keyboard navigation

## Professional Examples

### Fire Department Implementation
```css
:root {
  /* Fire Department Red Theme */
  --agency-primary: #991b1b;
  --agency-secondary: #ea580c;
  --agency-accent: #059669;
  --agency-name: 'Metro Fire Department';
  --agency-subtitle: 'Emergency Response TAK Configuration';
  --agency-logo-url: url('/fire-dept-logo.svg');
  --agency-show-logo: block;
  --agency-hide-title-icon: none;
}
```

### Police Department Implementation
```css
:root {
  /* Police Department Blue Theme */
  --agency-primary: #1e3a8a;
  --agency-secondary: #0891b2;
  --agency-accent: #059669;
  --agency-name: 'Metro Police Department';
  --agency-subtitle: 'Law Enforcement TAK Configuration';
  --agency-logo-url: url('/police-badge.svg');
  --agency-show-logo: block;
  --agency-hide-title-icon: none;
}
```

## Testing Your Customization

1. **Visual Testing**
   - Load the platform in your browser
   - Test both light and dark themes
   - Check mobile responsiveness
   - Verify QR code generation and display

2. **Accessibility Testing**
   - Test keyboard navigation
   - Check high contrast mode
   - Verify screen reader compatibility

3. **Print Testing**
   - Print QR codes to ensure they scan correctly
   - Check that agency branding appears appropriately

## Deployment

After customization, build and deploy your platform:

```bash
# Build the customized platform
npm run build

# Deploy to your web server
# (Copy the dist/ folder to your web server)
```

## Support and Updates

When updating the platform:

1. Back up your customizations
2. Update the platform code
3. Reapply your agency customizations
4. Test thoroughly before deploying

## Professional Design Guidelines

### Color Accessibility
- Ensure sufficient contrast ratios (4.5:1 minimum)
- Test with colorblind simulation tools
- Maintain consistency across all interface elements

### Typography
- Use no more than 2-3 font families
- Maintain consistent sizing and spacing
- Ensure readability at all screen sizes

### Logo Usage
- Maintain logo aspect ratio
- Ensure logo works on all background colors
- Consider logo legibility at small sizes

### Professional Appearance
- Keep animations subtle and purposeful
- Use consistent spacing throughout
- Maintain clean, uncluttered layouts
- Ensure touch targets are at least 44px on mobile

This customization system ensures your TAK Onboarding Platform maintains a professional appearance while reflecting your agency's unique identity and branding requirements.