/* ========================================================
   print.js — چاپ هوشمند A4 landscape با تنظیم خودکار فونت
   ======================================================== */

function smartPrint() {
  const table = document.getElementById('planner-table');
  if (!table) { window.print(); return; }

  const colCount = state.times.length;

  let fontSize, truncateMax, cellH;
  if (colCount > 16)      { fontSize = 6.5;  truncateMax = 2;  cellH = 44; }
  else if (colCount > 12) { fontSize = 9.5;  truncateMax = 3;  cellH = 50; }
  else if (colCount > 8)  { fontSize = 10.5; truncateMax = 4;  cellH = 58; }
  else if (colCount > 5)  { fontSize = 13;   truncateMax = 5;  cellH = 68; }
  else                    { fontSize = 9.5;  truncateMax = 99; cellH = 82; }

  document.documentElement.style.setProperty('--print-font-bc',   fontSize + 'px');
  document.documentElement.style.setProperty('--print-font-title', (fontSize - 0.5) + 'px');
  document.documentElement.style.setProperty('--print-cell-h',    cellH + 'px');
  document.documentElement.style.setProperty('--print-truncate',  truncateMax);

  PRINT_TRUNCATE_MAX = truncateMax;

  window.print();

  setTimeout(() => {
    PRINT_TRUNCATE_MAX = null;
    document.documentElement.style.removeProperty('--print-font-bc');
    document.documentElement.style.removeProperty('--print-font-title');
    document.documentElement.style.removeProperty('--print-cell-h');
    document.documentElement.style.removeProperty('--print-truncate');
  }, 2000);
}