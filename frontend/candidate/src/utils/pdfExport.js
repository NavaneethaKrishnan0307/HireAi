/**
 * Client-Side Direct PDF Export Engine
 * Generates and triggers instant browser download of candidate/HR report
 */
export async function exportReportToPdf(elementId, candidateName = 'Candidate') {
  const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!element) {
    throw new Error('Report element not found for PDF generation');
  }

  const html2pdf = (await import('html2pdf.js')).default;
  const safeName = candidateName.replace(/\s+/g, '_');
  const filename = `Resume_Analyzer_Report_${safeName}.pdf`;

  // Clone element to sanitize buttons and interactive controls
  const clone = element.cloneNode(true);
  clone.querySelectorAll('button, .choose-btn, a.choose-btn, .no-print').forEach(el => el.remove());
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.appendChild(clone);
  document.body.appendChild(container);

  const opt = {
    margin: [10, 12, 10, 12],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
