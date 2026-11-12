import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles/global.css';
import './styles/v6.css';
import './styles/v7.css';
import './styles/v8.css';
import './styles/workspace.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(<App />);
