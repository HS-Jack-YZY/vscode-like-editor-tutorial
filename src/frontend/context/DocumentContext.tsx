import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { DocumentModel } from "../../document/DocumentModel.js";

/**
 * The value provided by DocumentContext.
 * Contains the singleton DocumentModel instance and methods to manage it.
 */
export interface DocumentContextValue {
  /** The singleton DocumentModel instance */
  doc: DocumentModel;
  /** Version number that increments to trigger React re-renders */
  version: number;
  /** Triggers a version increment to force React re-render */
  forceUpdate: () => void;
  /** Updates document text and triggers re-render */
  setText: (newText: string) => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

/**
 * Props for the DocumentProvider component.
 */
export interface DocumentProviderProps {
  /** Initial text for the document. Defaults to "Hello\nWorld\n这是第三行" */
  initialText?: string;
  /** React children to render within the provider */
  children: React.ReactNode;
}

/**
 * Provider component that manages a singleton DocumentModel instance.
 * Provides document state and update methods via React context.
 * 
 * @example
 * ```tsx
 * <DocumentProvider initialText="Hello\nWorld">
 *   <YourComponent />
 * </DocumentProvider>
 * ```
 */
export function DocumentProvider({ 
  initialText = "Hello\nWorld\n这是第三行", 
  children 
}: DocumentProviderProps) {
  const [doc] = useState(() => new DocumentModel(initialText));
  const [version, setVersion] = useState(0);

  const forceUpdate = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const setText = useCallback(
    (newText: string) => {
      doc.setText(newText);
      forceUpdate();
    },
    [doc, forceUpdate]
  );

  const value = useMemo<DocumentContextValue>(
    () => ({
      doc,
      version,
      forceUpdate,
      setText,
    }),
    [doc, version, forceUpdate, setText]
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

/**
 * Hook to access the DocumentContext.
 * Must be used within a DocumentProvider.
 * 
 * @throws {Error} If used outside of DocumentProvider
 * @returns The DocumentContextValue containing doc, version, forceUpdate, and setText
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { doc, version, setText } = useDocument();
 *   return <div>{doc.getText()}</div>;
 * }
 * ```
 */
export function useDocument(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
}
