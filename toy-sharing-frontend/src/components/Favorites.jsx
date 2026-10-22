import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function Favorites({ setPage }) {
  const [toys, setToys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/auth/me/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (active) setToys(response.data.favorites || []);
      })
      .catch(err => {
        if (active) setError(err.response?.data?.message || 'Không thể tải danh sách yêu thích.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const removeFavorite = async (toyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/toys/${toyId}/favorite`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToys(current => current.filter(toy => toy._id !== toyId));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa đồ chơi khỏi danh sách.');
    }
  };

  return (
    <main style={{ maxWidth: '1120px', margin: '36px auto 60px', padding: '0 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <p style={{ color: 'var(--primary-color)', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>BỘ SƯU TẬP CỦA BẠN</p>
          <h1 style={{ fontSize: '30px', color: 'var(--text-main)' }}>Đồ chơi yêu thích</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setPage('home')}>Quay lại khám phá</button>
      </header>

      {error && <p role="status" style={{ padding: '12px 14px', marginBottom: '18px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b' }}>{error}</p>}
      {loading ? <p style={{ padding: '40px 0', color: 'var(--text-muted)' }}>Đang tải danh sách...</p> : toys.length === 0 ? (
        <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', background: '#fff', border: '1px solid #f1eae4', borderRadius: '10px' }}>Bạn chưa lưu đồ chơi nào.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {toys.map(toy => (
            <article key={toy._id} style={{ background: '#fff', border: '1px solid #f1eae4', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={toy.images?.[0] || '/images/toy-placeholder.png'} alt={toy.name} onError={event => { event.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '180px', objectFit: 'cover', background: '#f6f1eb' }} />
              <div style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '17px', marginBottom: '5px', color: 'var(--text-main)' }}>{toy.name}</h2>
                <p style={{ minHeight: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>{toy.category || 'Đồ chơi'} · {toy.ownerId?.name || 'Thành viên'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{toy.depositRequired?.toLocaleString() || 0}đ</span>
                  <button type="button" onClick={() => removeFavorite(toy._id)} aria-label={`Bỏ yêu thích ${toy.name}`} title="Bỏ yêu thích" style={{ border: '1px solid #ead8d5', borderRadius: '8px', padding: '8px 10px', color: '#9d3b35', background: '#fff', cursor: 'pointer' }}>♥ Bỏ lưu</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}