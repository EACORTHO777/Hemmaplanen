import { LogIn } from "lucide-react";

type Props = {
  onLogin: () => void;
};

export default function LoginScreen({ onLogin }: Props) {
  return (
    <main className="center-screen">
      <p className="eyebrow">Hemmaplanen</p>
      <h1 className="hero-title">Hela hushållet på samma lista.</h1>
      <p className="lead">Handla, planera och håll koll på medicinen, tillsammans.</p>
      <button type="button" className="primary-button" onClick={onLogin}>
        <LogIn size={20} aria-hidden />
        Logga in med Google
      </button>
    </main>
  );
}
