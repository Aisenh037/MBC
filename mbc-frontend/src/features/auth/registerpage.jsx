import { useState } from 'react';
import axios from 'axios';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', formData); // backend proxy assumed
      alert('Registration successful. You can now log in!');
      // Optional: redirect to login page
    } catch (err) {
      console.error(err);
      alert('Registration failed. Please try again.');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    },
    form: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      width: '300px',
      display: 'flex',
      flexDirection: 'column',
    },
    input: {
      padding: '12px',
      marginBottom: '15px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      fontSize: '16px',
    },
    button: {
      backgroundColor: '#1976d2',
      color: '#fff',
      padding: '12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
    },
    heading: {
      textAlign: 'center',
      marginBottom: '20px',
      fontSize: '24px',
      color: '#333',
    },
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.heading}>Register</h2>
        <input
          style={styles.input}
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" style={styles.button}>
          REGISTER
        </button>
      </form>
    </div>
  );
}
