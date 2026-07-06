export function App() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#070713",
      color: "#f8fbff",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: 24,
    }}>
      <section style={{ maxWidth: 720 }}>
        <p style={{ color: "#a5f3fc", fontWeight: 800, textTransform: "uppercase" }}>
          Open Video Studio
        </p>
        <h1 style={{ fontSize: 56, lineHeight: 1, margin: "12px 0" }}>
          React production app shell is ready.
        </h1>
        <p style={{ color: "#aab4d4", lineHeight: 1.6 }}>
          The current MVP pages remain available while the frontend migrates safely into React and Vite.
        </p>
      </section>
    </main>
  );
}
