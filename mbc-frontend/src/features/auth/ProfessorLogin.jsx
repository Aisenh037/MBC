import React, { useState } from 'react';
import axios from 'axios';

export default function ProfessorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/v1/professors/login', { email, password });
      if (res.data.user.isFirstLogin) {
        setShowReset(true);
      } else {
        // Redirect to dashboard
      }
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  const handleReset = async () => {
    try {
      await axios.post('/api/v1/professors/reset-password', { email, newPassword });
      alert("Password updated! Please login again.");
      setShowReset(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return showReset ? (
    <div>
      <h2>Reset Your Password</h2>
      <input placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <button onClick={handleReset}>Submit</button>
    </div>
  ) : (
    <div>
      <h2>Professor Login</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
