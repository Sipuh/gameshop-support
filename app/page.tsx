'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: string;
  key: string;
  name: string;
  description: string | null;
  colorClass: string;
  borderColor: string;
  icon: string | null;
  order: number;
  _count: { articles: number };
}

interface Article {
  id: string;
  title: string;
  code: string | null;
  description: string;
  solution: string;
  image: string | null;
  categoryId: string;
  category: Category;
  order: number;
}

const IMG_PREFIX = '/images/';

function getImgSrc(cat: Category): string {
  // Если есть icon - используем API для получения из БД, иначе fallback на файл
  if (cat.id) {
    // Пытаемся загрузить из БД через API
  }
  const map: Record<string, string> = {
    ps5: 'PS-5.png',
    ps4: 'PS-4.png',
    network: 'Network.png',
    account: 'Users.png',
    hardware: 'PS5.png',
    games: 'Shop.png',
  };
  return IMG_PREFIX + (map[cat.key] || `${cat.key}.png`);
}

function getCardClass(key: string): string {
  return `cat-card cat-card--${key}`;
}

function pluralForm(n: number): string {
  if (n === 1) return 'статья';
  if (n >= 2 && n <= 4) return 'статьи';
  return 'статей';
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: Category[]) => {
        setCategories(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      fetch(`/api/articles/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then(setArticles);
    } else if (!selectedCategory) {
      setArticles([]);
    }
  }, [searchQuery, selectedCategory]);

  const loadCategoryArticles = async (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setSelectedArticle(null);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/articles?category=${categoryKey}`);
      const data = await res.json();
      setArticles(data);
    } catch {
      setArticles([]);
    }
  };

  const loadArticle = async (articleId: string) => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const data = await res.json();
      setSelectedArticle(data);
    } catch {
      setSelectedArticle(null);
    }
  };

  const goHome = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
    setArticles([]);
    setSearchQuery('');
  };

  const goBackToList = () => {
    setSelectedArticle(null);
  };

  const toggleCategory = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
    loadCategoryArticles(key);
  };

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  // ─── СТРАНИЦА СТАТЬИ ───
  if (selectedArticle) {
    return (
      <div className="layout">
        <Sidebar
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expandedCategory={expandedCategory}
          toggleCategory={toggleCategory}
          loadArticle={loadArticle}
        />
        <div className="main">
          <div className="content-area">
            <a onClick={goBackToList} className="back-link">← Назад к списку</a>
            <div className="article-container">
              <div className="article-card">
                <div className="article-card-inner">
                  <h2 className="article-title">{selectedArticle.title}</h2>
                  <div className="article-code-tag">
                    Код ошибки: {selectedArticle.code || 'не указан'}
                  </div>
                  {selectedArticle.image && (
                    <div style={{ marginBottom: 16 }}>
                      <img src={selectedArticle.image} alt="" style={{ maxWidth: '100%', borderRadius: 8 }} />
                    </div>
                  )}
                  <div className="article-desc-box">
                    <h3>📄 Описание проблемы</h3>
                    <p>{selectedArticle.description}</p>
                  </div>
                  <div className="article-solution-box">
                    <h3>🔧 Решение</h3>
                    <div>{selectedArticle.solution}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── СПИСОК СТАТЕЙ КАТЕГОРИИ ИЛИ ПОИСК ───
  if (selectedCategory || searchQuery) {
    return (
      <div className="layout">
        <Sidebar
          categories={categories}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expandedCategory={expandedCategory}
          toggleCategory={toggleCategory}
          loadArticle={loadArticle}
        />
        <div className="main">
          <div className="content-area">
            <a onClick={goHome} className="back-link">← Назад к категориям</a>
            <div className="section-title">
              {searchQuery
                ? `Результаты поиска (${articles.length})`
                : 'Список ошибок'}
            </div>
            {articles.length === 0 ? (
              <p style={{ color: 'var(--text-dim)' }}>Ничего не найдено</p>
            ) : (
              <ul className="simple-error-list">
                {articles.map((article) => (
                  <li key={article.id}>
                    <a onClick={() => loadArticle(article.id)}>
                      {article.title}
                      {article.code && (
                        <span style={{ marginLeft: 10, color: 'var(--text-muted)', fontSize: 12 }}>
                          ({article.code})
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── ГЛАВНАЯ СТРАНИЦА ───
  return (
    <div className="layout">
      <Sidebar
        categories={categories}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        expandedCategory={expandedCategory}
        toggleCategory={toggleCategory}
        loadArticle={loadArticle}
      />
      <div className="main">
        <section className="hero">
          <div className="hero-image-container">
            <img
              className="hero-image"
              src={`${IMG_PREFIX}hero-image.png`}
              alt="Gameshop баннер"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </section>
        <div className="content-area">
          <div className="section-title">Категории проблем</div>
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={getCardClass(cat.key)}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  loadCategoryArticles(cat.key);
                }}
              >
                <div className="cat-card-img">
                  <img
                    className="category-img"
                    src={`/api/categories/${cat.id}/image`}
                    alt={cat.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Fallback на статический файл
                      target.src = getImgSrc(cat);
                    }}
                  />
                </div>
                <div className="cat-card-content">
                  <div className={`cat-card-name ${cat.colorClass}`}>{cat.name}</div>
                  <div className="cat-card-desc">
                    {cat.description || `Решения для ${cat.name}`}
                  </div>
                  <div className="cat-card-footer">
                    <span className="cat-count" style={{ color: cat.borderColor }}>
                      {cat._count.articles} {pluralForm(cat._count.articles)}
                    </span>
                    <span className="cat-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ───
function Sidebar({
  categories,
  searchQuery,
  setSearchQuery,
  expandedCategory,
  toggleCategory,
  loadArticle,
}: {
  categories: Category[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedCategory: string | null;
  toggleCategory: (key: string) => void;
  loadArticle: (id: string) => void;
}) {
  const [subArticles, setSubArticles] = useState<Record<string, Article[]>>({});
  const [loadingArticles, setLoadingArticles] = useState<Record<string, boolean>>({});

  const handleToggle = async (key: string) => {
    toggleCategory(key);

    if (subArticles[key] || loadingArticles[key]) return;

    setLoadingArticles((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/articles?category=${key}`);
      const data = await res.json();
      setSubArticles((prev) => ({ ...prev, [key]: data }));
    } catch {
      // ignore
    }
    setLoadingArticles((prev) => ({ ...prev, [key]: false }));
  };

  const handleSubArticleClick = (article: Article) => {
    loadArticle(article.id);
  };

  return (
    <aside className="sidebar">
      <div className="logo-wrap">
        <div className="logo-icon">
          <div className="logo-img-placeholder">🎮</div>
          <span className="logo-text">GAMESHOP</span>
        </div>
        <span className="logo-sub">Библиотека поддержки</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Поиск</div>
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Поиск по статьям…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Категории</div>
        <ul className="nav-list">
          {categories.map((cat) => (
            <li key={cat.id} className={`nav-item ${expandedCategory === cat.key ? 'active' : ''}`}>
              <a onClick={() => handleToggle(cat.key)}>
                <span className="nav-icon">
                  <img
                    className="sidebar-icon-img"
                    src={`/api/categories/${cat.id}/image`}
                    alt={cat.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Fallback на статический файл
                      target.src = getImgSrc(cat);
                    }}
                  />
                </span>
                {cat.name}
                <span className="nav-arrow">
                  {expandedCategory === cat.key ? '▼' : '▶'}
                </span>
              </a>
              <ul className={`sub-articles ${expandedCategory === cat.key ? 'show' : ''}`}>
                {(subArticles[cat.key] || []).map((article) => (
                  <li key={article.id} onClick={() => handleSubArticleClick(article)}>
                    📄 {article.title}
                  </li>
                ))}
                {loadingArticles[cat.key] && (
                  <li style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Загрузка...</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
