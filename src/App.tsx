import './App.scss';
import Header from './components/Navigation/Header/Header';
import Footer from './components/Footer/Footer';
import ArticleList from './components/Articles/ArticleList/ArticleList';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ArticleReader from './components/Articles/ArticleReader/ArticleReader';
import ArchivedArticles from './components/Articles/ArchivedArticles/ArchivedArticles';
import { SearchProvider } from './providers/searchProvider';
import BookmarkedArticles from './components/Articles/BookmarkedArticles/BookmarkedArticles';
import CollectionsList from './components/Collections/CollectionsList/CollectionsList';
import CollectionView from './components/Collections/CollectionView/CollectionView';
import { CollectionAnimationProvider } from './context/collectionAnimationContext';
import { ToastProvider } from './context/toastContext';
import AboutPage from './components/Pages/StaticPages/AboutPage/AboutPage';
import ContactPage from './components/Pages/StaticPages/ContactPage/ContactPage';
import PrivacyPage from './components/Pages/StaticPages/PrivacyPage/PrivacyPage';
import TermsPage from './components/Pages/StaticPages/TermsPage/TermsPage';
import FAQPage from './components/Pages/StaticPages/FAQPage/FAQPage';
import ExportPage from './components/Pages/ExportPage/ExportPage';
import DiscoverPage from './components/Pages/DiscoverPage/DiscoverPage';
import BulkImporter from './components/Developer/BulkImporter/BulkImporter';
import { useTheme } from './context/themeContext';
import HeroPage from './components/Pages/HeroPage/HeroPage';
import PricingPage from './components/Pages/PricingPage/PricingPage';
import Settings from './components/Pages/Settings/Settings';
import AdminPage from './components/Admin/AdminPage/AdminPage';

function App() {
  const { activeTheme } = useTheme();
  return (
    <ToastProvider>
      <CollectionAnimationProvider>
        <SearchProvider>
          <BrowserRouter>
            <div className={`app ${activeTheme}`}>
              <div className="layout-container">
                <Header />
                <main className="main-content">
                  <div className="content-container">
                    <SignedIn>
                      <Routes>
                        <Route path="/" element={<ArticleList />} />
                        <Route path="/articles" element={<ArticleList />} />
                        <Route path="/archive" element={<ArchivedArticles />} />
                        <Route path="/bookmarks" element={<BookmarkedArticles />} />
                        <Route path="/article/:articleId" element={<ArticleReader />} />
                        <Route path="/collections" element={<CollectionsList />} />
                        <Route path="/collections/:collectionId" element={<CollectionView />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/export" element={<ExportPage />} />
                        <Route path="/discover" element={<DiscoverPage />} />
                        <Route path="/import" element={<BulkImporter />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/hero-page" element={<HeroPage />} />
                      </Routes>
                    </SignedIn>
                    <SignedOut>
                      <Routes>
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="*" element={
                          // <div className="signed-out-message">
                          //   <h2>Welcome to Later Leaf</h2>
                          //   <p>Please sign in to view and save articles.</p>
                          // </div>
                          <HeroPage />
                        } />
                      </Routes>
                    </SignedOut>
                  </div>
                </main>
                <Footer />
              </div>
            </div>
          </BrowserRouter>
        </SearchProvider>
      </CollectionAnimationProvider>
    </ToastProvider>
  );
}

export default App;
