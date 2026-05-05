'use client'

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'pdf_membretado'

export interface ExportData {
  headers: string[]
  rows: string[][]
  filename: string
}

export interface ClubBranding {
  nombre: string
  direccion: string
  email: string
  web: string
  logoUrl?: string
  usuario: string
  fecha: string
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(data: ExportData) {
  const lines = [
    data.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...data.rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, data.filename.replace(/\.[^.]+$/, '.csv'))
}

export function exportToXLSX(data: ExportData) {
  const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')

  // Auto-width columns
  const colWidths = data.headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...data.rows.map((r) => (r[i] ?? '').length))
    return { wch: Math.min(maxLen + 2, 40) }
  })
  ws['!cols'] = colWidths

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, data.filename.replace(/\.[^.]+$/, '.xlsx'))
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: data.headers.length > 6 ? 'landscape' : 'portrait' })

  doc.setFontSize(14)
  doc.text(data.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' '), 14, 15)
  doc.setFontSize(8)
  doc.text(`Exportado: ${new Date().toLocaleDateString('es-AR')}`, 14, 22)

  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 28,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const blob = doc.output('blob')
  triggerDownload(blob, data.filename.replace(/\.[^.]+$/, '.pdf'))
}

export async function exportToPDFMembretado(data: ExportData, branding: ClubBranding) {
  const doc = new jsPDF({ orientation: data.headers.length > 6 ? 'landscape' : 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let startY = 12

  // Logo + header
  if (branding.logoUrl) {
    try {
      const img = await loadImage(branding.logoUrl)
      doc.addImage(img, 'PNG', 14, startY, 18, 18)
    } catch {
      // No logo available, continue without it
    }
  }

  const textX = branding.logoUrl ? 36 : 14

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(branding.nombre, textX, startY + 6)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(branding.direccion, textX, startY + 12)
  doc.text(`${branding.email} | ${branding.web}`, textX, startY + 16)

  // Right side: fecha + usuario
  doc.setFontSize(8)
  doc.text(`Fecha: ${branding.fecha}`, pageWidth - 14, startY + 6, { align: 'right' })
  doc.text(`Exportado por: ${branding.usuario}`, pageWidth - 14, startY + 12, { align: 'right' })

  startY += 24

  // Separator line
  doc.setDrawColor(200)
  doc.line(14, startY, pageWidth - 14, startY)
  startY += 6

  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawPage: (hookData) => {
      // Footer on each page
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `${branding.nombre} - Página ${hookData.pageNumber}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      )
    },
  })

  const blob = doc.output('blob')
  triggerDownload(blob, data.filename.replace(/\.[^.]+$/, '_membretado.pdf'))
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

export function exportData(format: ExportFormat, data: ExportData, branding?: ClubBranding) {
  switch (format) {
    case 'csv':
      return exportToCSV(data)
    case 'xlsx':
      return exportToXLSX(data)
    case 'pdf':
      return exportToPDF(data)
    case 'pdf_membretado':
      if (!branding) throw new Error('Branding requerido para PDF membretado')
      return exportToPDFMembretado(data, branding)
  }
}
