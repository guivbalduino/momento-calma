import { useState, useEffect } from 'react';
import axios from 'axios';

// URL base para API - Dinâmico para local vs produção
const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001' : '';

const Feedbacks = ({ type }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [password, setPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState('');

    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/feedbacks/${type}`, {
                headers: { Authorization: password }
            });
            setFeedbacks(response.data);
            setAuthorized(true);
            setError('');
        } catch (err) {
            setError('Senha incorreta ou erro no servidor.');
            setAuthorized(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        fetchFeedbacks();
    };

    const downloadBase = () => {
        window.open(`${API_URL}/api/export/${type}?pwd=${password}`, '_blank');
    };

    if (!authorized) {
        return (
            <div className="app-container">
                <h1>Admin {type === 'sentiment' ? 'Sentimentos' : 'Sugestões'}</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', marginBottom: '16px', fontSize: '16px' }}
                    />
                    <button type="submit">Entrar</button>
                </form>
                {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
            </div>
        );
    }

    return (
        <div className="app-container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1>{type === 'sentiment' ? 'Sentimentos' : 'Sugestões App'}</h1>
                <button onClick={downloadBase} style={{ padding: '8px 16px', fontSize: '14px', background: '#2e7d32' }}>Baixar Base (.csv)</button>
            </div>

            <div style={{ textAlign: 'left' }}>
                {feedbacks.length === 0 ? (
                    <p>Nenhum feedback recebido ainda.</p>
                ) : (
                    feedbacks.map((f) => (
                        <div key={f.id} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #eee' }}>
                            <p style={{ fontSize: '16px', color: '#333' }}>{f.content}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#999' }}>
                                <span>IP: {f.ip}</span>
                                <span>{new Date(f.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setAuthorized(false)} style={{ background: '#999' }}>Sair</button>
            </div>
        </div>
    );
};

export default Feedbacks;
