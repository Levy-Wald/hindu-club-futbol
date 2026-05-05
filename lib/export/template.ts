'use client'

import * as XLSX from 'xlsx'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadTemplateCSV(headers: string[], filename: string, sampleRow?: string[]) {
  const rows = [headers.join(',')]
  if (sampleRow) {
    rows.push(sampleRow.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
  }
  const csv = rows.join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename.replace(/\.[^.]+$/, '.csv'))
}

export function downloadTemplateXLSX(headers: string[], filename: string, sampleRow?: string[]) {
  const data = sampleRow ? [headers, sampleRow] : [headers]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo')

  // Style header row width
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 15) }))

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  triggerDownload(blob, filename.replace(/\.[^.]+$/, '.xlsx'))
}
