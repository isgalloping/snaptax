import PDFDocument from "pdfkit";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import { summarizeIncomeRows } from "@/lib/export/incomeDocuments";

export type CpaSummaryPdfInput = {
  taxYear: string;
  expenseRows: ExportExpenseRow[];
  summaryLines: { line: string; total: number }[];
  incomeRows?: ExportIncomeRow[];
};

/** @deprecated Export route uses buildScheduleCMirrorPdf; kept for legacy tests. */
export async function buildCpaSummaryPdf(
  taxYear: string,
  expenseRows: ExportExpenseRow[],
  summaryLines: { line: string; total: number }[],
  incomeRows: ExportIncomeRow[] = [],
): Promise<Buffer> {
  return buildCpaSummaryPdfFromInput({
    taxYear,
    expenseRows,
    summaryLines,
    incomeRows,
  });
}

export async function buildCpaSummaryPdfFromInput(
  input: CpaSummaryPdfInput,
): Promise<Buffer> {
  const { taxYear, expenseRows, summaryLines, incomeRows = [] } = input;
  const incomeSummary = summarizeIncomeRows(incomeRows);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "LETTER" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(`${taxYear} Schedule C P&L Summary`, { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text("For estimation only — not tax advice.");
    doc.moveDown(1);
    doc.fillColor("#000000");

    doc.fontSize(11).font("Helvetica-Bold").text("Part I: Income");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);
    if (incomeRows.length === 0) {
      doc.text(
        "No 1099 forms captured yet — snap 1099-NEC / 1099-K from Export to add income.",
      );
    } else {
      doc.text(
        `Line 1 · Gross receipts or sales: $${incomeSummary.totalGross.toFixed(2)} (${incomeSummary.formCount} forms)`,
      );
      doc.text(
        `Line 7 · Gross Income: $${incomeSummary.totalGross.toFixed(2)}`,
      );
    }
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").text("Part II: Expenses");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);
    for (const line of summaryLines) {
      doc.text(`${line.line}: $${line.total.toFixed(2)}`);
    }
    const totalDeductible = expenseRows.reduce(
      (sum, r) => sum + (r.deductible ? r.deductibleAmount : 0),
      0,
    );
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text(`Total Deductible: $${totalDeductible.toFixed(2)}`);
    doc.text(`Receipt Count: ${expenseRows.length}`);

    if (incomeRows.length > 0) {
      doc.moveDown(0.5);
      const netProfit = incomeSummary.totalGross - totalDeductible;
      doc.text(`Net Profit (Est.): $${netProfit.toFixed(2)} (Line 31)`);
    }

    doc.moveDown(1.5);
    doc.fontSize(11).font("Helvetica-Bold").text("Expense Detail");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(9);

    for (const row of expenseRows) {
      const header = `${row.dateIso} · ${row.merchant} · $${row.amount.toFixed(2)}`;
      doc.font("Helvetica-Bold").text(header);
      doc.font("Helvetica").text(
        `${row.scheduleCLine || row.irsLine} · Deductible $${row.deductibleAmount.toFixed(2)} · ${row.categoryDisplay}`,
      );
      if (row.receiptAlias) {
        doc.fillColor("#444444").text(`Receipt: ${row.receiptAlias}`);
        doc.fillColor("#000000");
      }
      doc.moveDown(0.4);
    }

    if (incomeRows.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(11).font("Helvetica-Bold").text("1099 Income Forms");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(9);
      for (const row of incomeRows) {
        doc.text(
          `${row.dateIso} · ${row.formType} · ${row.payer} · $${row.amount.toFixed(2)}`,
        );
        doc.fillColor("#444444").text(`Document: ${row.incomeArchivePath}`);
        doc.fillColor("#000000");
        doc.moveDown(0.3);
      }
    }

    doc.end();
  });
}
