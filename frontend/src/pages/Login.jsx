import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      login(res.data.officer, res.data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0d1117' }}>
      <div style={{ background: '#161b22', padding: '40px', borderRadius: '8px', border: '1px solid #30363d', width: '350px' }}>
        <h2 style={{ color: '#d29922', textAlign: 'center', marginBottom: '20px' }}>Third Eye Traffic</h2>
        {error && <div style={{ color: '#f85149', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#c9d1d9' }}>Email</label>
            <input 
              type="email" 
              value={email} onChange={e => setEmail(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#c9d1d9' }}>Password</label>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '10px', background: '#238636', color: '#fff', padding: '10px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
