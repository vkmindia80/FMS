import React, { useState } from 'react';
import { authAPI } from './services/api';

const SimpleApp = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const response = await authAPI.login(email, password);
        setUser(response.user);
        setMessage('Login successful!');
        localStorage.setItem('afms_access_token', response.access_token);
        localStorage.setItem('afms_refresh_token', response.refresh_token);
      } else {
        const userData = {
          email,
          password,
          full_name: fullName,
          company_name: companyName,
          company_type: 'individual',
          role: 'individual'
        };
        const response = await authAPI.register(userData);
        setUser(response.user);
        setMessage('Registration successful!');
        localStorage.setItem('afms_access_token', response.access_token);
        localStorage.setItem('afms_refresh_token', response.refresh_token);
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Operation failed');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('afms_access_token');
    localStorage.removeItem('afms_refresh_token');
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
  };

  if (user) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>Welcome to AFMS</h1>
        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>User Information</h2>
          <p><strong>Name:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Company:</strong> {user.company_name}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <a href="/documents" style={{ padding: '15px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '6px', textAlign: 'center' }}>
            📄 Documents
          </a>
          <a href="/transactions" style={{ padding: '15px', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', borderRadius: '6px', textAlign: 'center' }}>
            💳 Transactions
          </a>
          <a href="/accounts" style={{ padding: '15px', backgroundColor: '#f59e0b', color: 'white', textDecoration: 'none', borderRadius: '6px', textAlign: 'center' }}>
            🏦 Accounts
          </a>
          <a href="/reports" style={{ padding: '15px', backgroundColor: '#ef4444', color: 'white', textDecoration: 'none', borderRadius: '6px', textAlign: 'center' }}>
            📊 Reports
          </a>
        </div>

        <button 
          onClick={handleLogout}
          style={{ padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '30px' }}>
        AFMS - Finance Management System
      </h1>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => setIsLogin(true)}
          style={{ 
            padding: '8px 16px', 
            marginRight: '10px',
            backgroundColor: isLogin ? '#2563eb' : '#e5e7eb',
            color: isLogin ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          style={{ 
            padding: '8px 16px',
            backgroundColor: !isLogin ? '#2563eb' : '#e5e7eb',
            color: !isLogin ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Register
        </button>
      </div>

      {isLogin && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '6px', 
          fontSize: '14px',
          border: '1px solid #d1d5db'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Demo Credentials:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#6b7280' }}>Email:</span>
            <button 
              onClick={() => setEmail('john.doe@testcompany.com')}
              style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              john.doe@testcompany.com
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Password:</span>
            <button 
              onClick={() => setPassword('testpassword123')}
              style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              testpassword123
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
          </>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: message.includes('successful') ? '#d1fae5' : '#fee2e2',
          color: message.includes('successful') ? '#065f46' : '#991b1b',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SimpleApp;