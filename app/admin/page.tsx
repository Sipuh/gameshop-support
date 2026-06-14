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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Login screen
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <div style={{ padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: 'linear-gradient(135deg, var(--purple), var(--pink))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎮</div>
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px' }}>GameShop Admin</h2>
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}
          <input className="admin-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoFocus />
          <input className="admin-input" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <button className="admin-button" onClick={handleLogin} style={{ width: '100%', marginTop: '8px' }}>Войти</button>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href="/" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>На главную</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      {/* Aside menu */}
      <aside style={{ width: '220px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
        <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 800, background: 'linear-gradient(90deg, var(--purple-lite), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GAMESHOP</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{user.email}</div>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{ padding: '0 16px', marginBottom: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Управление</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px',
            background: '#ffffff08',
            border: 'none', color: 'var(--text-main)', fontSize: '14px', cursor: 'default', textAlign: 'left',
            borderLeft: '3px solid var(--purple-lite)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Статьи
          </div>
          <div style={{ padding: '0 16px', marginTop: '16px', marginBottom: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Навигация</div>
          </div>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: 'var(--text-dim)',
            fontSize: '14px', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            На сайт
          </a>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setLogoutConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-dim)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              width: '100%', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#ef444410'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 800 }}>Статьи</h1>
          <button className="admin-button" onClick={openCreateModal}>+ Новая статья</button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="admin-input"
              style={{ paddingLeft: '32px' }}
              type="text"
              placeholder="Поиск по названию или коду..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterCategory('all')}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: filterCategory === 'all' ? 'var(--purple)' : 'transparent',
                color: filterCategory === 'all' ? 'white' : 'var(--text-dim)', fontSize: '13px', cursor: 'pointer'
              }}
            >Все</button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: filterCategory === cat.id ? 'var(--purple)' : 'transparent',
                  color: filterCategory === cat.id ? 'white' : 'var(--text-dim)', fontSize: '13px', cursor: 'pointer'
                }}
              >{cat.name}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Заголовок</th>
                <th>Код</th>
                <th>Категория</th>
                <th style={{ width: '100px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Статей пока нет</td></tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      {article.image ? (
                        <img src={article.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', background: 'var(--bg-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '18px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{article.title}</td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{article.code || '—'}</span></td>
                    <td><span style={{ color: article.category?.borderColor || 'var(--purple-lite)', fontSize: '13px' }}>{article.category?.name || '—'}</span></td>
                    <td>
                      <button className="admin-btn-sm" onClick={() => openEditModal(article)} title="Редактировать" style={{ transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="admin-btn-sm" onClick={() => confirmDelete(article)} title="Удалить" style={{ transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit/Create */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>{editingArticle ? 'Редактировать статью' : 'Новая статья'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input className="admin-input" placeholder="Заголовок" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <input className="admin-input" placeholder="Код ошибки" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <select className="admin-select" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                <option value="">Выберите категорию</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <textarea className="admin-textarea" placeholder="Описание проблемы" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ minHeight: '80px' }} />
              <textarea className="admin-textarea" placeholder="Решение" value={formData.solution} onChange={(e) => setFormData({ ...formData, solution: e.target.value })} style={{ minHeight: '120px' }} />

              {/* Image upload */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>Изображение</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    )}
                  </div>
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    <button className="admin-button-secondary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '13px' }}>
                      {formData.imagePreview ? 'Изменить' : 'Загрузить'}
                    </button>
                    {formData.imagePreview && (
                      <button className="admin-button-secondary" onClick={() => setFormData({ ...formData, image: null, imagePreview: '' })} style={{ fontSize: '13px', marginLeft: '8px' }}>Удалить</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="admin-button-secondary" onClick={() => setModalOpen(false)}>Отмена</button>
              <button className="admin-button" onClick={saveArticle}>{editingArticle ? 'Сохранить' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirm */}
      {deleteConfirm.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px' }}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ padding: '32px 24px 20px' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#ef444420', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', marginBottom: '8px' }}>Удалить статью?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Вы уверены, что хотите удалить статью:</p>
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '14px' }}>«{deleteConfirm.title}»?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>Это действие нельзя отменить.</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button className="admin-button-secondary" onClick={() => setDeleteConfirm({ open: false, id: '', title: '' })}>Отмена</button>
              <button
                onClick={executeDelete}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ef4444',
                  color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
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
          <div style={{ background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ padding: '32px 24px 20px' }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#f59e0b20', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', marginBottom: '8px' }}>Выйти из админки?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Вы уверены, что хотите выйти?</p>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button className="admin-button-secondary" onClick={() => setLogoutConfirm(false)}>Отмена</button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#f59e0b',
                  color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
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
