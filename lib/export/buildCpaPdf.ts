import PDFDocument from "pdfkit";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

export async function buildCpaSummaryPdf(
  taxYear: string,
  rows: ExportExpenseRow[],
  summaryLines: { line: string; total: number }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`Snap1099 Tax Year ${taxYear} — CPA Summary`, { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text("For estimation only — not tax advice. Receipt links expire in 7 days.");
    doc.moveDown(1);
    doc.fillColor("#000000");

    doc.fontSize(11).font("Helvetica-Bold").text("Schedule C Summary");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);
    for (const line of summaryLines) {
      doc.text(`${line.line}: $${line.total.toFixed(2)}`);
    }
    const totalDeductible = rows.reduce(
      (sum, r) => sum + (r.deductible ? r.deductibleAmount : 0),
      0,
    );
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text(`Total Deductible: $${totalDeductible.toFixed(2)}`);
    doc.moveDown(1.5);

    doc.fontSize(11).font("Helvetica-Bold").text("Expense Detail");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(9);

    for (const row of rows) {
      const header = `${row.dateIso} · ${row.merchant} · $${row.amount.toFixed(2)}`;
      doc.font("Helvetica-Bold").text(header);
      doc.font("Helvetica").text(
        `${row.irsLine} · Deductible $${row.deductibleAmount.toFixed(2)}`,
      );
      if (row.receiptImageUrl) {
        doc.fillColor("#1d4ed8").text("View receipt image", {
          link: row.receiptImageUrl,
          underline: true,
        });
        doc.fillColor("#000000");
      }
      doc.moveDown(0.4);
    }

    doc.end();
  });
}
