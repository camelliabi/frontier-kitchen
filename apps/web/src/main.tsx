import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameSession } from '@frontier/game-core';
import { createInitialState, ingredients, cookingRules } from '@frontier/game-data';
import { App } from './App';
import { LanguageStore, readSavedLocale } from './i18n';
import './styles/main.css';

const session = new GameSession(createInitialState(), ingredients, cookingRules);
const language = new LanguageStore(readSavedLocale());
createRoot(document.getElementById('root')!).render(<React.StrictMode><App session={session} language={language}/></React.StrictMode>);
