/**
 * @file theme.service.ts
 * Dynamic Theme Engine injecting CSS custom variables to the root DOM
 */

import { db } from './db.service';
import type { ThemeId } from '../types/db.types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  primary: string; // Brand dominant color
  primaryGradient: string; // Hero header gradient
  secondary: string; // Deep contrast color
  accent: string; // Highlights & badges
  cardBg: string; // Header card background
  badgeText: string;
  previewColors: string[];
}

export const THEME_PRESETS: Record<ThemeId, ThemeConfig> = {
  'classic-orange': {
    id: 'classic-orange',
    name: 'iVault Classic Orange',
    subtitle: 'Signature Orange & Navy Banking Gradient',
    primary: '#C93B2B',
    primaryGradient: 'linear-gradient(135deg, #C93B2B 0%, #A52316 55%, #002D62 100%)',
    secondary: '#002D62',
    accent: '#F59E0B',
    cardBg: '#A52316',
    badgeText: '#FFFFFF',
    previewColors: ['#C93B2B', '#A52316', '#002D62', '#F59E0B'],
  },
  'emerald-wealth': {
    id: 'emerald-wealth',
    name: 'Emerald Wealth Private',
    subtitle: 'Prestige Forest & Jade Financial Growth',
    primary: '#047857',
    primaryGradient: 'linear-gradient(135deg, #059669 0%, #047857 55%, #064E3B 100%)',
    secondary: '#064E3B',
    accent: '#10B981',
    cardBg: '#047857',
    badgeText: '#FFFFFF',
    previewColors: ['#059669', '#047857', '#064E3B', '#10B981'],
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Purple Privilege',
    subtitle: 'Exclusive High-Net-Worth Private Banking',
    primary: '#7E22CE',
    primaryGradient: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 55%, #3B0764 100%)',
    secondary: '#3B0764',
    accent: '#F43F5E',
    cardBg: '#6B21A8',
    badgeText: '#FFFFFF',
    previewColors: ['#9333EA', '#7E22CE', '#3B0764', '#F43F5E'],
  },
  'dark-slate': {
    id: 'dark-slate',
    name: 'Titanium Dark Slate',
    subtitle: 'Stealth High-Contrast Obsidian Banking',
    primary: '#1E293B',
    primaryGradient: 'linear-gradient(135deg, #334155 0%, #1E293B 60%, #0F172A 100%)',
    secondary: '#0F172A',
    accent: '#38BDF8',
    cardBg: '#1E293B',
    badgeText: '#FFFFFF',
    previewColors: ['#334155', '#1E293B', '#0F172A', '#38BDF8'],
  },
  'ruby-privilege': {
    id: 'ruby-privilege',
    name: 'Ruby Velvet Privilege',
    subtitle: 'Crimson Reserve & Luxury Tier',
    primary: '#BE123C',
    primaryGradient: 'linear-gradient(135deg, #E11D48 0%, #BE123C 60%, #4C0519 100%)',
    secondary: '#4C0519',
    accent: '#FBBF24',
    cardBg: '#9F1239',
    badgeText: '#FFFFFF',
    previewColors: ['#E11D48', '#BE123C', '#4C0519', '#FBBF24'],
  },
};

export class ThemeService {
  public static currentTheme: ThemeId = 'classic-orange';

  /**
   * Apply theme by updating CSS custom properties on document.documentElement
   */
  public static applyTheme(themeId: string): void {
    const normalizedId = themeId === 'icici-classic' ? 'classic-orange' : (themeId as ThemeId);
    const validThemeId = THEME_PRESETS[normalizedId] ? normalizedId : 'classic-orange';
    const theme = THEME_PRESETS[validThemeId];
    this.currentTheme = validThemeId;

    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-gradient', theme.primaryGradient);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-card-bg', theme.cardBg);

    // Update meta theme-color for browser tab & Android/iOS system status bar
    const metaThemeColor = document.querySelector?.('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.primary);
    }
  }

  /**
   * Persist chosen theme to IndexedDB settings
   */
  public static async saveTheme(themeId: ThemeId): Promise<void> {
    this.applyTheme(themeId);
    const settings = await db.appSettings.get('default');
    if (settings) {
      settings.theme = themeId;
      await db.appSettings.put(settings);
    }
  }

  /**
   * Load saved theme on application start
   */
  public static async loadSavedTheme(): Promise<ThemeId> {
    const settings = await db.appSettings.get('default');
    const rawThemeId = settings?.theme || 'classic-orange';
    const themeId = (rawThemeId === ('icici-classic' as any) ? 'classic-orange' : rawThemeId) as ThemeId;
    this.applyTheme(themeId);
    return themeId;
  }
}
