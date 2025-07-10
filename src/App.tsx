import './App.scss';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ArticleList from './components/Articles/ArticleList/ArticleList';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

function App() {
  return (
    <div className="app">
      <div className="layout-container">
        <Header />
        <main className="main-content">
          <div className="content-container">
            <SignedIn>
              <ArticleList />
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
  );
}

export default App;
