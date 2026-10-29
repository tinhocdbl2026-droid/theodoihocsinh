import * as XLSX from 'xlsx';
import { ClassRoom, Student, AppSettings } from '../types';

/**
 * Format sheet name safe for Excel (cannot contain '/', '\', '?', '*', ':', '[', ']')
 */
function getSafeSheetName(className: string): string {
  const safe = className.replace(/[/\\?*[\]:]/g, '-');
  return `Lớp ${safe}`.substring(0, 31);
}

/**
 * Helper to generate 35 weeks headers: T1, T2, ..., T35
 */
export function getWeekHeaders(): string[] {
  const headers: string[] = [];
  for (let i = 1; i <= 35; i++) {
    headers.push(`T${i}`);
  }
  return headers;
}

/**
 * Export a single class to an Excel file with formulas, headers, and metadata
 */
export function exportSingleClassToExcel(
  classRoom: ClassRoom,
  students: Student[],
  settings: AppSettings,
  semester: 'all' | 'sem1' | 'sem2' = 'all'
) {
  const wb = XLSX.utils.book_new();

  const startWeek = semester === 'sem2' ? 19 : 1;
  const endWeek = semester === 'sem1' ? 18 : 35;
  const weekCount = endWeek - startWeek + 1;

  // Header rows
  const data: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [`BẢNG THEO DÕI ĐIỂM PHÁT BIỂU & TÍCH CỰC HỌC TẬP - ${settings.subjectName.toUpperCase()}`],
    [`Năm học: ${settings.schoolYear} | Lớp: ${classRoom.name} | Sĩ số: ${students.length} học sinh`],
    [`Giáo viên phụ trách: ${settings.teacherName} | Phạm vi: ${semester === 'sem1' ? 'Học kỳ I (Tuần 1 - 18)' : semester === 'sem2' ? 'Học kỳ II (Tuần 19 - 35)' : 'Cả năm (Tuần 1 - 35)'}`],
    [], // empty spacer
  ];

  // Column header row
  const tableHeader = ['STT', 'Mã HS', 'Họ và tên', 'Giới tính'];
  for (let w = startWeek; w <= endWeek; w++) {
    tableHeader.push(`Tuần ${w}`);
  }
  tableHeader.push('TỔNG CỘNG', 'GHI CHÚ');
  data.push(tableHeader);

  // Student rows
  students.forEach((stu, idx) => {
    const row: (string | number)[] = [
      idx + 1,
      stu.id,
      stu.fullName,
      stu.gender === 'nu' ? 'Nữ' : stu.gender === 'nam' ? 'Nam' : 'Chưa xác định',
    ];

    let rowSum = 0;
    for (let w = startWeek; w <= endWeek; w++) {
      const score = stu.scores[w] || 0;
      row.push(score);
      rowSum += score;
    }

    row.push(rowSum);
    row.push(stu.notes || '');
    data.push(row);
  });

  // Summary row at the bottom (Tổng điểm toàn lớp theo từng tuần)
  const summaryRow: (string | number)[] = ['TỔNG CẢ LỚP', '', '', ''];
  let grandTotal = 0;
  for (let w = startWeek; w <= endWeek; w++) {
    const weekTotal = students.reduce((sum, s) => sum + (s.scores[w] || 0), 0);
    summaryRow.push(weekTotal);
    grandTotal += weekTotal;
  }
  summaryRow.push(grandTotal, '');
  data.push(summaryRow);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 12 }, // Mã HS
    { wch: 25 }, // Họ và tên
    { wch: 10 }, // Giới tính
  ];
  for (let i = 0; i < weekCount; i++) {
    colWidths.push({ wch: 6 }); // Week cols
  }
  colWidths.push({ wch: 14 }); // TỔNG CỘNG
  colWidths.push({ wch: 20 }); // Ghi chú
  ws['!cols'] = colWidths;

  const sheetName = getSafeSheetName(classRoom.name);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `Theo_doi_hoc_sinh_Lop_${classRoom.name.replace('/', '_')}_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export ALL 23 CLASSES into a single comprehensive Excel Workbook with 23 separate sheets
 */
export function exportAll23ClassesToExcel(
  classRooms: ClassRoom[],
  allStudents: Student[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();

  // 1. First Sheet: TỔNG HỢP TOÀN TRƯỜNG (Overview of all 23 classes)
  const overviewData: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [`BÁO CÁO TỔNG HỢP THEO DÕI THI ĐUA HỌC TẬP - ${settings.subjectName.toUpperCase()}`],
    [`Năm học: ${settings.schoolYear} | Giáo viên: ${settings.teacherName}`],
    [`Tổng số lớp: ${classRooms.length} lớp | Tổng học sinh: ${allStudents.length} em`],
    [],
    ['STT', 'Tên Lớp', 'Khối', 'Sĩ số', 'Tổng điểm tích lũy', 'Điểm trung bình/HS', 'Học sinh xuất sắc nhất', 'Điểm cao nhất', 'Tên Sheet tương ứng'],
  ];

  classRooms.forEach((cls, idx) => {
    const classStudents = allStudents.filter((s) => s.classId === cls.id);
    const totalPts = classStudents.reduce((sum, s) => sum + s.totalScore, 0);
    const avgPts = classStudents.length > 0 ? (totalPts / classStudents.length).toFixed(1) : '0';
    const sorted = [...classStudents].sort((a, b) => b.totalScore - a.totalScore);
    const topStudent = sorted[0];

    overviewData.push([
      idx + 1,
      cls.name,
      `Khối ${cls.grade}`,
      classStudents.length,
      totalPts,
      avgPts,
      topStudent ? topStudent.fullName : 'Chưa có',
      topStudent ? topStudent.totalScore : 0,
      getSafeSheetName(cls.name),
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng Hợp 23 Lớp');

  // 2. Individual sheets for each of the 23 classes
  classRooms.forEach((cls) => {
    const students = allStudents.filter((s) => s.classId === cls.id);
    students.sort((a, b) => a.stt - b.stt);

    const sheetData: (string | number)[][] = [
      [settings.schoolName.toUpperCase()],
      [`SỔ THEO DÕI 35 TUẦN - LỚP ${cls.name} (${settings.schoolYear})`],
      [`Giáo viên: ${settings.teacherName} | Môn: ${settings.subjectName} | Sĩ số: ${students.length}`],
      [],
    ];

    // Header row
    const headerRow = ['STT', 'Họ và tên'];
    for (let w = 1; w <= 35; w++) {
      headerRow.push(`T${w}`);
    }
    headerRow.push('TỔNG CỘNG', 'GHI CHÚ');
    sheetData.push(headerRow);

    // Student rows
    students.forEach((stu, sIdx) => {
      const row: (string | number)[] = [sIdx + 1, stu.fullName];
      let rowSum = 0;
      for (let w = 1; w <= 35; w++) {
        const sc = stu.scores[w] || 0;
        row.push(sc);
        rowSum += sc;
      }
      row.push(rowSum);
      row.push(stu.notes || '');
      sheetData.push(row);
    });

    // Class total row
    const classTotalRow: (string | number)[] = ['TỔNG LỚP', ''];
    let grandSum = 0;
    for (let w = 1; w <= 35; w++) {
      const wTotal = students.reduce((sum, s) => sum + (s.scores[w] || 0), 0);
      classTotalRow.push(wTotal);
      grandSum += wTotal;
    }
    classTotalRow.push(grandSum, '');
    sheetData.push(classTotalRow);

    const wsClass = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths
    const cols = [{ wch: 6 }, { wch: 25 }];
    for (let w = 1; w <= 35; w++) {
      cols.push({ wch: 5 });
    }
    cols.push({ wch: 12 }, { wch: 20 });
    wsClass['!cols'] = cols;

    const sheetName = getSafeSheetName(cls.name);
    XLSX.utils.book_append_sheet(wb, wsClass, sheetName);
  });

  const fileName = `So_Theo_Doi_23_Lop_35_Tuan_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Leaderboard / Bảng xếp hạng to Excel
 */
