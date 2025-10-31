const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const POINTS_PER_DUTY = 500;

function parseExcelFile(filePath, holiday) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const records = [];
  
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (row && row[1] && row[2]) {
      records.push({
        序号: row[0],
        部门: row[1],
        姓名: row[2],
        节假日: holiday,
        积分: POINTS_PER_DUTY
      });
    }
  }
  
  return records;
}

const file1Path = path.join(__dirname, '../excels/警航支队中秋国庆慰问人员名单(2)_中秋.xlsx');
const file2Path = path.join(__dirname, '../excels/警航支队中秋国庆慰问人员名单_国庆.xlsx');
// const file1Path = path.join(__dirname, '../excels/中秋节值班总名单（194人).xlsx');
// const file2Path = path.join(__dirname, '../excels/国庆节值班总名单（305人）.xlsx');

const midAutumnData = parseExcelFile(file1Path, '中秋节');
const nationalDayData = parseExcelFile(file2Path, '国庆节');

console.log(`解析完成: 中秋节 ${midAutumnData.length} 人, 国庆节 ${nationalDayData.length} 人`);

const departmentMap = new Map();
let departmentIdCounter = 7;

[...midAutumnData, ...nationalDayData].forEach(record => {
  const deptName = record.部门;
  if (!departmentMap.has(deptName)) {
    departmentMap.set(deptName, {
      id: departmentIdCounter++,
      name: deptName
    });
  }
});

const departments = Array.from(departmentMap.values());
console.log(`统计到 ${departments.length} 个部门`);

const midAutumnDataWithDeptId = midAutumnData.map(record => ({
  ...record,
  部门id: departmentMap.get(record.部门).id,
  部门: undefined,
})).map(({ 部门, ...rest }) => rest);

const nationalDayDataWithDeptId = nationalDayData.map(record => ({
  ...record,
  部门id: departmentMap.get(record.部门).id,
  部门: undefined
})).map(({ 部门, ...rest }) => rest);

const userPointsMap = new Map();

[...midAutumnData, ...nationalDayData].forEach(record => {
  const key = record.姓名;
  if (userPointsMap.has(key)) {
    const existing = userPointsMap.get(key);
    existing.积分 += POINTS_PER_DUTY;
    existing.值班次数 += 1;
  } else {
    userPointsMap.set(key, {
      姓名: record.姓名,
      部门id: departmentMap.get(record.部门).id,
      积分: POINTS_PER_DUTY,
      值班次数: 1
    });
  }
});

const summaryData = Array.from(userPointsMap.values()).sort((a, b) => b.积分 - a.积分);

console.log(`去重后: 共 ${summaryData.length} 人`);
console.log(`积分最高: ${summaryData[0].姓名} - ${summaryData[0].积分}分 (${summaryData[0].值班次数}次)`);

const outputContent = `export interface Department {
  id: number
  name: string
}

export interface DutyRecord {
  序号: number
  部门id: number
  姓名: string
  节假日: string
  积分: number
}

export interface UserPointsSummary {
  姓名: string
  部门id: number
  积分: number
  值班次数: number
}

export const departments: Department[] = ${JSON.stringify(departments, null, 2)}

export const midAutumnDutyRecords: DutyRecord[] = ${JSON.stringify(midAutumnDataWithDeptId, null, 2)}

export const nationalDayDutyRecords: DutyRecord[] = ${JSON.stringify(nationalDayDataWithDeptId, null, 2)}

export const userPointsSummary: UserPointsSummary[] = ${JSON.stringify(summaryData, null, 2)}
`;

const outputPath = path.join(__dirname, '../data/duty-records_2.ts');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, outputContent, 'utf-8');

console.log(`输出文件已生成: ${outputPath}`);
