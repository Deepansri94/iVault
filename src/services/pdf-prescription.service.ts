import { jsPDF } from 'jspdf';
import type { Medicine } from '../types/db.types';

/**
 * PDF Service for generating Pharmacy Procurement Orders and 30-Day Dosage Refills
 */
export class PdfPrescriptionService {
  /**
   * Generates a monthly purchase order PDF based on daily dosage calculation
   *
   * @param medicines Array of family medicine prescriptions
   */
  public static generateMedicineListPdf(medicines: Medicine[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Table Column Definitions with 30-day calculations
    const columns = [
      {
        title: 'Medicine & Salt',
        width: 38,
        value: (m: Medicine) => m.medicineName + (m.genericComposition ? `\n(${m.genericComposition})` : ''),
      },
      { title: 'Patient', width: 20, value: (m: Medicine) => m.memberName },
      { title: 'Form/Dose', width: 20, value: (m: Medicine) => `${m.type}\n${m.dosage}` },
      { title: 'Daily', width: 14, value: (m: Medicine) => `${m.dailyQuantity || 1}/day` },
      { title: '30D Need', width: 18, value: (m: Medicine) => `${(m.dailyQuantity || 1) * 30}` },
      { title: 'In Stock', width: 16, value: (m: Medicine) => `${m.currentStock}` },
      {
        title: 'QTY TO BUY',
        width: 22,
        value: (m: Medicine) => {
          const needed = (m.dailyQuantity || 1) * 30;
          const buy = Math.max(0, needed - m.currentStock);
          return `${buy} units`;
        },
      },
      { title: 'Instructions', width: 24, value: (m: Medicine) => `${m.instructions}\n${m.timings.join(', ')}` },
      { title: 'Notes', width: 18, value: (m: Medicine) => m.doctorNotes || '-' },
    ];

    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const tableX = (pageWidth - tableWidth) / 2;
    const cellPadding = 1.8;
    const lineHeight = 3.6;
    let y = margin;

    // Document Header
    doc.setFillColor(15, 118, 110);
    doc.rect(tableX, y, tableWidth, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('iVault Pro - Monthly Pharmacy Procurement Order', tableX + cellPadding + 1, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | 30-Day Dosage Refill Plan`,
      tableX + cellPadding + 1,
      y + 11
    );
    y += 16;

    const drawHeader = () => {
      doc.setFillColor(30, 41, 59);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.rect(tableX, y, tableWidth, 7, 'F');
      let x = tableX;
      columns.forEach((column) => {
        doc.text(column.title, x + cellPadding, y + 4.8);
        x += column.width;
      });
      y += 7;
    };

    drawHeader();

    let total30DayDemand = 0;
    let totalUnitsToPurchase = 0;

    medicines.forEach((medicine, rowIndex) => {
      const daily = medicine.dailyQuantity || 1;
      const need30 = daily * 30;
      const toBuy = Math.max(0, need30 - medicine.currentStock);
      total30DayDemand += need30;
      totalUnitsToPurchase += toBuy;

      const cellLines = columns.map((column) =>
        doc.splitTextToSize(column.value(medicine) || '-', column.width - cellPadding * 2)
      );
      const rowHeight = Math.max(7, ...cellLines.map((lines) => lines.length * lineHeight + cellPadding * 2));

      if (y + rowHeight > pageHeight - margin - 20) {
        doc.addPage();
        y = margin;
        drawHeader();
      }

      // Alternate row backgrounds
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
      }

      // Highlight QTY TO BUY column
      const buyColIndex = 6;
      let buyColX = tableX;
      for (let i = 0; i < buyColIndex; i++) buyColX += columns[i].width;
      doc.setFillColor(236, 253, 245);
      doc.rect(buyColX, y, columns[buyColIndex].width, rowHeight, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.rect(tableX, y, tableWidth, rowHeight);

      let x = tableX;
      cellLines.forEach((lines, columnIndex) => {
        const column = columns[columnIndex];
        doc.line(x, y, x, y + rowHeight);
        doc.setFont('helvetica', columnIndex === buyColIndex ? 'bold' : 'normal');
        doc.setFontSize(6.8);

        if (columnIndex === buyColIndex) {
          doc.setTextColor(4, 120, 87);
        } else {
          doc.setTextColor(30, 41, 59);
        }

        doc.text(lines, x + cellPadding, y + cellPadding + lineHeight - 0.6);
        x += column.width;
      });
      doc.line(tableX + tableWidth, y, tableX + tableWidth, y + rowHeight);
      y += rowHeight;
    });

    // Pharmacy Summary Box
    if (y + 22 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(tableX, y, tableWidth, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(tableX, y, tableWidth, 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('30-DAY PHARMACY PROCUREMENT SUMMARY:', tableX + cellPadding + 1, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      `• Unique Prescriptions: ${medicines.length} items   |   • Total 30-Day Consumption: ${total30DayDemand} units   |   • NET UNITS TO BUY: ${totalUnitsToPurchase} units`,
      tableX + cellPadding + 1,
      y + 11
    );

    doc.save(`Monthly_Medicine_Refill_Order_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
