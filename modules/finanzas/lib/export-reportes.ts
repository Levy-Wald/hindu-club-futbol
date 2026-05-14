'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ReporteExportable {
  titulo: string
  tenantNombre: string
  filtros: Record<string, string>
  columnas: Array<{
    key: string
    label: string
    align?: 'left' | 'right' | 'center'
    format?: (v: unknown) => string
  }>
  filas: Array<Record<string, unknown>>
  totales?: Record<string, number>
}

export function exportarReportePDF(r: ReporteExportable): void {
  const doc = new jsPDF({ orientation: 'landscape' })

  // Header
  doc.setFontSize(16)
  doc.text(r.titulo, 14, 15)
  doc.setFontSize(9)
  doc.text(r.tenantNombre, 14, 22)

  let yPos = 28
  const filtroEntries = Object.entries(r.filtros)
  if (filtroEntries.length > 0) {
    doc.setFontSize(8)
    for (const [key, value] of filtroEntries) {
      doc.text(`${key}: ${value}`, 14, yPos)
      yPos += 5
    }
  }
  yPos += 2

  // Table
  const headers = r.columnas.map((c) => c.label)
  const body = r.filas.map((fila) =>
    r.columnas.map((col) => {
      const val = fila[col.key]
      if (col.format) return col.format(val)
      if (val == null) return ''
      return String(val)
    })
  )

  // Add totals row if present
  if (r.totales) {
    const totalsRow = r.columnas.map((col) => {
      if (col.key in (r.totales ?? {})) {
        const val = r.totales![col.key]
        if (col.format) return col.format(val)
        return String(val)
      }
      return ''
    })
    totalsRow[0] = totalsRow[0] || 'TOTALES'
    body.push(totalsRow)
  }

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      r.columnas.map((col, i) => [
        i,
        { halign: col.align ?? 'left' },
      ])
    ),
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.text(
      `Generado por ClubCore — ${new Date().toLocaleString('es-AR')} — Pag ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    )
  }

  doc.save(`${r.titulo.replace(/\s+/g, '_')}.pdf`)
}

export function exportarReporteXLSX(r: ReporteExportable): void {
  const wb = XLSX.utils.book_new()

  // Build header rows
  const aoa: (string | number)[][] = []
  aoa.push([r.titulo])
  aoa.push([r.tenantNombre])
  for (const [key, value] of Object.entries(r.filtros)) {
    aoa.push([`${key}: ${value}`])
  }
  aoa.push([]) // empty row

  // Column headers
  aoa.push(r.columnas.map((c) => c.label))

  // Data rows
  for (const fila of r.filas) {
    aoa.push(
      r.columnas.map((col) => {
        const val = fila[col.key]
        if (col.format) return col.format(val)
        if (val == null) return ''
        if (typeof val === 'number') return val
        return String(val)
      })
    )
  }

  // Totals row
  if (r.totales) {
    const totalsRow = r.columnas.map((col) => {
      if (col.key in (r.totales ?? {})) return r.totales![col.key]
      return ''
    })
    if (totalsRow[0] === '') totalsRow[0] = 'TOTALES' as unknown as number
    aoa.push(totalsRow as (string | number)[])
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, r.titulo.slice(0, 31))
  XLSX.writeFile(wb, `${r.titulo.replace(/\s+/g, '_')}.xlsx`)
}
