import { useDocument } from "../context/DocumentContext.js";

export function DocumentViewer() {
  const { doc, version, setText } = useDocument();

  return (
    <div>
      <div>
        <strong>Document Content (v{version}):</strong>
        <pre style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "0.5rem" }}>
          {doc.getText()}
        </pre>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => setText("Updated text\nLine 2\nLine 3")}>Update Text</button>
      </div>
    </div>
  );
}
