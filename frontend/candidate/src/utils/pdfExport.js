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
  const safeName = (candidateName || 'Candidate').replace(/\s+/g, '_');
  const filename = `Resume_Analyzer_Report_${safeName}.pdf`;

  // Temporarily adjust styles so the entire report is visible without scrollbars
  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;
  const prevHeight = element.style.height;

  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.height = 'auto';

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      backgroundColor: '#ffffff',
      ignoreElements: (el) => {
        return (
          el.tagName === 'BUTTON' ||
          el.classList?.contains('no-print') ||
          el.classList?.contains('choose-btn') ||
          el.classList?.contains('secondary-btn')
        );
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } finally {
    element.style.overflow = prevOverflow;
    element.style.maxHeight = prevMaxHeight;
    element.style.height = prevHeight;
  }
}
