import CreateHousehold from "./CreateHousehold";
import JoinHousehold from "./JoinHousehold";

type Props = {
  onReady: (householdId: string) => void;
};

export default function Onboarding({ onReady }: Props) {
  return (
    <main className="center-screen">
      <p className="eyebrow">Hemmaplanen</p>
      <h1 className="hero-title">Välkommen!</h1>
      <p className="lead">Skapa ett hushåll, eller gå med i ett med en inbjudningskod.</p>
      <CreateHousehold onCreated={onReady} />
      <p className="divider">eller</p>
      <JoinHousehold onJoined={onReady} />
    </main>
  );
}
