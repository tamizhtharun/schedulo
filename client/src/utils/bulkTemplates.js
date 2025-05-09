// Utility to generate XLSX templates for faculties and subjects
import * as XLSX from 'xlsx';

export function generateFacultyTemplate() {
  const wsData = [
    ['Name', 'Email', 'Faculty ID', 'Phone Number'],
    ...Array(45).fill(['', '', '', ''])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculties');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

export function generateSubjectTemplate() {
  const wsData = [
    ['Subject Code', 'Subject Name', 'Acronym', 'Credit', 'Subject Type'],
    ...Array(20).fill(['', '', '', '', ''])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
