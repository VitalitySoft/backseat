# Backseat Django UI Components Guide

This document lists all available UI components and CSS classes for consistent styling across the Backseat Django application.

## Logo Assets

### SVG Logo
**File:** `backseat/static/logo.svg`

The Backseat logo depicts a rider on a two-wheeler, head turned back over their shoulder — checking on the passenger behind them. This is the literal image behind the "Backseat" name.

**Usage in templates:**
```html
<!-- Inline SVG (recommended for color control) -->
<div class="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-marigold">
  <svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4">
    <!-- wheels -->
    <circle cx="10" cy="30" r="6" />
    <circle cx="30" cy="30" r="6" />
    <!-- frame lines -->
    <line x1="17" y1="18" x2="10" y2="30" />
    <line x1="17" y1="18" x2="30" y2="30" />
    <line x1="17" y1="18" x2="27" y2="14" />
    <line x1="27" y1="14" x2="30" y2="30" />
    <line x1="15" y1="17.5" x2="19" y2="17.5" />
    <!-- rider -->
    <line x1="17" y1="17" x2="15" y2="8" />
    <line x1="15.5" y1="10" x2="26" y2="14" />
    <line x1="17" y1="17" x2="24" y2="26" />
    <!-- head (filled circle) -->
    <circle cx="11.5" cy="6.5" r="3.1" fill="currentColor" />
  </svg>
</div>

<!-- Or load from static file -->
<img src="{% static 'logo.svg' %}" alt="Backseat Logo" class="h-9 w-9 text-marigold">
```

## Button Components

### Button Variants
All buttons use the base `.btn` class plus a variant class:

```html
<!-- Primary (marigold accent) -->
<button class="btn btn-primary btn-md">Get Started</button>

<!-- Ink (dark blue) -->
<button class="btn btn-ink btn-md">Submit</button>

<!-- Outline -->
<button class="btn btn-outline btn-md">Learn More</button>

<!-- Ghost (transparent) -->
<button class="btn btn-ghost btn-md">Cancel</button>

<!-- Rose (pinkish-red) -->
<button class="btn btn-rose btn-md">Delete</button>

<!-- Banyan (teal-green) -->
<button class="btn btn-banyan btn-md">Approve</button>

<!-- Danger (rose pale background) -->
<button class="btn btn-danger btn-md">Remove</button>
```

### Button Sizes
- `.btn-sm` — Small (padding: 0.5rem 1rem, font-size: 0.75rem)
- `.btn-md` — Medium/default (padding: 0.625rem 1.25rem, font-size: 0.875rem)
- `.btn-lg` — Large (padding: 0.875rem 1.75rem, font-size: 1rem)

### Icon-Only Buttons
```html
<button class="btn btn-ink btn-icon">
  <i data-lucide="heart" class="h-4 w-4"></i>
</button>
```

## Badge Components

```html
<!-- Marigold badge -->
<span class="badge badge-marigold">Pending</span>

<!-- Rose badge -->
<span class="badge badge-rose">Cancelled</span>

<!-- Banyan badge -->
<span class="badge badge-banyan">Verified</span>

<!-- Ink badge -->
<span class="badge badge-ink">Admin</span>

<!-- Outline badge -->
<span class="badge badge-outline">Draft</span>
```

## Status Indicators

```html
<!-- Status dot (inline indicator) -->
<span class="status-dot status-dot-success"></span> Active
<span class="status-dot status-dot-warning"></span> Pending
<span class="status-dot status-dot-error"></span> Failed

<!-- With pulse animation -->
<span class="status-dot status-dot-success status-dot-pulse"></span> Live
```

## Card Components

```html
<!-- Default card with hover effect -->
<div class="card">
  <h3 class="text-lg font-bold">Card Title</h3>
  <p class="text-sm text-text-soft">Card content here.</p>
</div>

<!-- Flat card (no hover effect) -->
<div class="card card-flat">
  <p>Static card content</p>
</div>
```

## Form Components

### Input Fields
```html
<!-- Text input -->
<input type="text" class="input" placeholder="Enter your name">

<!-- Input with error state -->
<input type="email" class="input input-error" placeholder="Email address">

<!-- Select dropdown -->
<select class="input select">
  <option>Choose option</option>
  <option value="1">Option 1</option>
</select>

<!-- Textarea -->
<textarea class="input textarea" placeholder="Enter description"></textarea>
```

