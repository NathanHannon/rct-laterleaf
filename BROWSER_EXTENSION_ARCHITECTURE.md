# LaterLeaf Browser Extension + Hybrid Architecture

## Overview
A hybrid system that supports both browser extension extraction (perfect for tough sites) and fallback server-side extraction (for web-only users).

## Architecture Components

### 1. Browser Extension Structure
```
laterleaf-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API communication
├── content-script.js      # Runs on web pages
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup logic
│   └── popup.css         # Popup styling
└── lib/
    ├── readability.js    # Mozilla Readability library
    └── auth.js           # Authentication handling
```

### 2. Extension Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "LaterLeaf - Smart Article Saver",
  "version": "1.0",
  "description": "Save articles with AI-powered summaries",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ],
  "host_permissions": [
    "https://your-laterleaf-domain.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["lib/readability.js", "content-script.js"]
  }],
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "Save to LaterLeaf"
  }
}
```

### 3. Content Script (content-script.js)
```javascript
// Injected into every page to extract content when requested
class LaterLeafExtractor {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extract') {
        this.extractArticle()
          .then(article => sendResponse({ success: true, article }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
      }
    });
  }

  async extractArticle() {
    // Wait for any lazy-loaded content
    await this.waitForContent();

    // Clone document to avoid modifying the original
    const documentClone = document.cloneNode(true);
    
    // Use Mozilla Readability for extraction
    const reader = new Readability(documentClone, {
      debug: false,
      maxElemsToParse: 0,
      nbTopCandidates: 5,
      charThreshold: 500,
      classesToPreserve: ['highlight', 'code-block']
    });

    const article = reader.parse();
    
    if (!article) {
      throw new Error('Could not extract article content from this page');
    }

    // Enhanced metadata extraction
    const metadata = this.extractMetadata();
    
    return {
      url: window.location.href,
      title: article.title || document.title,
      content: article.textContent,
      html: article.content,
      excerpt: article.excerpt,
      siteName: metadata.siteName,
      author: metadata.author,
      publishDate: metadata.publishDate,
      image: metadata.image,
      wordCount: article.textContent.split(/\s+/).length,
      extractedAt: new Date().toISOString(),
      extractionMethod: 'extension'
    };
  }

  extractMetadata() {
    const getMetaContent = (name) => {
      const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return element ? element.content : null;
    };

    return {
      siteName: getMetaContent('og:site_name') || document.domain,
      author: getMetaContent('author') || getMetaContent('article:author'),
      publishDate: getMetaContent('article:published_time') || getMetaContent('publishdate'),
      image: getMetaContent('og:image') || getMetaContent('twitter:image'),
      description: getMetaContent('description') || getMetaContent('og:description')
    };
  }

  waitForContent(timeout = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkContent = () => {
        const hasContent = document.body && document.body.innerText.trim().length > 500;
        const timeElapsed = Date.now() - startTime;
        
        if (hasContent || timeElapsed > timeout) {
          resolve();
        } else {
          setTimeout(checkContent, 100);
        }
      };
      
      checkContent();
    });
  }
}

// Initialize extractor
new LaterLeafExtractor();
```

### 4. Extension Popup (popup.js)
```javascript
class LaterLeafPopup {
  constructor() {
    this.apiBase = 'https://your-laterleaf-domain.com/api';
    this.init();
  }

  async init() {
    this.setupUI();
    await this.checkAuthStatus();
    this.attachEventListeners();
  }

  setupUI() {
    document.getElementById('save-btn').addEventListener('click', () => this.saveArticle());
    document.getElementById('login-btn').addEventListener('click', () => this.openLogin());
  }

  async checkAuthStatus() {
    const token = await this.getStoredToken();
    const isLoggedIn = token && await this.validateToken(token);
    
    document.getElementById('logged-in-view').style.display = isLoggedIn ? 'block' : 'none';
    document.getElementById('login-view').style.display = isLoggedIn ? 'none' : 'block';
  }

