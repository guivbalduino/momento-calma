import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import axios from 'axios'
import './App.css'
import Feedbacks from './Feedbacks'

// URL base para API - Dinâmico para local vs produção
const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3001' : '';

const steps = [
  {
    id: 0,
    title: "Olá!",
    description: "Vamos nos acalmar juntos?",
    subDescription: "Tenho um desafio para você!",
    buttonText: "Começar!",
    emoji: "🧸",
    stars: 0
  },
  {
    id: 1,
    title: "Fase 1",
    description: "Encontre 5 coisas que você pode ",
    highlight: "ver",
    suffix: " agora.",
    buttonText: "Já concluí!",
    emoji: "👁️",
    stars: 1
  },
  {
    id: 2,
    title: "Fase 2",
    description: "Encontre 4 coisas que você pode ",
    highlight: "tocar",
    suffix: ".",
    buttonText: "Já concluí!",
    emoji: "🧤",
    stars: 2
  },
  {
    id: 3,
    title: "Fase 3",
    description: "Encontre 3 sons que você pode ",
    highlight: "ouvir",
    suffix: ".",
    buttonText: "Já concluí!",
    emoji: "👂",
    stars: 3
  },
  {
    id: 4,
    title: "Fase 4",
    description: "Encontre 2 coisas que você pode ",
    highlight: "cheirar",
    suffix: ".",
    buttonText: "Já concluí!",
    emoji: "👃",
    stars: 4
  },
  {
    id: 5,
    title: "Fase 5",
    description: "Encontre 1 coisa para ",
    highlight: "sentir o gosto",
    suffix: ".",
    buttonText: "Já concluí!",
    emoji: "👅",
    stars: 5
  },
  {
    id: 6,
    title: "Muito bem!",
    description: "Agora estamos menos ansiosos e mais presentes. ❤️",
    emoji: "🥳",
    stars: 5,
    final: true
  }
];

