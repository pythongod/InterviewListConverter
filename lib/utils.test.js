import { cn } from './utils';

describe('cn', () => {
  // 1. Basic String Merging
  test('should merge basic strings', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  // 2. Conditional Logic (from clsx)
  test('should handle conditional object with true/false values', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  test('should handle array and conditional object', () => {
    expect(cn(['class1', 'class2'], { class3: true })).toBe('class1 class2 class3');
  });

  // 3. Tailwind CSS Conflict Resolution (from tailwind-merge)
  test('should resolve conflicting Tailwind classes, last one wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  test('should merge non-conflicting Tailwind classes and resolve conflicts', () => {
    expect(cn('p-2 m-2', 'p-4')).toBe('m-2 p-4');
  });

  test('should resolve conflicts with conditional classes', () => {
    expect(cn('text-sm', 'text-lg', { 'font-bold': true })).toBe('text-lg font-bold');
  });

  // 4. Handling of Falsy Values
  test('should handle falsy values correctly', () => {
    expect(cn('class1', null, 'class2', undefined, { class3: true, class4: null })).toBe('class1 class2 class3');
  });

  // 5. Complex Mix
  test('should handle a complex mix of strings, arrays, objects, and Tailwind conflicts', () => {
    expect(cn('bg-red-500', ['p-4', { 'text-white': true }], 'bg-blue-500')).toBe('p-4 text-white bg-blue-500');
  });

  test('should handle multiple conflicting classes of the same group', () => {
    expect(cn('px-2 p-2', 'px-4 p-4')).toBe('px-4 p-4');
  });
  
  test('should handle conflicting items across different types of inputs', () => {
    expect(cn('px-2', { 'px-4': true }, ['px-6'])).toBe('px-6');
  });

  test('should maintain order for non-Tailwind classes while merging Tailwind classes', () => {
    expect(cn('custom-class1', 'px-2', 'custom-class2', 'px-4')).toBe('custom-class1 custom-class2 px-4');
  });
});
