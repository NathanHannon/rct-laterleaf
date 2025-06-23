import './App.scss';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ArticleList from './components/Articles/ArticleList/ArticleList';

function App() {
  return (
    <div className="app">
      <div className="layout-container">
        <Header />
        <main className="main-content">
          <div className="content-container">
            <ArticleList />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
