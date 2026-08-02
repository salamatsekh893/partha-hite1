// Standardized Export Utilities for CSV and Formatted Printable PDF Reports

export interface ExportColumn {
  header: string;
  key: string;
  formatter?: (val: any) => string;
}

// 1. Download data array as CSV file (Excel compatible)
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add header row
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

  // Add data rows
  rows.forEach(row => {
    const formattedRow = row.map(val => {
      if (val === null || val === undefined) return '""';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(",");
    csvContent += formattedRow + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Open printable formatted window for PDF download/printing
export function printPDFReport(title: string, subtitle: string, headers: string[], rows: (string | number)[][], userDetails?: { name: string; phone: string }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocker prevented opening the print report window. Please allow popups for this site.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - SuccessIndia Solar Portal</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-b: 3px solid #4f46e5;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #1e1b4b;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #6366f1;
            font-weight: 700;
            margin-top: 4px;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .meta-highlight {
            color: #0f172a;
            font-weight: 700;
          }
          .report-title-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 20px;
          }
          .report-title-box h2 {
            margin: 0;
            font-size: 18px;
            color: #0f172a;
          }
          .report-title-box p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          th {
            background-color: #1e1b4b;
            color: #ffffff;
            font-weight: 800;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">☀️ SUCCESS INDIA SOLAR ENERGY</div>
            <div class="brand-subtitle">Official Direct Selling & Network Business Portal</div>
          </div>
          <div class="report-meta">
            <div>Generated On: <span class="meta-highlight">${currentDate}</span></div>
            ${userDetails ? `<div>Distributor: <span class="meta-highlight">${userDetails.name} (${userDetails.phone})</span></div>` : ''}
          </div>
        </div>

        <div class="report-title-box">
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>

        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => `<td>${val !== null && val !== undefined ? val : '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>SuccessIndia Solar & Network Business Management System</div>
          <div>Page 1 of 1 • System Generated Certified Report</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
