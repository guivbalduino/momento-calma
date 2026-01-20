import { useState } from 'react'
import './App.css'

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

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="app-container">
      <span className="ursinho" role="img" aria-label="emoji">
        {step.emoji}
      </span>

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

      {!step.final && (
        <button onClick={handleNext}>
          {step.buttonText}
        </button>
      )}
    </div>
  )
}

export default App
