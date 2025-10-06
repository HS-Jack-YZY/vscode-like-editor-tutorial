import { DocumentProvider } from "./context/DocumentContext.js";
import { DocumentViewer } from "./components/DocumentViewer.js";
import { EditorExample } from "./components/EditorExample.js";
import { Editor } from "./components/Editor.js";

export default function App() {
  return (
    <DocumentProvider>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
          <h1>VSCode-like Editor</h1>
        </header>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor />
          </div>
          <div style={{ padding: "1rem", overflow: "auto", maxHeight: "300px", borderTop: "1px solid #ccc" }}>
            <DocumentViewer />
            <hr style={{ margin: "2rem 0" }} />
            <EditorExample />
          </div>
        </main>
      </div>
    </DocumentProvider>
  );
}
