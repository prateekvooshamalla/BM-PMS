import jsPDF from 'jspdf';
import { ProjectRecord } from '../types';
import { inr } from './utils';

function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function exportProjectRecordToPdf(record: ProjectRecord, fileName?: string) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  const nextPageIfNeeded = (extra = 12) => {
    if (y + extra > 285) {
      pdf.addPage();
      y = 16;
    }
  };

  const section = (title: string) => {
    nextPageIfNeeded(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(title, margin, y);
    y += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(record.input.projectName, margin, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`${record.input.location} · ${record.input.builtUpSft} sft · ${record.input.bedrooms} bed · ${record.input.bathrooms} bath`, margin, y);
  y += 10;

  section('Executive Summary');
  record.estimate.summary.forEach((item) => {
    nextPageIfNeeded();
    pdf.text(`${item.label}: ${item.value}`, margin, y);
    y += 6;
  });

  section('Project Inputs');
  const inputs = [
    `Quality: ${record.input.qualityLevel}`,
    `Floors: ${record.input.floors}`,
    `Wall: ${record.input.wallType}`,
    `Foundation: ${record.input.foundationType}`,
    `Slab: ${record.input.slabType}`,
    `Water source: ${record.input.waterSource}`,
    `Plumbing tier: ${record.input.plumbingTier}`,
    `Electrical tier: ${record.input.electricalTier}`,
  ];
  inputs.forEach((line) => { nextPageIfNeeded(); pdf.text(line, margin, y); y += 6; });

  section('Cost Breakdown');
  record.estimate.breakdown.forEach((item) => {
    nextPageIfNeeded();
    pdf.text(`${item.category}: ${inr(item.amount)} (${item.percentage}%)`, margin, y);
    y += 6;
  });

  section('Material BOQ');
  record.estimate.materials.slice(0, 30).forEach((item) => {
    nextPageIfNeeded();
    y = addWrappedText(pdf, `${item.name} · ${item.quantity} ${item.unit} · ${inr(item.rate)} · ${inr(item.amount)}${item.stage ? ` · ${item.stage}` : ''}`, margin, y, width - margin * 2);
  });

  section('Water Plan');
  record.estimate.waterPlan.forEach((item) => {
    nextPageIfNeeded();
    y = addWrappedText(pdf, `${item.stage}: ${item.totalLitres.toLocaleString('en-IN')} L total (${item.litresPerDay}/day for ${item.days} days). ${item.notes}`, margin, y, width - margin * 2);
  });

  section('Plumbing Plan');
  record.estimate.plumbingPlan.slice(0, 20).forEach((item) => {
    nextPageIfNeeded();
    y = addWrappedText(pdf, `${item.name}: ${item.quantity} ${item.unit}. ${item.selectionGuide}. Check: ${item.inspectionPoint}`, margin, y, width - margin * 2);
  });

  section('Execution Steps');
  record.estimate.phases.forEach((phase) => {
    nextPageIfNeeded();
    y = addWrappedText(pdf, `${phase.name}: day ${phase.startDay} to ${phase.endDay}. Deliverables: ${phase.deliverables.join(', ')}`, margin, y, width - margin * 2);
  });

  if (record.estimate.aiAnalysis && record.estimate.aiAnalysis.status === 'ready') {
    section('AI Analysis');
    y = addWrappedText(pdf, record.estimate.aiAnalysis.summary, margin, y, width - margin * 2);
    ['risks', 'opportunities', 'procurementNotes', 'paymentReleaseChecks'].forEach((key) => {
      const lines = (record.estimate.aiAnalysis as unknown as Record<string, string[]>)[key] || [];
      if (!lines.length) return;
      nextPageIfNeeded(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(key, margin, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      lines.forEach((line) => {
        nextPageIfNeeded();
        y = addWrappedText(pdf, `• ${line}`, margin, y, width - margin * 2);
      });
    });
  }

  pdf.save(fileName || `${record.input.projectName.replace(/\s+/g, '-').toLowerCase()}-v2-5.pdf`);
}
