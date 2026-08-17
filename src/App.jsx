import React, { useState, useEffect } from 'react';
import Today from './views/Today';
import { getStats } from './api/api';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if backend is ready
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setIsReady(true);
        } else {
          setError('Backend not responding');
        }
      } catch (err) {
        setError('Failed to connect to backend. Make sure to run: npm run dev');
      }
    };

    checkHealth();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#ff6b6b', textAlign: 'center' }}>
        <h1>Connection Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return <Today />;
}