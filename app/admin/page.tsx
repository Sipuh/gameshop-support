'use client';

import { useEffect, useState, useRef } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Category {
  id: string;
  key: string;
  name: string;
  colorClass: string;
  borderColor: string;
  icon: string | null;
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

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    solution: '',
    categoryId: '',
    image: null as File | null,
    imagePreview: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch {
      setError('Ошибка подключения');
    }
  };

  const handleLogout = () => {
    setLogoutConfirm(false);
    setUser(null);
    localStorage.removeItem('admin_user');
    setEmail('');
    setPassword('');
  };

  const loadData = async () => {
    try {
      const [cats, arts] = await Promise.all([
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/articles').then(r => r.json()),
      ]);
      setCategories(cats);
      setArticles(arts);
      setCurrentPage(1);
    } catch {
      console.error('Failed to load data');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({ title: '', code: '', description: '', solution: '', categoryId: categories[0]?.id || '', image: null, imagePreview: '' });
    setModalOpen(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      code: article.code || '',
      description: article.description,
      solution: article.solution,
      categoryId: article.categoryId,
      image: null,
      imagePreview: article.image || '',
    });
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url || '';
  };

  const saveArticle = async () => {
    try {
      let imageUrl = formData.imagePreview;

      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }

      const payload = {
        title: formData.title,
        code: formData.code || null,
        description: formData.description,
        solution: formData.solution,
        categoryId: formData.categoryId,
        image: imageUrl || null,
        order: editingArticle?.order || 0,
      };

      const method = editingArticle ? 'PUT' : 'POST';
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (res.ok) {
        setModalOpen(false);
        loadData();
      } else {
        alert('Ошибка сохранения');
      }
    } catch {
      alert('Ошибка сохранения');
    }
  };

  const confirmDelete = (article: Article) => {
    setDeleteConfirm({ open: true, id: article.id, title: article.title });
  };

  const executeDelete = async () => {
    try {
      await fetch(`/api/articles/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm({ open: false, id: '', title: '' });
      loadData();
    } catch {
      alert('Ошибка удаления');
    }
  };

  const filteredArticles = articles
    .filter(a => filterCategory === 'all' || a.categoryId === filterCategory)
    .filter(a => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || (a.code?.toLowerCase() || '').includes(q);
    });

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getCategoryBadgeStyle = (key: string): { background: string; color: string } => {
    const map: Record<string, { background: string; color: string }> = {
      ps5:        { background: '#0c1e38', color: '#38bdf8' },
      ps4:        { background: '#0c1e3c', color: '#60a5fa' },
      network:    { background: '#0c2c1e', color: '#34d399' },
      account:    { background: '#1c1540', color: '#c084fc' },
      hardware:   { background: '#1c1540', color: '#a78bfa' },
      games:      { background: '#1c1230', color: '#e879f9' },
    };
    return map[key] || { background: '#1c1540', color: '#c084fc' };
  };

  // Login screen
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f17' }}>
        <div style={{ padding: '40px', background: '#161625', borderRadius: '16px', border: '1px solid #1e1e30', maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #7c5cfc, #5a3fd4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#fff' }}>G</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>GAMESHOP Admin</h2>
          </div>
          {error && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}
          <input
            style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#13131e', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none' }}
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoFocus
          />
          <div style={{ position: 'relative' }}>
            <input
              style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#13131e', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none', paddingRight: '40px' }}
              type={showPassword ? 'text' : 'password'} placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#4a4a6a', display: 'flex' }} tabIndex={-1}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <button
            onClick={handleLogin}
            style={{ width: '100%', marginTop: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #7c5cfc, #5a3fd4)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >Войти</button>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/" style={{ color: '#4a4a6a', fontSize: '13px' }}>На главную</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f0f17' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{ width: '210px', minWidth: '210px', background: '#13131e', borderRight: '1px solid #1e1e30', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div className="logo" style={{ padding: '18px 16px 16px', borderBottom: '1px solid #1e1e30', flexShrink: 0 }}>
          <div className="logo-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #7c5cfc, #5a3fd4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff', flexShrink: 0 }}>G</div>
            <div>
              <div className="logo-name" style={{ fontWeight: 700, fontSize: '14px', color: '#fff', letterSpacing: '0.5px' }}>GAMESHOP</div>
              <div className="logo-sub" style={{ fontSize: '11px', color: '#4a4a6a', marginTop: '1px' }}>Админ-панель</div>
            </div>
          </div>
        </div>

        <nav className="nav-section" style={{ padding: '16px 10px 4px' }}>
          <div className="nav-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#33334a', fontWeight: 600, padding: '0 8px', marginBottom: '6px' }}>Управление</div>
          <div className="nav-item active" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '2px', background: '#2a1e5e', color: '#c5b4ff' }}>
            <i className="ti ti-file-text" style={{ fontSize: '17px' }}></i> Статьи
          </div>
        </nav>

        <nav className="nav-section" style={{ padding: '16px 10px 4px' }}>
          <div className="nav-label" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#33334a', fontWeight: 600, padding: '0 8px', marginBottom: '6px' }}>Навигация</div>
          <a href="/" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', color: '#6a6a8e', fontSize: '13px', textDecoration: 'none', marginBottom: '2px', transition: 'background 0.12s, color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#b0b0d8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a6a8e'; }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '17px' }}></i> На сайт
          </a>
        </nav>

        <div style={{ flex: 1 }}></div>

        <div className="sidebar-bottom" style={{ borderTop: '1px solid #1e1e30', padding: '12px 10px 14px', flexShrink: 0 }}>
          <div className="user-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 8px', borderRadius: '8px' }}>
            <div className="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97c6a, #c45a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>{(user.email?.[0] || 'U').toUpperCase()}</div>
            <div>
              <div className="user-name" style={{ fontSize: '13px', fontWeight: 600, color: '#d0d0ec' }}>{user.email.split('@')[0]}</div>
              <div className="user-role" style={{ fontSize: '11px', color: '#4a4a6a' }}>Администратор</div>
            </div>
          </div>
          <div className="logout-btn" onClick={() => setLogoutConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', color: '#8888aa', fontSize: '12px', cursor: 'pointer', marginTop: '4px', borderRadius: '6px', border: '1px solid #1e1e30', transition: 'background 0.12s, color 0.12s, border-color 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = '#2e1010'; e.currentTarget.style.borderColor = '#4a1a1a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e1e30'; }}
          >
            <i className="ti ti-logout" style={{ fontSize: '15px' }}></i> Выйти
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header className="topbar" style={{ padding: '20px 26px 16px', borderBottom: '1px solid #1e1e30', flexShrink: 0 }}>
          <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4a4a6a', marginBottom: '8px' }}>
            <span>Статьи</span>
          </div>
          <div className="topbar-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>Статьи</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn-new" onClick={openCreateModal} style={{ background: 'linear-gradient(135deg, #7c5cfc, #5a3fd4)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <i className="ti ti-plus" style={{ fontSize: '16px' }}></i> Новая статья
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="content" style={{ flex: 1, overflowY: 'auto', padding: '22px 26px 30px' }}>

          {/* Filters */}
          <div className="filters-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '360px' }}>
              <input
                type="text" placeholder="Поиск по названию или коду..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', padding: '9px 36px 9px 14px', color: '#c0c0e0', fontSize: '13px', outline: 'none', transition: 'border-color 0.15s' }}
              />
              <i className="ti ti-search" style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: '#33334a', fontSize: '16px', pointerEvents: 'none' }}></i>
            </div>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              style={{ background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', padding: '9px 32px 9px 14px', color: '#6a6a8e', fontSize: '13px', appearance: 'none', cursor: 'pointer', minWidth: '150px', outline: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a4a6a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="all">Все категории</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <button className="filter-btn" style={{ background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', padding: '9px 14px', color: '#6a6a8e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#b0b0d8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#161625'; e.currentTarget.style.color = '#6a6a8e'; }}
            >
              <i className="ti ti-adjustments-horizontal"></i> Фильтры
            </button>
          </div>

          {/* Table */}
          <div className="table-wrap" style={{ background: '#161625', border: '1px solid #1e1e30', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#33334a', background: '#13131e', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap' }}>Изображение</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#33334a', background: '#13131e', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap' }}>Заголовок</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#33334a', background: '#13131e', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap' }}>Код</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#33334a', background: '#13131e', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap' }}>Категория</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.9px', color: '#33334a', background: '#13131e', borderBottom: '1px solid #1e1e30', whiteSpace: 'nowrap', width: '100px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedArticles.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#4a4a6a', fontSize: '14px' }}>Статей пока нет</td></tr>
                ) : (
                  paginatedArticles.map((article) => (
                    <tr key={article.id} style={{ transition: 'background 0.12s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#19192c'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #13131e' }}>
                        <div className="img-cell" style={{ width: '54px', height: '40px', borderRadius: '6px', background: '#1e1e30', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {article.image ? (
                            <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                          ) : (
                            <i className="ti ti-photo" style={{ color: '#33334a', fontSize: '20px' }}></i>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #13131e' }}>
                        <div className="title-text" style={{ color: '#d0d0ec', fontSize: '13px', fontWeight: 500, maxWidth: '240px', lineHeight: 1.4 }}>{article.title}</div>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #13131e' }}>
                        <span className="code-mono" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '12px', color: '#4a4a6a' }}>{article.code || '—'}</span>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #13131e' }}>
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', ...getCategoryBadgeStyle(article.category?.key || '') }}>
                          {article.category?.name || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #13131e' }}>
                        <div className="actions" style={{ display: 'flex', gap: '6px' }}>
                          <button className="action-btn" onClick={() => openEditModal(article)} title="Редактировать" style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #1e1e30', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a4a6a', fontSize: '15px', transition: 'background 0.12s, color 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#c0c0e0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a6a'; }}
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button className="action-btn del" onClick={() => confirmDelete(article)} title="Удалить" style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #1e1e30', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a4a6a', fontSize: '15px', transition: 'background 0.12s, color 0.12s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#2e1010'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#4a1a1a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a6a'; e.currentTarget.style.borderColor = '#1e1e30'; }}
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredArticles.length > ITEMS_PER_PAGE && (
              <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderTop: '1px solid #1e1e30', flexWrap: 'wrap', gap: '10px' }}>
                <div className="pagination-info" style={{ fontSize: '12px', color: '#33334a' }}>
                  Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)} из {filteredArticles.length} статей
                </div>
                <div className="page-btns" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{ minWidth: '30px', height: '30px', padding: '0 6px', borderRadius: '6px', border: '1px solid #1e1e30', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'default' : 'pointer', color: currentPage === 1 ? '#33334a' : '#6a6a8e', fontSize: '13px', opacity: currentPage === 1 ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#c0c0e0'; }}}
                    onMouseLeave={(e) => { if (currentPage !== 1) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a6a8e'; }}}
                  >
                    <i className="ti ti-chevron-left" style={{ fontSize: '14px' }}></i>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="page-sep" style={{ color: '#33334a', padding: '0 4px', fontSize: '13px' }}>...</span>}
                        <button
                          className={`page-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                          style={{
                            minWidth: '30px', height: '30px', padding: '0 6px', borderRadius: '6px',
                            border: p === currentPage ? '1px solid #7c5cfc' : '1px solid #1e1e30',
                            background: p === currentPage ? '#7c5cfc' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: p === currentPage ? '#fff' : '#6a6a8e', fontSize: '13px',
                          }}
                          onMouseEnter={(e) => { if (p !== currentPage) { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#c0c0e0'; }}}
                          onMouseLeave={(e) => { if (p !== currentPage) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a6a8e'; }}}
                        >{p}</button>
                      </span>
                    ))}
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{ minWidth: '30px', height: '30px', padding: '0 6px', borderRadius: '6px', border: '1px solid #1e1e30', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'default' : 'pointer', color: currentPage === totalPages ? '#33334a' : '#6a6a8e', fontSize: '13px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.background = '#1e1e30'; e.currentTarget.style.color = '#c0c0e0'; }}}
                    onMouseLeave={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6a6a8e'; }}}
                  >
                    <i className="ti ti-chevron-right" style={{ fontSize: '14px' }}></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Edit/Create */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#13131e', borderRadius: '16px', border: '1px solid #1e1e30', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{editingArticle ? 'Редактировать статью' : 'Новая статья'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none' }} placeholder="Заголовок" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <input style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none' }} placeholder="Код ошибки" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <select
                style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <textarea style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' }} placeholder="Описание проблемы" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <textarea style={{ width: '100%', padding: '10px 14px', margin: '8px 0', background: '#161625', border: '1px solid #1e1e30', borderRadius: '8px', color: '#c0c0e0', fontSize: '14px', outline: 'none', minHeight: '120px', resize: 'vertical' }} placeholder="Решение" value={formData.solution} onChange={(e) => setFormData({ ...formData, solution: e.target.value })} />

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', color: '#4a4a6a', marginBottom: '8px' }}>Изображение</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: '#161625', borderRadius: '8px', border: '1px solid #1e1e30', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="ti ti-photo" style={{ color: '#4a4a6a', fontSize: '24px' }}></i>
                    )}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '8px 16px', margin: '4px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '13px', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c5cfc'; e.currentTarget.style.color = '#c0c0e0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e30'; e.currentTarget.style.color = '#6a6a8e'; }}
                    >{formData.imagePreview ? 'Изменить' : 'Загрузить'}</button>
                    {formData.imagePreview && (
                      <button
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })}
                        style={{ padding: '8px 16px', margin: '4px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '13px', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e30'; e.currentTarget.style.color = '#6a6a8e'; }}
                      >Удалить</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #1e1e30', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c5cfc'; e.currentTarget.style.color = '#c0c0e0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e30'; e.currentTarget.style.color = '#6a6a8e'; }}
              >Отмена</button>
              <button
                onClick={saveArticle}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #7c5cfc, #5a3fd4)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >{editingArticle ? 'Сохранить' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirm */}
      {deleteConfirm.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' }}>
          <div style={{ background: '#13131e', borderRadius: '16px', border: '1px solid #1e1e30', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ padding: '32px 24px 20px' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#2e1010', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <i className="ti ti-trash" style={{ color: '#f87171', fontSize: '22px' }}></i>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Удалить статью?</h3>
              <p style={{ color: '#4a4a6a', fontSize: '14px', marginBottom: '4px' }}>Вы уверены, что хотите удалить статью:</p>
              <p style={{ color: '#d0d0ec', fontWeight: 600, fontSize: '14px' }}>«{deleteConfirm.title}»?</p>
              <p style={{ color: '#4a4a6a', fontSize: '12px', marginTop: '12px' }}>Это действие нельзя отменить.</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #1e1e30', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirm({ open: false, id: '', title: '' })}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c5cfc'; e.currentTarget.style.color = '#c0c0e0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e30'; e.currentTarget.style.color = '#6a6a8e'; }}
              >Отмена</button>
              <button
                onClick={executeDelete}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              >Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Logout Confirm */}
      {logoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' }}>
          <div style={{ background: '#13131e', borderRadius: '16px', border: '1px solid #1e1e30', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ padding: '32px 24px 20px' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#2c1c0c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <i className="ti ti-logout" style={{ color: '#fbbf24', fontSize: '22px' }}></i>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Выйти из админки?</h3>
              <p style={{ color: '#4a4a6a', fontSize: '14px' }}>Вы уверены, что хотите выйти?</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #1e1e30', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => setLogoutConfirm(false)}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e1e30', borderRadius: '8px', color: '#6a6a8e', fontSize: '13px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c5cfc'; e.currentTarget.style.color = '#c0c0e0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e30'; e.currentTarget.style.color = '#6a6a8e'; }}
              >Отмена</button>
              <button
                onClick={handleLogout}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
              >Выйти</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}