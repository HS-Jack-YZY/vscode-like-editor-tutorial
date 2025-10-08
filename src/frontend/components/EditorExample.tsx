import { useDocumentModel } from "../hooks/index.js";

/**
 * Example component demonstrating the useDocumentModel hook.
 * Shows how to use insert, replaceRange, replaceAll, and setText functions.
 */
export function EditorExample() {
  const { doc, getText, lineCount, insert, replaceRange, replaceAll, setText } = useDocumentModel();

  const handleInsert = () => {
    insert({ line: 0, column: 0 }, "Inserted: ");
  };

  const handleReplaceRange = () => {
    const range = {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 5 }
    };
    replaceRange(range, "START");
  };

  const handleReplaceAll = () => {
    const count = replaceAll("line", "LINE");
    alert(`Replaced ${count} occurrences`);
  };

  const handleSetText = () => {
    setText("New document\nWith multiple lines\nFor testing");
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Editor Example</h2>
      
      <div style={{ marginBottom: "1rem" }}>
        <strong>Lines: {lineCount}</strong>
      </div>

      <pre style={{ 
        border: "1px solid #ccc", 
        padding: "1rem", 
        backgroundColor: "#f5f5f5",
        marginBottom: "1rem"
      }}>
        {getText()}
      </pre>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={handleInsert}>Insert at Start</button>
        <button onClick={handleReplaceRange}>Replace First 5 Chars</button>
        <button onClick={handleReplaceAll}>Replace All "line"</button>
        <button onClick={handleSetText}>Set New Text</button>
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
        <p>Document instance available: {doc ? "✓" : "✗"}</p>
      </div>
    </div>
  );
}
