import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (error?: unknown) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileWidgetProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: (err?: unknown) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) || '',
  onSuccess,
  onError,
  onExpire,
  theme = 'dark',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(() => typeof window !== 'undefined' && !!window.turnstile);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector(`script[src*="turnstile/v0/api.js"]`);
    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = (err) => {
      if (onError) onError(err);
    };
    document.head.appendChild(script);

    return () => {
      // Keep script in head to prevent reloading on modal re-open
    };
  }, [siteKey, onError]);

  useEffect(() => {
    if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) return;

    // Clear previous widget instance if re-rendering
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onSuccess(token),
        'error-callback': (err) => onError?.(err),
        'expired-callback': () => onExpire?.(),
        theme,
        size: 'flexible',
      });
      widgetIdRef.current = id;
    } catch (err) {
      onError?.(err);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, onSuccess, onError, onExpire, theme]);

  if (!siteKey) {
    return null;
  }

  return (
    <div
      data-testid="turnstile-widget"
      className={`turnstile-container min-h-[65px] flex items-center justify-center my-2 rounded-xl bg-slate-900/40 border border-slate-800/60 p-2 ${className}`}
      aria-label="Security verification challenge"
    >
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
};
