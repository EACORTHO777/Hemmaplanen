import { LogIn, Sparkles } from "lucide-react";

type Props = {
  onLogin: () => void;
  onDemo: () => void;
};

export default function LoginScreen({ onLogin, onDemo }: Props) {
  return (
    <main className="center-screen">
      <p className="eyebrow">Hemmaplanen</p>
      <h1 className="hero-title">Hela hushållet på samma lista.</h1>
      <p className="lead">Handla, planera och håll koll på medicinen, tillsammans.</p>
      <button type="button" className="primary-button" onClick={onLogin}>
        <LogIn size={20} aria-hidden />
        Logga in med Google
      </button>
      <button type="button" className="secondary-button" onClick={onDemo}>
        <Sparkles size={20} aria-hidden />
        Prova demo
      </button>
      <p className="demo-note">
        Ingen inloggning behövs. Du får en egen demofamilj som raderas efter ett dygn.
      </p>
    </main>
  );
}
