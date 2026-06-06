const initSqlJs = require('sql.js');

(async () => {
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    console.log('✅ sql.js loaded');
    
    db.run(`
      CREATE TABLE cases (
        id TEXT PRIMARY KEY, 
        caseNumber TEXT UNIQUE NOT NULL, 
        caseType TEXT NOT NULL, 
        causeOfAction TEXT NOT NULL, 
        plaintiff TEXT NOT NULL, 
        defendant TEXT NOT NULL, 
        plaintiffPhone TEXT, 
        defendantPhone TEXT, 
        plaintiffAddress TEXT, 
        defendantAddress TEXT, 
        status TEXT NOT NULL DEFAULT 'filed', 
        judgeId TEXT, 
        judgeName TEXT, 
        clerkId TEXT, 
        clerkName TEXT, 
        departmentId TEXT, 
        departmentName TEXT, 
        estimatedDays INTEGER NOT NULL DEFAULT 60, 
        actualDays INTEGER, 
        createdAt TEXT NOT NULL, 
        deadline TEXT NOT NULL, 
        filingMaterials TEXT, 
        description TEXT, 
        amount REAL
      );
    `);
    console.log('✅ table created');
    
    const stmt = db.prepare('SELECT * FROM cases LIMIT 0');
    const cols = stmt.getColumnNames();
    console.log('columns count:', cols.length);
    console.log('columns:', cols);
    
    // Test insert
    const testValues = [
      '1', '(2024)京0101民初0001号', 'civil', '测试纠纷',
      '原告1', '被告1', '13800000001', '13900000001',
      '地址1', '地址2', 'filed', '5', '陈法官', '9', '周书记员',
      '1', '民事审判第一庭', 60, null, '2024-01-01', '2024-04-01',
      '[]', '测试', 10000
    ];
    console.log('values count:', testValues.length);
    
    db.run(`INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, testValues);
    console.log('✅ insert success');
    
    const result = db.exec('SELECT * FROM cases');
    console.log('result:', result);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e);
  }
  process.exit(0);
})();
