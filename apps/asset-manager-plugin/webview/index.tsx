/**
 * Webview entry point.
 * This runs in the browser context inside the VS Code webview iframe.
 */

import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
