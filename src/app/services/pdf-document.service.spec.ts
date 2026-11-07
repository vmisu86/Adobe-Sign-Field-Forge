import { TestBed } from '@angular/core/testing';
import { PdfDocumentService } from './pdf-document.service';

// Rendering needs a real PDF and is checked in the browser; this covers the zoom state, which does not.
describe('PdfDocumentService zoom', () => {
  let pdf: PdfDocumentService;

  beforeEach(() => {
    pdf = TestBed.inject(PdfDocumentService);
  });

  it('starts by fitting the page to the window', () => {
    expect(pdf.zoomMode()).toBe('fit-width');
  });

  it('follows the window width while fitting, and ignores one-pixel wobble', () => {
    pdf.setAvailableWidth(900);
    expect(pdf.scaleInput()).toBe(900);
    pdf.setAvailableWidth(901);
    expect(pdf.scaleInput()).toBe(900);
    pdf.setAvailableWidth(920);
    expect(pdf.scaleInput()).toBe(920);
  });

  it('never goes below zero for a collapsed workspace', () => {
    pdf.setAvailableWidth(-40);
    expect(pdf.scaleInput()).toBe(0);
  });

  it('zooming in leaves fit mode and moves to the next step', () => {
    pdf.setManualScale(1);
    pdf.zoomIn();
    expect(pdf.zoomMode()).toBe('manual');
    expect(pdf.scaleInput()).toBe(1.25);
    pdf.zoomIn();
    expect(pdf.scaleInput()).toBe(1.5);
  });

  it('zooming out steps down, and stops at the smallest zoom', () => {
    pdf.setManualScale(0.5);
    pdf.zoomOut();
    expect(pdf.scaleInput()).toBe(0.25);
    pdf.zoomOut();
    expect(pdf.scaleInput()).toBe(0.25);
  });

  it('fit width goes back to following the window', () => {
    pdf.setAvailableWidth(800);
    pdf.setManualScale(2);
    expect(pdf.scaleInput()).toBe(2);
    pdf.fitWidth();
    expect(pdf.zoomMode()).toBe('fit-width');
    expect(pdf.scaleInput()).toBe(800);
  });

  it('reports the zoom as a percentage', () => {
    pdf.setManualScale(1.25);
    expect(pdf.scale()).toBe(1.25);
    expect(pdf.zoomPercent()).toBe(125);
  });

  it('keeps the page number within the document, and does nothing with no document', () => {
    pdf.setPage(5);
    expect(pdf.currentPage()).toBe(1);
  });
});
