import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { IconHeadset } from '@tabler/icons-react';
import { t } from '../i18n/locale.js';
import { useLocale } from '../i18n/react.jsx';
import { TechnicalSupportDialog } from './TechnicalSupportDialog.jsx';
import './technical-support.css';

const SupportContext = createContext(null);
export const useTechnicalSupport = () => useContext(SupportContext);

export function TechnicalSupportProvider({ children }) {
  useLocale();
  const [request, setRequest] = useState(() => window.location.hash === '#support' ? { section: 'team' } : null);
  const lastFocus = useRef(null);
  const openSupport = (section = 'team', source = 'support') => {
    lastFocus.current = document.activeElement;
    setRequest({ section, source });
  };
  const closeSupport = () => {
    setRequest(null);
    if (window.location.hash === '#support') window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  };
  useEffect(() => {
    const handleHash = () => { if (window.location.hash === '#support') openSupport(); };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  // Restore after background inert has been removed, including a closed help panel.
  useEffect(() => {
    if (request || !lastFocus.current) return;
    const target = lastFocus.current.isConnected ? lastFocus.current
      : [...document.querySelectorAll('.technical-support-button')].find(button => button.getClientRects().length);
    target?.focus({ preventScroll: true });
  }, [request]);
  return <SupportContext.Provider value={{ openSupport, isSupportOpen: Boolean(request) }}>
    <div className="support-workspace" inert={Boolean(request)}>{children}</div>
    {request && <TechnicalSupportDialog initialSection={request.section} source={request.source} onClose={closeSupport} />}
  </SupportContext.Provider>;
}

export function TechnicalSupportButton({ section = 'team', source = 'support', label = '技术支持', className = '' }) {
  const { openSupport, isSupportOpen } = useTechnicalSupport();
  return <button type="button" className={`technical-support-button ${className}`} onClick={() => openSupport(section, source)} aria-haspopup="dialog" aria-expanded={isSupportOpen}>
    <IconHeadset size={17} stroke={1.7} aria-hidden="true" /><span>{t(label)}</span>
  </button>;
}
