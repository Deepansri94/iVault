/**
 * @file Router.tsx
 * Lightweight, zero-dependency browser router with HTML5 history support,
 * path normalization, ecosystem app detection, and subroute awareness.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type EcosystemAppId = 'hub' | 'fintracker' | 'familydocs' | 'healthmeds' | 'passvault' | 'settings';

export interface RouteState {
  pathname: string;
  normalizedPath: string;
  appId: EcosystemAppId;
  subPath: string;
  search: string;
  searchParams: URLSearchParams;
}

interface RouterContextType extends RouteState {
  navigate: (to: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

/**
 * Normalizes any URL path, stripping base directory prefixes like /iVault/
 * and handling case-insensitive app route matches.
 */
export function normalizePathname(rawPath: string): { normalizedPath: string; appId: EcosystemAppId; subPath: string } {
  let p = rawPath || '/';
  
  // If hash routing is used as fallback (e.g. /#/fintracker)
  if (p.includes('#')) {
    const hashIndex = p.indexOf('#');
    p = p.substring(hashIndex + 1);
  }

  // Strip query string if embedded in path
  if (p.includes('?')) {
    p = p.split('?')[0];
  }

  // Strip trailing slashes unless it's just '/'
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }

  // Strip legacy /iVault or base prefix if present
  if (p.toLowerCase().startsWith('/ivault')) {
    p = p.slice(7) || '/';
  }

  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  const segments = p.split('/').filter(Boolean);
  const first = (segments[0] || '').toLowerCase();
  const sub = segments.slice(1).join('/');

  if (first === 'fintracker' || first === 'finance') {
    return { normalizedPath: '/fintracker' + (sub ? `/${sub}` : ''), appId: 'fintracker', subPath: sub };
  }
  if (first === 'familydocs' || first === 'documents' || first === 'docs') {
    return { normalizedPath: '/familyDocs' + (sub ? `/${sub}` : ''), appId: 'familydocs', subPath: sub };
  }
  if (first === 'healthmeds' || first === 'medicines' || first === 'meds' || first === 'health') {
    return { normalizedPath: '/healthMeds' + (sub ? `/${sub}` : ''), appId: 'healthmeds', subPath: sub };
  }
  if (first === 'passvault' || first === 'vault' || first === 'passwords') {
    return { normalizedPath: '/passVault' + (sub ? `/${sub}` : ''), appId: 'passvault', subPath: sub };
  }
  if (first === 'settings') {
    return { normalizedPath: '/settings' + (sub ? `/${sub}` : ''), appId: 'settings', subPath: sub };
  }

  return { normalizedPath: '/', appId: 'hub', subPath: '' };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUrl, setCurrentUrl] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const routeDetails = useMemo(() => {
    const { normalizedPath, appId, subPath } = normalizePathname(currentUrl.pathname);
    return {
      pathname: currentUrl.pathname,
      normalizedPath,
      appId,
      subPath,
      search: currentUrl.search,
      searchParams: new URLSearchParams(currentUrl.search),
    };
  }, [currentUrl]);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    let target = to;
    if (!target.startsWith('/')) {
      target = '/' + target;
    }

    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }

    setCurrentUrl({
      pathname: window.location.pathname,
      search: window.location.search,
    });

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Sync document title with active app
  useEffect(() => {
    switch (routeDetails.appId) {
      case 'fintracker':
        document.title = 'FinTracker Pro — Unified Wealth & Portfolio';
        break;
      case 'familydocs':
        document.title = 'FamilyDocs — Secure Family Document Vault';
        break;
      case 'healthmeds':
        document.title = 'HealthMeds — Medicine & Dose Tracker';
        break;
      case 'passvault':
        document.title = 'PassVault — AES-GCM Encrypted Password Vault';
        break;
      case 'settings':
        document.title = 'Settings — Ecosystem Configuration';
        break;
      default:
        document.title = 'iVault Ecosystem — Unified App Hub';
        break;
    }
  }, [routeDetails.appId]);

  return (
    <RouterContext.Provider value={{ ...routeDetails, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter(): RouterContextType {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return ctx;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

export const Link: React.FC<LinkProps> = ({ to, replace, onClick, children, className, ...rest }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    // Let browser handle middle-click, ctrl/cmd clicks for new tabs
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
};
