import './App.scss';
import Header from './components/Header/Header';
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
import AboutPage from './components/StaticPages/AboutPage/AboutPage';
import ContactPage from './components/StaticPages/ContactPage/ContactPage';
import PrivacyPage from './components/StaticPages/PrivacyPage/PrivacyPage';
import FAQPage from './components/StaticPages/FAQPage/FAQPage';
import ExportPage from './components/DataManagement/ExportPage/ExportPage';
import BulkImporter from './components/Developer/BulkImporter/BulkImporter';

function App() {
  return (
    <ToastProvider>
      <CollectionAnimationProvider>
        <SearchProvider>
          <BrowserRouter>
            <div className="app">
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
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="/export" element={<ExportPage />} />
                        <Route path="/import" element={<BulkImporter />} />
                      </Routes>
                    </SignedIn>
                    <SignedOut>
                      <Routes>
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/faq" element={<FAQPage />} />
                        <Route path="*" element={
                          <div className="signed-out-message">
                            <h2>Welcome to Later Leaf</h2>
                            <p>Please sign in to view and save articles.</p>
                          </div>
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