### Checkbox & Radio
```html
<!-- Checkbox -->
<input type="checkbox" class="checkbox" id="terms">
<label for="terms">I agree to terms</label>

<!-- Radio button -->
<input type="radio" class="radio" name="choice" id="option1">
<label for="option1">Option 1</label>
```

## Alert Components

```html
<!-- Info alert -->
<div class="alert alert-info">
  <i data-lucide="info" class="h-4 w-4"></i>
  <span>This is an informational message.</span>
</div>

<!-- Success alert -->
<div class="alert alert-success">
  <i data-lucide="check-circle" class="h-4 w-4"></i>
  <span>Operation completed successfully!</span>
</div>

<!-- Warning alert -->
<div class="alert alert-warning">
  <i data-lucide="alert-triangle" class="h-4 w-4"></i>
  <span>Please review this carefully.</span>
</div>

<!-- Error alert -->
<div class="alert alert-error">
  <i data-lucide="x-circle" class="h-4 w-4"></i>
  <span>An error occurred.</span>
</div>
```

## Loading & Skeleton Components

### Spinner
```html
<!-- Default spinner -->
<div class="spinner"></div>

<!-- Small spinner -->
<div class="spinner spinner-sm"></div>

<!-- Large spinner -->
<div class="spinner spinner-lg"></div>
```

### Skeleton Loader
```html
<div class="skeleton" style="height: 20px; width: 200px;"></div>
<div class="skeleton" style="height: 100px; width: 100%; margin-top: 12px;"></div>
```

## Avatar Components

```html
<!-- Small avatar -->
<div class="avatar avatar-sm">JD</div>

<!-- Medium avatar (default) -->
<div class="avatar avatar-md">JD</div>

<!-- Large avatar -->
<div class="avatar avatar-lg">JD</div>

<!-- Extra-large avatar -->
<div class="avatar avatar-xl">JD</div>

<!-- Avatar with image -->
<div class="avatar avatar-md">
  <img src="/path/to/image.jpg" alt="User">
</div>
```

## Tooltip

```html
<span class="tooltip" data-tooltip="This is a helpful tip">
  Hover over me
</span>
```

## Modal/Dialog

```html
<!-- Modal overlay and container -->
<div class="modal-overlay">
  <div class="modal">
    <div class="p-6">
      <h2 class="text-xl font-bold">Modal Title</h2>
      <p class="mt-2 text-sm text-text-soft">Modal content goes here.</p>
      <div class="mt-4 flex gap-2">
        <button class="btn btn-outline btn-sm">Cancel</button>
        <button class="btn btn-primary btn-sm">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

## Divider

```html
<!-- Horizontal divider -->
<div class="divider"></div>

<!-- Vertical divider (use in flex containers) -->
<div class="divider-vertical"></div>
```

## Empty State

```html
<div class="empty-state">
  <div class="empty-state-icon">
    <i data-lucide="inbox" class="h-full w-full"></i>
  </div>
  <p class="text-lg font-semibold">No items found</p>
  <p class="mt-1 text-sm">Try adjusting your filters.</p>
</div>
```

## Ticket Shell Component

The "ticket" motif is central to Backseat's design language, appearing on ride cards, receipts, and QR displays.

```html
<div class="ticket-shell">
  <!-- Main content area -->
  <div class="ticket-main">
    <h3>Ride to Downtown</h3>
    <p>Departure: 10:00 AM</p>
  </div>
  
  <!-- Side panel with dashed separator -->
  <div class="ticket-side">
    <p class="text-xs">Seats: 2</p>
    <p class="text-xs">Status: Active</p>
  </div>
</div>
```

### Ticket Perforation & Notch
```html
<!-- Perforated edge (dashed line separator) -->
<div class="ticket-perforation"></div>

<!-- Notch cutouts (circular indents on sides) -->
<div class="ticket-notch">
  <!-- Content between notches -->
