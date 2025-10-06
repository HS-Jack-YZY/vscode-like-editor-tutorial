import { DocumentProvider } from "./context/DocumentContext.js";
import { DocumentViewer } from "./components/DocumentViewer.js";

export default function App() {
  return (
    <DocumentProvider>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          <h1>VSCode-like Editor</h1>
        </header>
        <main style={{ flex: 1, padding: "1rem" }}>
          <DocumentViewer />
        </main>
      </div>
    </DocumentProvider>
  );
}
