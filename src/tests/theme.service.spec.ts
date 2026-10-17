/**
 * @file theme.service.spec.ts
 * Unit Test Suite for Dynamic Theme Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import './setup';
import { THEME_PRESETS, ThemeService } from '../services/theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    // Reset root element inline styles
    document.documentElement.removeAttribute('style');
  });

  it('should have all 5 banking theme presets defined with complete gradients and contrast colors', () => {
    const presetKeys = Object.keys(THEME_PRESETS);
    expect(presetKeys).toContain('classic-orange');
    expect(presetKeys).toContain('emerald-wealth');
    expect(presetKeys).toContain('royal-purple');
    expect(presetKeys).toContain('dark-slate');
    expect(presetKeys).toContain('ruby-privilege');

    for (const key of presetKeys) {
      const theme = THEME_PRESETS[key as keyof typeof THEME_PRESETS];
      expect(theme.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.primaryGradient).toContain('linear-gradient');
      expect(theme.previewColors.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('should inject CSS custom properties to document.documentElement when applied', () => {
    ThemeService.applyTheme('emerald-wealth');

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--theme-primary')).toEqual('#047857');
    expect(style.getPropertyValue('--theme-secondary')).toEqual('#064E3B');
    expect(style.getPropertyValue('--theme-accent')).toEqual('#10B981');
    expect(style.getPropertyValue('--theme-primary-gradient')).toContain('linear-gradient');
  });

  it('should fallback to classic-orange if an unknown theme ID is provided', () => {
    ThemeService.applyTheme('non-existent-theme');

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--theme-primary')).toEqual('#C93B2B');
    expect(ThemeService.currentTheme).toEqual('classic-orange');
  });

  it('should map legacy icici-classic to classic-orange seamlessly', () => {
    ThemeService.applyTheme('icici-classic');
    expect(ThemeService.currentTheme).toEqual('classic-orange');
  });
});