export function exportLeaderboardToExcel(
  classRoom: ClassRoom | null,
  students: Student[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();
  const sorted = [...students].sort((a, b) => b.totalScore - a.totalScore);

  const title = classRoom
    ? `BẢNG XẾP HẠNG THI ĐUA HỌC TẬP - LỚP ${classRoom.name}`
    : `BẢNG XẾP HẠNG TOÀN DIỆN THI ĐUA HỌC TẬP`;

  const data: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [title],
    [`Năm học: ${settings.schoolYear} | Môn: ${settings.subjectName}`],
    [],
    ['Hạng', 'STT', 'Họ và tên', 'Lớp', 'Tổng điểm tích lũy', 'Xếp loại thi đua', 'Ghi chú'],
  ];

  let currentRank = 1;
  sorted.forEach((stu, idx) => {
    if (idx > 0 && stu.totalScore < sorted[idx - 1].totalScore) {
      currentRank = idx + 1;
    }

    let medal = '';
    if (currentRank === 1) medal = 'Hạng 1 (Xuất sắc)';
    else if (currentRank === 2) medal = 'Hạng 2 (Rất tốt)';
    else if (currentRank === 3) medal = 'Hạng 3 (Tốt)';
    else if (stu.totalScore >= 15) medal = 'Tích cực';
    else if (stu.totalScore >= 8) medal = 'Khá';
    else medal = 'Cần khích lệ';

    data.push([
      currentRank,
      stu.stt,
      stu.fullName,
      classRoom?.name || stu.classId,
      stu.totalScore,
      medal,
      stu.notes || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 6 },
    { wch: 25 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bang_Xep_Hang');
  const fileName = `Bang_Xep_Hang_${classRoom ? classRoom.name.replace('/', '_') : 'Toan_Truong'}_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generate and download a standard template Excel file for importing students
 */
export function downloadSampleExcelTemplate() {
  const wb = XLSX.utils.book_new();
  const headers = ['STT', 'Họ và tên', 'Giới tính', 'Ghi chú'];
  for (let w = 1; w <= 35; w++) {
    headers.push(`T${w}`);
  }

  const sampleRows: (string | number)[][] = [
    headers,
    [1, 'Nguyễn Văn An', 'Nam', 'Lớp trưởng', 2, 1, 3, 0, 0],
    [2, 'Trần Thị Mai', 'Nữ', 'Lớp phó', 1, 2, 0, 1, 0],
    [3, 'Lê Hoàng Long', 'Nam', '', 0, 1, 1, 0, 0],
    [4, 'Phạm Ngọc Trâm', 'Nữ', '', 1, 0, 0, 2, 0],
    [5, 'Đỗ Minh Khang', 'Nam', '', 0, 0, 1, 0, 0],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Hoc_Sinh');

  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_35_Tuan.xlsx');
}

/**
 * Parse uploaded Excel or CSV file to extract student roster
 */
export async function parseExcelOrCsvFile(
  file: File,
  targetClassId: string
): Promise<{ students: Omit<Student, 'id'>[]; totalFound: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

        if (!rawData || rawData.length === 0) {
          throw new Error('Tệp không có dữ liệu');
        }

        // Find header row (looks for "họ và tên" or "tên" or "họ tên")
        let headerRowIndex = -1;
        let nameColIndex = -1;
        let sttColIndex = -1;
        let notesColIndex = -1;
        let genderColIndex = -1;
        const weekColMap: Record<number, number> = {};

        for (let r = 0; r < Math.min(rawData.length, 10); r++) {
          const row = rawData[r];
          if (!row) continue;

          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim().toLowerCase();
            if (cell.includes('họ và tên') || cell === 'họ tên' || cell === 'tên học sinh' || cell === 'họ và tên đệm' || cell === 'fullname' || cell === 'name') {
              headerRowIndex = r;
              nameColIndex = c;
            } else if (cell === 'stt' || cell === 'số tt' || cell === 'no') {
              sttColIndex = c;
            } else if (cell.includes('ghi chú') || cell === 'note') {
              notesColIndex = c;
            } else if (cell.includes('giới tính') || cell === 'nam/nữ' || cell === 'gender') {
              genderColIndex = c;
            } else {
              // check week columns: T1, T2, Tuần 1, W1
              const weekMatch = cell.match(/^(?:t|tuần|w)\s*(\d+)$/i);
              if (weekMatch) {
                const wNum = parseInt(weekMatch[1], 10);
                if (wNum >= 1 && wNum <= 35) {
                  weekColMap[wNum] = c;
                }
              }
            }
          }

          if (nameColIndex !== -1) {
            break;
          }
        }

        // If no explicit header row, assume column 1 or 2 is name
        if (nameColIndex === -1) {
          headerRowIndex = 0;
          nameColIndex = 1; // standard column B
        }

        const parsedStudents: Omit<Student, 'id'>[] = [];
        let autoStt = 1;

        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          const rawName = String(row[nameColIndex] || '').trim();
          if (!rawName || rawName.toLowerCase().includes('tổng cộng') || rawName.toLowerCase().includes('tổng cả lớp')) {
            continue;
          }

          let stt = autoStt;
          if (sttColIndex !== -1 && row[sttColIndex] !== undefined) {
            const parsedStt = parseInt(String(row[sttColIndex]), 10);
            if (!isNaN(parsedStt)) {
              stt = parsedStt;
            }
          }

          const notes = notesColIndex !== -1 ? String(row[notesColIndex] || '').trim() : '';
          const genderRaw = genderColIndex !== -1 ? String(row[genderColIndex] || '').trim().toLowerCase() : '';
          const normalizedGender = genderRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const gender: Student['gender'] = ['nu','f','female'].includes(normalizedGender) ? 'nu' : ['nam','m','male'].includes(normalizedGender) ? 'nam' : '';

          const scores: Record<number, number> = {};
          let totalScore = 0;
          for (let w = 1; w <= 35; w++) {
            if (weekColMap[w] !== undefined && row[weekColMap[w]] !== undefined) {
              const val = Math.max(0, parseInt(String(row[weekColMap[w]]), 10) || 0);
              scores[w] = val;
              totalScore += val;
            } else {
              scores[w] = 0;
            }
          }

          parsedStudents.push({
            stt,
            fullName: rawName,
            classId: targetClassId,
            scores,
            totalScore,
            notes,
            gender,
          });

          autoStt++;
        }

        resolve({ students: parsedStudents, totalFound: parsedStudents.length });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Export Weekly Report for a SINGLE class
 */
export function exportWeeklyClassReport(
  week: number,
  classRoom: ClassRoom,
  students: Student[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();

  const data: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [`BÁO CÁO KẾT QUẢ PHÁT BIỂU TUẦN ${week} - ${settings.subjectName.toUpperCase()}`],
    [`Năm học: ${settings.schoolYear} | Lớp: ${classRoom.name} | Sĩ số: ${students.length} học sinh`],
    [`Giáo viên: ${settings.teacherName}`],
    [],
    ['STT', 'Mã HS', 'Họ và tên', 'Giới tính', `Điểm Tuần ${week}`, 'Đánh giá tuần', 'Tổng điểm 35T', 'Ghi chú'],
  ];

  let weekTotalPoints = 0;
  let activeStudentCount = 0;

  students.forEach((stu, idx) => {
    const wScore = stu.scores[week] || 0;
    weekTotalPoints += wScore;
    if (wScore > 0) activeStudentCount++;

    let evalText = 'Chưa phát biểu';
    if (wScore >= 3) evalText = 'Rất tích cực (Xuất sắc)';
    else if (wScore === 2) evalText = 'Tích cực';
    else if (wScore === 1) evalText = 'Đạt';

    data.push([
      idx + 1,
      stu.id,
      stu.fullName,
      stu.gender === 'nu' ? 'Nữ' : stu.gender === 'nam' ? 'Nam' : 'Chưa xác định',
      wScore,
      evalText,
      stu.totalScore,
      stu.notes || '',
    ]);
  });

  // Summary row
  data.push([
    'TỔNG CỘNG',
    '',
    '',
    '',
    weekTotalPoints,
    `Đã phát biểu: ${activeStudentCount}/${students.length}`,
    students.reduce((s, stu) => s + stu.totalScore, 0),
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Tuan_${week}`);
  const fileName = `Bao_Cao_Tuan_${week}_Lop_${classRoom.name.replace('/', '_')}_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Weekly Report for ALL CLASSES in a given week
 */
export function exportAllClassesWeeklyReport(
  week: number,
  classes: ClassRoom[],
  allStudents: Student[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [`BÁO CÁO TỔNG HỢP TOÀN TRƯỜNG TUẦN ${week} - ${settings.subjectName.toUpperCase()}`],
    [`Năm học: ${settings.schoolYear} | Giáo viên: ${settings.teacherName}`],
    [],
    ['STT', 'Lớp', 'Khối', 'Sĩ số', `Tổng lượt cộng T${week}`, 'Số HS phát biểu', 'Tỉ lệ tham gia', 'HS nổi bật tuần', 'Điểm tuần cao nhất'],
  ];

  let grandWeekPoints = 0;
  let grandStudents = 0;

  classes.forEach((cls, idx) => {
    const classStudents = allStudents.filter((s) => s.classId === cls.id);
    const wTotal = classStudents.reduce((sum, s) => sum + (s.scores[week] || 0), 0);
    const activeCount = classStudents.filter((s) => (s.scores[week] || 0) > 0).length;
    const rate = classStudents.length > 0 ? Math.round((activeCount / classStudents.length) * 100) : 0;
    
    // Top student in this week
    const sortedThisWeek = [...classStudents].sort((a, b) => (b.scores[week] || 0) - (a.scores[week] || 0));
    const topStu = sortedThisWeek[0];
    const topScore = topStu ? (topStu.scores[week] || 0) : 0;

    grandWeekPoints += wTotal;
    grandStudents += classStudents.length;

    summaryData.push([
      idx + 1,
      cls.name,
      `Khối ${cls.grade}`,
      classStudents.length,
      wTotal,
      activeCount,
      `${rate}%`,
      topScore > 0 ? topStu.fullName : 'Chưa có',
      topScore,
    ]);
  });

  summaryData.push([
    'TỔNG CỘNG',
    `${classes.length} lớp`,
    '',
    grandStudents,
    grandWeekPoints,
    '',
    '',
    '',
    '',
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 25 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, `Tong_Hop_Tuan_${week}`);

  // Individual sheets for each class for this week
  classes.forEach((cls) => {
    const classStudents = allStudents.filter((s) => s.classId === cls.id);
    classStudents.sort((a, b) => a.stt - b.stt);

    const sheetData: (string | number)[][] = [
      [settings.schoolName.toUpperCase()],
      [`KẾT QUẢ PHÁT BIỂU TUẦN ${week} - LỚP ${cls.name}`],
      [`Sĩ số: ${classStudents.length} em | GV: ${settings.teacherName}`],
      [],
      ['STT', 'Họ và tên', `Điểm T${week}`, 'Tổng cả năm (35T)', 'Đánh giá', 'Ghi chú'],
    ];

    classStudents.forEach((stu, sIdx) => {
      const sc = stu.scores[week] || 0;
      let evalText = 'Chưa phát biểu';
      if (sc >= 3) evalText = 'Rất tích cực';
      else if (sc === 2) evalText = 'Tích cực';
      else if (sc === 1) evalText = 'Đạt';

      sheetData.push([
        sIdx + 1,
        stu.fullName,
        sc,
        stu.totalScore,
        evalText,
        stu.notes || '',
      ]);
    });

    const wsClass = XLSX.utils.aoa_to_sheet(sheetData);
    wsClass['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsClass, getSafeSheetName(cls.name));
  });

  const fileName = `Bao_Cao_Tuan_${week}_Tat_Ca_Lop_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export Semester Report for ALL CLASSES (HK1: T1..T18 or HK2: T19..T35)
 */
export function exportAllClassesSemesterReport(
  semester: 'sem1' | 'sem2',
  classes: ClassRoom[],
  allStudents: Student[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();
  const startWeek = semester === 'sem2' ? 19 : 1;
  const endWeek = semester === 'sem1' ? 18 : 35;
  const semTitle = semester === 'sem1' ? 'HỌC KỲ I (Tuần 1 - 18)' : 'HỌC KỲ II (Tuần 19 - 35)';

  // Sheet 1: Tổng Hợp Học Kỳ
  const summaryData: (string | number)[][] = [
    [settings.schoolName.toUpperCase()],
    [`BÁO CÁO TỔNG HỢP ${semTitle.toUpperCase()} - ${settings.subjectName.toUpperCase()}`],
    [`Năm học: ${settings.schoolYear} | Giáo viên: ${settings.teacherName}`],
    [],
    ['STT', 'Lớp', 'Khối', 'Sĩ số', `Tổng điểm ${semester === 'sem1' ? 'HK1' : 'HK2'}`, 'Điểm TB/HS', 'HS xuất sắc nhất', 'Điểm cao nhất'],
  ];

  classes.forEach((cls, idx) => {
    const classStudents = allStudents.filter((s) => s.classId === cls.id);
    let semTotal = 0;
    classStudents.forEach((stu) => {
      for (let w = startWeek; w <= endWeek; w++) {
        semTotal += stu.scores[w] || 0;
      }
    });

    const avg = classStudents.length > 0 ? (semTotal / classStudents.length).toFixed(1) : '0';

    // Top student in semester
    const withSemScore = classStudents.map((stu) => {
      let sScore = 0;
      for (let w = startWeek; w <= endWeek; w++) sScore += stu.scores[w] || 0;
      return { ...stu, semScore: sScore };
    });
    withSemScore.sort((a, b) => b.semScore - a.semScore);
    const top = withSemScore[0];

    summaryData.push([
      idx + 1,
      cls.name,
      `Khối ${cls.grade}`,
      classStudents.length,
      semTotal,
      avg,
      top ? top.fullName : 'Chưa có',
      top ? top.semScore : 0,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 25 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, `Tong_Hop_${semester === 'sem1' ? 'HK1' : 'HK2'}`);

  // Individual sheets for each class
  classes.forEach((cls) => {
    const classStudents = allStudents.filter((s) => s.classId === cls.id);
    classStudents.sort((a, b) => a.stt - b.stt);

    const sheetData: (string | number)[][] = [
      [settings.schoolName.toUpperCase()],
      [`SỔ THEO DÕI ${semTitle} - LỚP ${cls.name}`],
      [`Giáo viên: ${settings.teacherName} | Sĩ số: ${classStudents.length}`],
      [],
    ];

    const header = ['STT', 'Họ và tên'];
    for (let w = startWeek; w <= endWeek; w++) {
      header.push(`T${w}`);
    }
    header.push(`TỔNG ${semester === 'sem1' ? 'HK1' : 'HK2'}`, 'GHI CHÚ');
    sheetData.push(header);

    classStudents.forEach((stu, sIdx) => {
      const row: (string | number)[] = [sIdx + 1, stu.fullName];
      let rSum = 0;
      for (let w = startWeek; w <= endWeek; w++) {
        const sc = stu.scores[w] || 0;
        row.push(sc);
        rSum += sc;
      }
      row.push(rSum);
      row.push(stu.notes || '');
      sheetData.push(row);
    });

    const wsClass = XLSX.utils.aoa_to_sheet(sheetData);
    const cols = [{ wch: 6 }, { wch: 25 }];
    for (let w = startWeek; w <= endWeek; w++) cols.push({ wch: 5 });
    cols.push({ wch: 12 }, { wch: 20 });
    wsClass['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, wsClass, getSafeSheetName(cls.name));
  });

  const fileName = `Bao_Cao_${semester === 'sem1' ? 'Hoc_Ky_1' : 'Hoc_Ky_2'}_Tat_Ca_Lop_${settings.schoolYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
