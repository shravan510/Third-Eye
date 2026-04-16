import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/* ── Mini canvas particle background ─────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.5 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        // Draw connections
        particles.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,212,255,${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      login(res.data.officer, res.data.token);
      navigate('/');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ background: 'var(--bg-base)' }}>
      {/* Particle background */}
      <ParticleCanvas />

      {/* Glow blobs */}
      <div className="login-bg-glow" style={{ width: 500, height: 500, background: 'var(--accent-blue)',   top: '-10%', left: '-10%' }} />
      <div className="login-bg-glow" style={{ width: 400, height: 400, background: 'var(--accent-purple)', bottom: '-5%',  right: '-8%' }} />

      {/* Card */}
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">🚦</div>
          <h1>Third Eye Traffic</h1>
          <p>AI Traffic Surveillance System · Sangli</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Officer Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@thirdeye.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '⏳ Authenticating…' : '🔐 Secure Login'}
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Secured by JWT · HMAC-SHA256 Evidence Integrity<br/>
          <span style={{ color: 'var(--accent-cyan)', opacity: 0.6 }}>Govt. of Maharashtra, RTO Sangli</span>
        </div>
      </div>
    </div>
  );
}
