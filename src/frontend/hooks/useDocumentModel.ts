import { useCallback, useMemo } from "react";
import { useDocument } from "../context/DocumentContext.js";
import type { Position, Range, DocumentModel } from "../../document/DocumentModel.js";

/**
 * Return type for the useDocumentModel hook.
 * Provides document access and mutation functions that trigger UI updates.
 */
export type UseDocumentModelResult = {
  /** The DocumentModel instance */
  doc: DocumentModel;
  /** Get the current text content */
  getText: () => string;
  /** Get the total number of lines */
  lineCount: number;
  /** Insert text at a specific position and trigger UI update */
  insert: (pos: Position, insertText: string) => void;
  /** Replace a range with new text and trigger UI update */
  replaceRange: (range: Range, newText: string) => void;
  /** Replace all occurrences of a query string and trigger UI update */
  replaceAll: (query: string, replacement: string) => number;
  /** Set the entire text content and trigger UI update */
  setText: (newText: string) => void;
};

/**
 * Hook to access and mutate the DocumentModel with automatic UI updates.
 * 
 * All mutation functions (insert, replaceRange, replaceAll, setText) call
 * forceUpdate after making changes to trigger React re-renders.
 * 
 * @returns An object containing the doc instance, read methods, and mutation functions
 * 
 * @example
 * ```tsx
 * function EditorComponent() {
 *   const { doc, getText, lineCount, insert, replaceRange } = useDocumentModel();
 *   
 *   const handleInsert = () => {
 *     insert({ line: 0, column: 0 }, "Hello ");
 *   };
 *   
 *   return (
 *     <div>
 *       <div>Lines: {lineCount}</div>
 *       <pre>{getText()}</pre>
 *       <button onClick={handleInsert}>Insert</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDocumentModel(): UseDocumentModelResult {
  const { doc, version, forceUpdate } = useDocument();

  // Wrap getText for convenience
  const getText = useCallback(() => doc.getText(), [doc]);

  // Compute line count (will update when version changes via forceUpdate)
  const lineCount = useMemo(() => doc.getLineCount(), [doc, version]);

  // Mutation function: insert text at position
  const insert = useCallback(
    (pos: Position, insertText: string) => {
      doc.insert(pos, insertText);
      forceUpdate();
    },
    [doc, forceUpdate]
  );

  // Mutation function: replace a range with new text
  const replaceRange = useCallback(
    (range: Range, newText: string) => {
      doc.replaceRange(range, newText);
      forceUpdate();
    },
    [doc, forceUpdate]
  );

  // Mutation function: replace all occurrences
  const replaceAll = useCallback(
    (query: string, replacement: string) => {
      const count = doc.replaceAll(query, replacement);
      forceUpdate();
      return count;
    },
    [doc, forceUpdate]
  );

  // Mutation function: set entire text
  const setText = useCallback(
    (newText: string) => {
      doc.setText(newText);
      forceUpdate();
    },
    [doc, forceUpdate]
  );

  return {
    doc,
    getText,
    lineCount,
    insert,
    replaceRange,
    replaceAll,
    setText,
  };
}