</div>
```

## Animations

### Fade Up
```html
<div class="fade-up">Content fades in from below</div>
<div class="fade-up delay-1">Delayed fade in</div>
<div class="fade-up delay-2">More delayed</div>
<div class="fade-up delay-3">Most delayed</div>
```

### Float Soft
```html
<div class="float-soft">This gently floats up and down</div>
```

### Pulse Glow
```html
<div class="pulse-glow">This pulses with opacity changes</div>
```

## Color Palette

All colors are available as CSS variables:

### Primary Colors
- `var(--color-ink)` — #1e2749 (dark blue, primary text)
- `var(--color-ink-deep)` — #12172b (darker blue)
- `var(--color-ink-soft)` — #2c3660 (softer blue)

### Background Colors
- `var(--color-paper)` — #fbf6ec (warm off-white)
- `var(--color-paper-dim)` — #f3ecdc (slightly darker paper)
- `var(--color-paper-line)` — #e3d9c2 (border color)

### Accent Colors
- `var(--color-marigold)` — #e8a33d (primary accent, orange-gold)
- `var(--color-marigold-deep)` — #c47f22 (darker marigold)
- `var(--color-marigold-pale)` — #fbe6bf (pale marigold)

### Status Colors
- `var(--color-rose)` — #e2697d (error/danger, pinkish-red)
- `var(--color-rose-deep)` — #c14a5e (darker rose)
- `var(--color-rose-pale)` — #f8dde2 (pale rose)

- `var(--color-banyan)` — #3f7566 (success, teal-green)
- `var(--color-banyan-deep)` — #2c5548 (darker banyan)
- `var(--color-banyan-pale)` — #dcece5 (pale banyan)

### Text Colors
- `var(--color-text)` — #23283a (body text)
- `var(--color-text-soft)` — #5b5f72 (muted text)
- `var(--color-on-ink)` — #f6f1e4 (text on dark backgrounds)
- `var(--color-on-ink-soft)` — #b9bfe0 (muted text on dark backgrounds)

### Typography
- `var(--font-display)` — 'Fraunces' (serif, for headings)
- `var(--font-body)` — 'Manrope' (sans-serif, for body text)
- `var(--font-mono)` — 'JetBrains Mono' (monospace)

## Usage Examples

### Action Button Group
```html
<div class="flex gap-2">
  <button class="btn btn-outline btn-sm">Cancel</button>
  <button class="btn btn-primary btn-sm">Save Changes</button>
</div>
```

### Status Badge with Dot
```html
<div class="flex items-center gap-2">
  <span class="status-dot status-dot-success"></span>
  <span class="badge badge-banyan">Verified Rider</span>
</div>
```

### Form with Validation
```html
<form class="space-y-4">
  <div>
    <label class="block text-sm font-semibold mb-1">Email</label>
    <input type="email" class="input" placeholder="you@example.com">
  </div>
  
  <div>
    <label class="block text-sm font-semibold mb-1">Password</label>
    <input type="password" class="input input-error" placeholder="••••••••">
    <p class="mt-1 text-xs text-rose-deep">Password must be at least 8 characters</p>
  </div>
  
  <button type="submit" class="btn btn-ink btn-md w-full">Sign In</button>
</form>
```

### Card with Action Buttons
```html
<div class="card">
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-bold">Ride Offer</h3>
      <p class="text-sm text-text-soft">Mumbai → Pune</p>
    </div>
    <span class="badge badge-banyan">Active</span>
  </div>
  
  <div class="divider"></div>
  
  <div class="flex gap-2">
    <button class="btn btn-outline btn-sm flex-1">Edit</button>
    <button class="btn btn-danger btn-sm flex-1">Cancel</button>
  </div>
</div>
```

## Best Practices

1. **Consistency:** Always use the defined button classes instead of inline styles
2. **Accessibility:** Include proper ARIA labels and semantic HTML
3. **Icons:** Use Lucide icons consistently (already loaded in base.html)
4. **Colors:** Reference CSS variables for colors instead of hardcoding hex values
5. **Responsive:** Most components are mobile-first and responsive by default
6. **Animations:** Respect `prefers-reduced-motion` — all animations honor this setting
7. **Loading States:** Use spinners or skeleton loaders for async operations
8. **Forms:** Always provide validation feedback using `.input-error` and error messages

## Component Checklist

When building a new page or feature:
- [ ] Use semantic HTML (header, main, section, article, nav, footer)
- [ ] Apply button classes (`.btn` + variant + size)
- [ ] Use card components for grouped content
- [ ] Add loading states (spinner/skeleton)
- [ ] Include empty states when lists can be empty
- [ ] Add status badges where applicable
- [ ] Use alert components for user feedback
- [ ] Ensure mobile responsiveness
- [ ] Test with keyboard navigation
- [ ] Add Lucide icons for visual clarity