function MainGame() {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState({ canSubmitApp: true, canSubmitSentiment: true, nextAvailable: null, dbError: false });
  const [sentiment, setSentiment] = useState('');
  const [improvement, setImprovement] = useState('');
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [submittedSentiment, setSubmittedSentiment] = useState(false);
  const [submittedImprovement, setSubmittedImprovement] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [sessionRating, setSessionRating] = useState(10);

  const step = steps[currentStep];

  useEffect(() => {
    checkStatus();
  }, [step.final]);

  useEffect(() => {
    let timer;
    if (status.nextAvailable) {
      timer = setInterval(() => {
        const now = Date.now();
        const diff = status.nextAvailable - now;
        if (diff <= 0) {
          setStatus(prev => ({ ...prev, canSubmitSentiment: true, nextAvailable: null }));
          setCountdown('');
          clearInterval(timer);
        } else {
          const minutes = Math.floor((diff / 1000 / 60) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          const hours = Math.floor(diff / 1000 / 60 / 60);
          setCountdown(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status.nextAvailable]);

  const checkStatus = async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/check-status`);
      setStatus({ ...resp.data, dbError: false });
    } catch (e) {
      console.warn("Server check failed.");
      if (e.response?.status === 503) {
        setStatus(prev => ({ ...prev, dbError: true }));
      }
    }
  };

  const getMetadata = () => {
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    return {
      user_agent: ua,
      device_type: isMobile ? 'Mobile' : 'Desktop',
      screen_size: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      duration_seconds: startTime ? Math.floor((Date.now() - startTime) / 1000) : null
    };
  };

  const submitFeedback = async (type) => {
    const content = type === 'sentiment' ? sentiment : improvement;
    if (!content.trim()) return;

    const metadata = {
      ...getMetadata(),
      rating: type === 'improvement' ? sessionRating : null
    };

    try {
      await axios.post(`${API_URL}/api/feedback`, { content, type, metadata });
      if (type === 'sentiment') {
        setSubmittedSentiment(true);
        checkStatus();
      } else {
        setSubmittedImprovement(true);
        setTimeout(() => {
          setShowImprovementModal(false);
          setSubmittedImprovement(false);
          setImprovement('');
          setSessionRating(10);
          checkStatus();
        }, 2000);
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || "Erro ao enviar feedback.";
      alert(errorMsg);
    }
  };

  const playChime = (isSuccess = false) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playNote = (freq, delay = 0) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + delay + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 1.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 1.5);
      };
      if (isSuccess) {
        playNote(523.25, 0); playNote(659.25, 0.2); playNote(783.99, 0.4); playNote(1046.50, 0.6);
      } else {
        playNote(523.25, 0);
      }
    } catch (e) { }
  };

  const handleNext = () => {
    if (currentStep === 0 && !startTime) {
      setStartTime(Date.now());
    }
    if (currentStep < steps.length - 1) {
      const isFinishing = currentStep === steps.length - 2;
      playChime(isFinishing);
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <>
      <div className="app-container">
        <span className="ursinho" role="img" aria-label="emoji">{step.emoji}</span>
        <div className="content">
          <h1>{step.title}</h1>
          <p>
            {step.description}
            {step.highlight && <b>{step.highlight}</b>}
            {step.suffix}
            {step.subDescription && <><br />{step.subDescription}</>}
          </p>
        </div>
        <div className="stars-container">
          {[...Array(step.stars)].map((_, i) => (
            <span key={i} className="star">⭐</span>
          ))}
        </div>
        {!step.final && <button onClick={handleNext}>{step.buttonText}</button>}

        {step.final && (
          <div style={{ marginTop: '24px', animation: 'fadeIn 0.8s ease-out' }}>
            {status.dbError ? (
              <p style={{ color: '#d32f2f', fontSize: '14px' }}>No momento estamos com problemas técnicos para armazenar feedback, desculpe.</p>
            ) : status.canSubmitSentiment && !submittedSentiment ? (
              <>
                <p style={{ fontSize: '18px', marginBottom: '12px' }}>Como você está se sentindo agora?</p>
                <textarea
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                  placeholder="Seu estado atual..."
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontFamily: 'inherit', marginBottom: '12px', minHeight: '100px', fontSize: '16px' }}
                />
                <button onClick={() => submitFeedback('sentiment')}>Enviar</button>
              </>
            ) : submittedSentiment ? (
              <p style={{ color: '#2E7D32', fontWeight: 600 }}>Obrigado pelo seu feedback! ❤️</p>
            ) : status.nextAvailable && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                Liberado para falar sobre sentimentos novamente em: <br />
                <strong style={{ color: 'var(--primary-dark)', fontSize: '18px' }}>{countdown}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {status.canSubmitApp && (
        <div
          onClick={() => setShowImprovementModal(true)}
          className="improvement-btn"
          style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--primary)', color: 'white', padding: '12px 20px', borderRadius: '100px', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, zIndex: 100, transition: 'var(--transition)' }}
        >
          <span className="btn-text">Como podemos melhorar?</span>
        </div>
      )}

      {showImprovementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: '20px' }}>
          <div className="app-container" style={{ margin: 0, position: 'relative' }}>
            <button onClick={() => setShowImprovementModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', minWidth: 'auto', background: 'transparent', color: '#999', boxShadow: 'none' }}>✕</button>
            <h2 style={{ marginBottom: '16px', fontSize: '24px', color: 'var(--primary-dark)' }}>Sua Sugestão</h2>
            {submittedImprovement ? (
              <p style={{ color: '#2E7D32', fontWeight: 600 }}>Obrigado! Sua sugestão foi salva. ✨</p>
            ) : (
              <>
                <p style={{ fontSize: '14px', marginBottom: '8px', textAlign: 'left', color: '#666' }}>Que nota você daria para o app? (1 a 10)</p>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i + 1}
                      onClick={() => setSessionRating(i + 1)}
                      style={{
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--primary)',
                        background: sessionRating === (i + 1) ? 'var(--primary)' : 'white',
                        color: sessionRating === (i + 1) ? 'white' : 'var(--primary-dark)',
                        fontWeight: 600, fontSize: '14px', transition: '0.2s'
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <textarea value={improvement} onChange={(e) => setImprovement(e.target.value)} placeholder="Escreva aqui sua sugestão..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontFamily: 'inherit', marginBottom: '16px', minHeight: '120px', fontSize: '16px' }} />
                <button onClick={() => submitFeedback('improvement')} style={{ width: '100%' }}>Enviar Sugestão</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainGame />} />
      <Route path="/feedbacks/sentimento" element={<Feedbacks type="sentiment" />} />
      <Route path="/feedbacks/app" element={<Feedbacks type="improvement" />} />
    </Routes>
  )
}

export default App