  async saveArticle() {
    const saveBtn = document.getElementById('save-btn');
    const statusDiv = document.getElementById('status');
    
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Extracting...';
      statusDiv.textContent = 'Extracting article content...';

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Extract content from the page
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
      
      if (!response.success) {
        throw new Error(response.error);
      }

      statusDiv.textContent = 'Saving to LaterLeaf...';
      
      // Send to backend
      await this.sendToBackend(response.article);
      
      statusDiv.textContent = '✅ Article saved successfully!';
      statusDiv.className = 'status success';
      
      setTimeout(() => window.close(), 1500);
      
    } catch (error) {
      statusDiv.textContent = `❌ Error: ${error.message}`;
      statusDiv.className = 'status error';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Article';
    }
  }

  async sendToBackend(article) {
    const token = await this.getStoredToken();
    
    const response = await fetch(`${this.apiBase}/articles/from-extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(article)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to save article');
    }

    return response.json();
  }

  async getStoredToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['laterleaf_token'], (result) => {
        resolve(result.laterleaf_token);
      });
    });
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${this.apiBase}/auth/validate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  openLogin() {
    chrome.tabs.create({ url: 'https://your-laterleaf-domain.com/login?ext=true' });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new LaterLeafPopup();
});
```

### 5. Backend Extension Endpoint (LoopBack Controller)
```typescript
// In your existing article.controller.ts
@post('/articles/from-extension')
@authenticate('clerk')
async createFromExtension(
  @requestBody({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['url', 'title', 'content'],
          properties: {
            url: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            html: { type: 'string' },
            excerpt: { type: 'string' },
            siteName: { type: 'string' },
            author: { type: 'string' },
            publishDate: { type: 'string' },
            image: { type: 'string' },
            wordCount: { type: 'number' },
            extractedAt: { type: 'string' },
            extractionMethod: { type: 'string' }
          }
        }
      }
    }
  })
  extractedArticle: ExtractedArticleData,
  @inject(SecurityBindings.USER) currentUser: UserProfile,
): Promise<{ success: boolean; article: Article }> {
  try {
    // Check for duplicates
    const existing = await this.articleRepository.findOne({
      where: { url: extractedArticle.url }
    });

    if (existing) {
      // Check if user already has this article
      const userArticle = await this.userArticleRepository.findOne({
        where: { 
          userId: currentUser.id,
          articleId: existing.id 
        }
      });

      if (userArticle) {
        throw new HttpErrors.Conflict('Article already saved');
      }

      // Create user-article relationship
      await this.userArticleRepository.create({
        userId: currentUser.id,
        articleId: existing.id,
        isBookmarked: false,
        isArchived: false,
        status: 'unread'
      });

      return { success: true, article: existing };
    }

    // Create new article
    const article = await this.articleRepository.create({
      url: extractedArticle.url,
      title: extractedArticle.title,
      content: extractedArticle.content,
      html: extractedArticle.html,
      excerpt: extractedArticle.excerpt,
      siteName: extractedArticle.siteName,
      author: extractedArticle.author,
      publishDate: extractedArticle.publishDate ? new Date(extractedArticle.publishDate) : undefined,
      imageUrl: extractedArticle.image,
      wordCount: extractedArticle.wordCount,
      extractionMethod: 'extension'
    });

    // Create user-article relationship
    await this.userArticleRepository.create({
      userId: currentUser.id,
      articleId: article.id,
      isBookmarked: false,
      isArchived: false,
      status: 'unread'
    });

    // Generate AI summary in background (don't wait)
    this.generateSummaryAsync(article.id, currentUser.id, extractedArticle.content);

    return { success: true, article };

  } catch (error) {
    if (error instanceof HttpErrors.HttpError) {
      throw error;
    }
    console.error('Extension article creation error:', error);
    throw new HttpErrors.BadRequest('Failed to save article from extension');
  }
}

private async generateSummaryAsync(articleId: string, userId: string, content: string) {
  try {
    // Generate summary using your existing service
    const summary = await this.genAiService.generateSummary(content);
    
    // Update user-article with summary
    await this.userArticleRepository.updateById(articleId, {
      summary: summary
    });
  } catch (error) {
    console.error('Background summary generation failed:', error);
  }
}
```

### 6. Hybrid Fallback Logic
```typescript
// Modified existing import endpoint
@post('/articles/import')
@authenticate('clerk')
async importArticle(
  @requestBody() body: { url: string },
  @inject(SecurityBindings.USER) currentUser: UserProfile,
): Promise<{ success: boolean; article: Article; extractionMethod: string }> {
  try {
    // Try your existing extraction service first
    const extractedData = await this.contentExtractionService.extractContent(body.url);
    
    const article = await this.createArticleFromExtraction(extractedData, currentUser);
    
    return { 
      success: true, 
      article,
      extractionMethod: 'server' 
    };

  } catch (error) {
    // If server extraction fails, suggest extension
    throw new HttpErrors.BadRequest(
      'Could not extract this article. Try using the LaterLeaf browser extension for better compatibility with this site.'
    );
  }
}
```

## Implementation Phases

### Phase 1: Basic Extension (Week 1-2)
- Content script with Readability extraction
- Simple popup UI for save/login
- Backend endpoint for extension data
- Chrome Web Store submission

### Phase 2: Enhanced Features (Week 3-4)
- Context menu integration
- Duplicate detection
- Offline queue for failed saves
- Firefox support

### Phase 3: Pro Features (Week 5-6)
- Instant summary preview in popup
- Quick search from extension
- Auto-tagging suggestions
- Reading progress tracking

## Benefits Summary

### For Users:
- ✅ Works with ANY site they can access (including paywalled)
- ✅ One-click saving from anywhere
- ✅ Perfect extraction quality
- ✅ Instant feedback

### For You:
- ✅ Solves tough site extraction without APIs
- ✅ No scraping infrastructure costs
- ✅ Competitive advantage over Pocket
- ✅ Higher user engagement (extension keeps you top-of-mind)

### Technical:
- ✅ Leverages user's legitimate site access
- ✅ Impossible to block (real browser context)
- ✅ Scales with users (no server load for extraction)
- ✅ Hybrid fallback maintains web-only functionality

This architecture gives you the perfect solution: extension users get perfect extraction for any site, while web-only users still get your current (good enough) server-side extraction.