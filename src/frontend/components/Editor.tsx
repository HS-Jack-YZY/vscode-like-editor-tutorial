import { useState, useRef, useEffect } from "react";
import { useDocumentModel } from "../hooks/useDocumentModel.js";

/**
 * Editor component that provides a VSCode-like text/code editor interface.
 * Features:
 * - Two-column layout: line number gutter + textarea
 * - Line number gutter with current line highlighting
 * - Textarea for code editing synchronized with DocumentModel
 * - Dark theme styling
 */
export function Editor() {
  const { setText, getText, lineCount } = useDocumentModel();
  const [currentLine, setCurrentLine] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update current line when cursor moves
  const handleSelectionChange = () => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = getText().substring(0, cursorPosition);
    const lineNumber = textBeforeCursor.split("\n").length;
    
    setCurrentLine(lineNumber);
  };

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Listen for cursor position changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.addEventListener("click", handleSelectionChange);
    textarea.addEventListener("keyup", handleSelectionChange);
    textarea.addEventListener("focus", handleSelectionChange);

    return () => {
      textarea.removeEventListener("click", handleSelectionChange);
      textarea.removeEventListener("keyup", handleSelectionChange);
      textarea.removeEventListener("focus", handleSelectionChange);
    };
  }, [getText]);

  // Generate line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div style={styles.container}>
      {/* Line number gutter */}
      <div style={styles.gutter}>
        {lineNumbers.map((lineNum) => (
          <div
            key={lineNum}
            style={{
              ...styles.lineNumber,
              ...(lineNum === currentLine ? styles.currentLine : {}),
            }}
          >
            {lineNum}
          </div>
        ))}
      </div>

      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        value={getText()}
        onChange={handleTextChange}
        style={styles.textarea}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
}

// Dark theme styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  gutter: {
    backgroundColor: "#1e1e1e",
    color: "#858585",
    padding: "8px 16px 8px 8px",
    textAlign: "right",
    userSelect: "none",
    borderRight: "1px solid #3e3e3e",
    minWidth: "50px",
  },
  lineNumber: {
    height: "21px",
    lineHeight: "21px",
  },
  currentLine: {
    color: "#c6c6c6",
    backgroundColor: "#2a2a2a",
    fontWeight: "bold",
  },
  textarea: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    border: "none",
    outline: "none",
    padding: "8px 16px",
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: "14px",
    lineHeight: "1.5",
    resize: "none",
    tabSize: 2,
    whiteSpace: "pre",
    overflowWrap: "normal",
    overflowX: "auto",
  } as React.CSSProperties,
};
