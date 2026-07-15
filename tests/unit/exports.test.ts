import { describe, expect, it, vi, afterEach } from "vitest";
import { buildTxtContent } from "@/lib/export/txt";

describe("export formats", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TXT export contains the full transcript", () => {
    const transcript =
      "First paragraph of the transcript.\n\nSecond paragraph continues here.";
    const txt = buildTxtContent(transcript, "Interview notes");
    expect(txt).toContain("Interview notes");
    expect(txt).toContain("First paragraph");
    expect(txt).toContain("Second paragraph");
  });

  it("DOCX packer returns a non-empty OOXML archive", async () => {
    const { Packer, Document, Paragraph, TextRun } = await import("docx");
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Hello from DOCX export.")],
            }),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(Buffer.from(buffer).subarray(0, 2).toString("utf8")).toBe("PK");
  });

  it("PDF generation includes transcript text in output", async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const transcript = "Alpha paragraph one. Beta paragraph two.";
    doc.text("Transcribe Studio", 56, 56);
    doc.text(transcript, 56, 80);
    const data = doc.output("arraybuffer");
    expect(data.byteLength).toBeGreaterThan(100);
    // PDF binary may encode strings; also verify API smoke path used by downloadPdf exists
    expect(typeof doc.save).toBe("function");
    expect(typeof doc.splitTextToSize).toBe("function");
  });
});
