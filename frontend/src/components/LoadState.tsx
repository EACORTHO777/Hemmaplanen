// What a screen shows instead of its content while the first load runs or fails.
// After the first successful load, screens keep showing their data and only
// report later failures with showError().

export type Status = "loading" | "ready" | "error";

type Props = {
  status: Status;
  onRetry: () => void;
};

export default function LoadState({ status, onRetry }: Props) {
  if (status === "loading") {
    return (
      <p className="loading" role="status">
        Laddar…
      </p>
    );
  }
  if (status === "error") {
    return (
      <div className="load-error" role="alert">
        <p>Kunde inte hämta det här just nu.</p>
        <button type="button" className="secondary-button" onClick={onRetry}>
          Försök igen
        </button>
      </div>
    );
  }
  return null;
}
