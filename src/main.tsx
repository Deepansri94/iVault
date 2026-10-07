import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA compliance and Android WebAPK installation
if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('iVault Pro Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.warn('iVault Pro Service Worker registration notice:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
