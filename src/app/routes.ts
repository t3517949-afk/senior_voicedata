import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SpeechDataPage } from './pages/SpeechDataPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { ConclusionPage } from './pages/ConclusionPage';
import { AboutPage } from './pages/AboutPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'speech-data', Component: SpeechDataPage },
      { path: 'evaluation', Component: EvaluationPage },
      { path: 'conclusion', Component: ConclusionPage },
      { path: 'about', Component: AboutPage },
    ],
  },
]);
