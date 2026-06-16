import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, KeyRound, Database, PlusCircle, LayoutGrid, Sparkles,
  RefreshCw, Trash2, Edit3, Clipboard, HelpCircle, Users, Mail, BellRing
} from 'lucide-react';

import { ToastProvider, useToast } from './components/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import FloatingBackToTop from './components/FloatingBackToTop';
import SEOHead from './components/SEOHead';

import RatingTicker from './components/Ticker';
import BreakingNews from './components/BreakingNews';
import CommandCenterHero from './components/CommandCenterHero';
import NEPSEWidget from './components/NEPSEWidget';
import InteractiveChart from './components/InteractiveChart';
import HomeCarousel from './components/HomeCarousel'; // NEW

import ArticleEditor from './components/ArticleEditor';
import QuickPostWizard from './components/QuickPostWizard';

import ArticleDetail from './components/ArticleDetail';

import CategoryPage from './pages/CategoryPage';
import ReportsPage from './pages/ReportsPage';
import DownloadsPage from './pages/DownloadsPage';
import ContactPage from './pages/ContactPage';
import
