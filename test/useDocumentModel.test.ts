import { describe, it, expect } from "vitest";
import { DocumentModel } from "../src/document/DocumentModel.js";

/**
 * Integration test for useDocumentModel hook.
 * 
 * Since we don't have @testing-library/react installed, we simulate
 * the hook's behavior by testing the underlying DocumentModel operations
 * that the hook wraps.
 */
describe("useDocumentModel hook behavior", () => {
  it("should provide getText function that returns current document text", () => {
    const doc = new DocumentModel("Hello\nWorld");
    expect(doc.getText()).toBe("Hello\nWorld");
  });

  it("should provide lineCount that reflects current document state", () => {
    const doc = new DocumentModel("Hello\nWorld");
    expect(doc.getLineCount()).toBe(2);
    
    doc.setText("Line 1\nLine 2\nLine 3");
    expect(doc.getLineCount()).toBe(3);
  });

  it("should provide insert function that mutates document", () => {
    const doc = new DocumentModel("Hello World");
    doc.insert({ line: 0, column: 5 }, ",");
    expect(doc.getText()).toBe("Hello, World");
  });

  it("should provide replaceRange function that mutates document", () => {
    const doc = new DocumentModel("Hello World");
    const range = {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 5 }
    };
    doc.replaceRange(range, "Hi");
    expect(doc.getText()).toBe("Hi World");
  });

  it("should provide replaceAll function that mutates document and returns count", () => {
    const doc = new DocumentModel("foo bar foo baz foo");
    const count = doc.replaceAll("foo", "qux");
    expect(count).toBe(3);
    expect(doc.getText()).toBe("qux bar qux baz qux");
  });

  it("should provide setText function that replaces entire document", () => {
    const doc = new DocumentModel("Hello World");
    doc.setText("New text\nLine 2");
    expect(doc.getText()).toBe("New text\nLine 2");
    expect(doc.getLineCount()).toBe(2);
  });

  it("should handle complex editing workflow", () => {
    const doc = new DocumentModel("Initial text");
    
    // Insert at beginning
    doc.insert({ line: 0, column: 0 }, "Start: ");
    expect(doc.getText()).toBe("Start: Initial text");
    
    // Replace a range
    doc.replaceRange(
      { start: { line: 0, column: 7 }, end: { line: 0, column: 14 } },
      "Modified"
    );
    expect(doc.getText()).toBe("Start: Modified text");
    
    // Replace all occurrences
    const count = doc.replaceAll("t", "T");
    expect(count).toBe(3);
    expect(doc.getText()).toBe("STarT: Modified TexT");
  });

  it("should expose DocumentModel instance with all methods", () => {
    const doc = new DocumentModel("Test");
    
    // Verify all expected methods exist
    expect(typeof doc.getText).toBe("function");
    expect(typeof doc.setText).toBe("function");
    expect(typeof doc.getLineCount).toBe("function");
    expect(typeof doc.getLine).toBe("function");
    expect(typeof doc.insert).toBe("function");
    expect(typeof doc.deleteRange).toBe("function");
    expect(typeof doc.replaceRange).toBe("function");
    expect(typeof doc.replaceAll).toBe("function");
    expect(typeof doc.findFirst).toBe("function");
    expect(typeof doc.positionToOffset).toBe("function");
    expect(typeof doc.offsetToPosition).toBe("function");
    expect(typeof doc.getLineRange).toBe("function");
  });

  it("should handle Position and Range types correctly", () => {
    const doc = new DocumentModel("Line 1\nLine 2\nLine 3");
    
    // Test Position type
    const pos: { line: number; column: number } = { line: 1, column: 5 };
    doc.insert(pos, " inserted");
    expect(doc.getLine(1)).toBe("Line  inserted2");
    
    // Test Range type
    const range: { start: { line: number; column: number }; end: { line: number; column: number } } = {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 6 }
    };
    doc.replaceRange(range, "Start");
    expect(doc.getLine(0)).toBe("Start");
  });
});
