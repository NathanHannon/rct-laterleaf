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
import ExplosionOverlay from './components/Collections/ExplosionOverlay/ExplosionOverlay';
import { ToastProvider } from './context/toastContext';

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
                      </Routes>
                    </SignedIn>
                    <SignedOut>
                      <div className="signed-out-message">
                        <h2>Welcome to Later Leaf</h2>
                        <p>Please sign in to view and save articles.</p>
                      </div>
                    </SignedOut>
                  </div>
                </main>
                <Footer />
              </div>
            </div>
            {/* Global explosion overlay */}
            <ExplosionOverlay />
          </BrowserRouter>
        </SearchProvider>
      </CollectionAnimationProvider>
    </ToastProvider>
  );
}

export default App;
