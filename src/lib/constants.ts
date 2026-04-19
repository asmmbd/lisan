/**
 * This file acts as a manual "safelist" for Tailwind CSS.
 * Since we are using dynamic classes for category gradients stored in the database,
 * we need to ensure Tailwind's compiler sees these strings in a source file
 * so they are not purged during the build process.
 */

export const safelistClasses = [
  // Category Gradients
  'from-emerald-600', 'to-green-700',
  'from-green-600', 'to-teal-700',
  'from-teal-500', 'to-emerald-600',
  'from-green-500', 'to-lime-600',
  'from-emerald-500', 'to-green-600',
  'from-teal-600', 'to-green-500',
  'from-lime-500', 'to-green-600',
  'from-green-600', 'to-emerald-500',
  
  // Default values
  'from-primary', 'to-primary/80',
  
  // Status Colors
  'text-emerald-500', 'text-amber-500', 'text-rose-500',
  'bg-emerald-500/10', 'bg-amber-500/10', 'bg-rose-500/10'
]
