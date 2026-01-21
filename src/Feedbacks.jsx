import { useState, useEffect } from 'react';
import axios from 'axios';

// URL base para API - Dinâmico para local vs produção
const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001' : '';

const Feedbacks = ({ type }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [password, setPassword] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchFeedbacks = async () => {
        setLoading(true);
        setError('');
        try {
            console.log(`Fetching feedbacks for type: ${type}`);
            const response = await axios.get(`${API_URL}/api/feedbacks/${type}`, {
                headers: { Authorization: password }
            });
            console.log("Feedback response:", response.data);

            if (Array.isArray(response.data)) {
                setFeedbacks(response.data);
                setAuthorized(true);
                setError('');
            } else {
                console.error("Dados recebidos não são um array:", response.data);
                setError("O servidor retornou um formato de dados inválido.");
            }
        } catch (err) {
            console.error("Erro ao buscar feedbacks:", err);
            const status = err.response?.status;
            const message = err.response?.data?.error || err.message;
            setError(`Erro (${status || 'Fetch'}): ${message}`);
            setAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        fetchFeedbacks();
    };

    const downloadBase = () => {
        const url = `${API_URL}/api/export/${type}?pwd=${encodeURIComponent(password)}`;
        console.log("Triggering download from:", url);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `feedbacks_${type}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <div key={f.id} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #eee', position: 'relative' }}>
                            {type === 'improvement' && f.rating && (
                                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
                                    Nota: {f.rating}/10
                                </div>
                            )}
                            {type === 'sentiment' && f.duration_seconds && (
                                <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#666', fontSize: '12px' }}>
                                    ⏱️ {Math.floor(f.duration_seconds / 60)}m {f.duration_seconds % 60}s
                                </div>
                            )}

                            <p style={{ fontSize: '16px', color: '#333', marginTop: (f.rating || f.duration_seconds) ? '12px' : '0', paddingRight: (f.rating || f.duration_seconds) ? '80px' : '0' }}>
                                {f.content}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: '#999' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📅 {new Date(f.created_at).toLocaleString('pt-BR')}</span>
                                    <span>📍 {f.ip}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📱 {f.device_type} ({f.screen_size})</span>
                                    <span>🌍 {f.language}</span>
                                </div>
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
