const sql = require('mssql');
const sqlConfig = require('../config/mssql'); // Assuming you have your SQL config file
const fs = require('fs-extra');

const compareFiles = async (pildiPath) => {
  try {
    // Connect to the SQL database
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();

    // Get file names from the 'users' table
    const dbFiles = await request.query(
      'SELECT pilt FROM dbo.Tootajad WHERE pilt IS NOT NULL'
    );
    const dbFileNames = dbFiles.recordset.map((row) => row.pilt);

    // Get file names from the directory
    const directoryFiles = await fs.readdir(pildiPath);

    // Find files in the database that are not in the directory
    const missingFiles = dbFileNames.filter(
      (dbFile) => !directoryFiles.includes(dbFile)
    );

    // Find files in the directory that are not in the database
    const extraFiles = directoryFiles.filter(
      (dirFile) => !dbFileNames.includes(dirFile)
    );

    return {
      missingFiles,
      extraFiles,
    };
  } catch (error) {
    console.error('Error comparing files:', error);
    throw error;
  }
};

module.exports = compareFiles;
