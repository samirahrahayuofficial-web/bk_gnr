import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// TiDB Cloud MySQL Config
const MYSQL_CONFIG = {
  host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT) || 4000,
  user: process.env.TIDB_USER || 'w7GEY6Un4aGoMqB.root',
  password: process.env.TIDB_PASSWORD || 'BfBY2uoBsJhIBcE6',
  database: process.env.TIDB_DATABASE || 'test',
  ssl: {
    minVersion: 'TLSv1.2' as const,
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;
let isDbConnected = false;
let lastDbError = '';

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(MYSQL_CONFIG);
  }
  return pool;
}

// Auto Initialize MySQL Schema
async function initMySqlSchema() {
  try {
    const p = getPool();
    const conn = await p.getConnection();

    console.log('🔗 Connecting to TiDB Cloud MySQL...');

    // Create Database if needed
    await conn.query('CREATE DATABASE IF NOT EXISTS `sibks_db`');
    await conn.query('USE `sibks_db`');

    // 1. Settings Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`system_settings\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`data\` JSON NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`username\` VARCHAR(100) UNIQUE NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255),
        \`role\` VARCHAR(50) NOT NULL,
        \`password\` VARCHAR(255),
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`related_id\` VARCHAR(100),
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Teachers Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`teachers\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`nip\` VARCHAR(100),
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255),
        \`phone\` VARCHAR(50),
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Academic Years Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`academic_years\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`semester\` VARCHAR(50) NOT NULL,
        \`is_active\` BOOLEAN DEFAULT FALSE,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Study Programs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`study_programs\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`head_of_program\` VARCHAR(255),
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Classes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`classes\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`grade\` VARCHAR(20) NOT NULL,
        \`program_id\` VARCHAR(100),
        \`homeroom_teacher\` VARCHAR(255),
        \`academic_year_id\` VARCHAR(100),
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Students Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`students\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`nis\` VARCHAR(50) NOT NULL,
        \`nisn\` VARCHAR(50),
        \`name\` VARCHAR(255) NOT NULL,
        \`gender\` VARCHAR(10) NOT NULL,
        \`class_id\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(50),
        \`parent_name\` VARCHAR(255),
        \`parent_phone\` VARCHAR(50),
        \`address\` TEXT,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50),
        INDEX idx_nis (\`nis\`),
        INDEX idx_class (\`class_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Questionnaire Types Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`questionnaire_types\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`target_grade\` VARCHAR(20),
        \`scoring_model\` VARCHAR(50) NOT NULL,
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Categories Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`questionnaire_type_id\` VARCHAR(100) NOT NULL,
        \`code\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`weight\` DECIMAL(5,2) DEFAULT 1.0,
        \`order_index\` INT DEFAULT 0,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Questions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`questions\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`questionnaire_type_id\` VARCHAR(100) NOT NULL,
        \`category_id\` VARCHAR(100) NOT NULL,
        \`question_number\` INT NOT NULL,
        \`statement\` TEXT NOT NULL,
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50),
        INDEX idx_type_num (\`questionnaire_type_id\`, \`question_number\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Options Map Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`options_map\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`question_id\` VARCHAR(100) NOT NULL,
        \`option_code\` VARCHAR(10) NOT NULL,
        \`label\` TEXT NOT NULL,
        \`score_weight\` DECIMAL(5,2) DEFAULT 1.0,
        \`career_tag\` VARCHAR(50),
        \`order_index\` INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. Assignments Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`assignments\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`questionnaire_type_id\` VARCHAR(100) NOT NULL,
        \`class_id\` VARCHAR(100) NOT NULL,
        \`is_active\` BOOLEAN DEFAULT TRUE,
        \`assigned_at\` VARCHAR(50),
        \`deadline\` VARCHAR(50),
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Responses Table (Hasil Pengisian Angket Siswa)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`responses\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`questionnaire_type_id\` VARCHAR(100) NOT NULL,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
        \`started_at\` VARCHAR(50),
        \`submitted_at\` VARCHAR(50),
        \`can_reedit\` BOOLEAN DEFAULT FALSE,
        \`total_answered\` INT DEFAULT 0,
        \`initial_career_choice\` VARCHAR(100),
        \`student_notes\` TEXT,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50),
        INDEX idx_student (\`student_id\`),
        INDEX idx_type (\`questionnaire_type_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. Answers Table (Butir Jawaban Siswa)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`answers\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`response_id\` VARCHAR(100) NOT NULL,
        \`question_id\` VARCHAR(100) NOT NULL,
        \`selected_option_code\` VARCHAR(10) NOT NULL,
        \`score_value\` DECIMAL(5,2) DEFAULT 0,
        \`career_tag\` VARCHAR(50),
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50),
        INDEX idx_resp (\`response_id\`),
        INDEX idx_q (\`question_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. Follow-ups Table (Tindak Lanjut BK)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`follow_ups\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`category_id\` VARCHAR(100),
        \`action_type\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`target_date\` VARCHAR(50),
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
        \`notes\` TEXT,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Counseling Notes Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`counseling_notes\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`date\` VARCHAR(50) NOT NULL,
        \`counselor_name\` VARCHAR(255) NOT NULL,
        \`topic\` VARCHAR(255) NOT NULL,
        \`summary\` TEXT NOT NULL,
        \`agreement\` TEXT,
        \`is_confidential\` BOOLEAN DEFAULT TRUE,
        \`created_at\` VARCHAR(50),
        \`updated_at\` VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 17. Audit Logs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`user_id\` VARCHAR(100),
        \`user_name\` VARCHAR(255),
        \`user_role\` VARCHAR(50),
        \`action\` VARCHAR(100) NOT NULL,
        \`entity\` VARCHAR(100) NOT NULL,
        \`details\` TEXT,
        \`timestamp\` VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    conn.release();
    isDbConnected = true;
    lastDbError = '';
    console.log('✅ TiDB Cloud MySQL Schema initialized successfully on `sibks_db`!');
  } catch (err: any) {
    isDbConnected = false;
    lastDbError = err?.message || 'Database connection error';
    console.error('❌ Failed to initialize TiDB Cloud MySQL schema:', err);
  }
}

// --- REST API ENDPOINTS ---

// Health & Status
app.get('/api/mysql/status', async (req, res) => {
  try {
    const p = getPool();
    const conn = await p.getConnection();
    await conn.query('USE `sibks_db`');
    
    // Count stats
    const [rowsStudents]: any = await conn.query('SELECT COUNT(*) as count FROM `students`');
    const [rowsResponses]: any = await conn.query('SELECT COUNT(*) as count FROM `responses`');
    const [rowsAnswers]: any = await conn.query('SELECT COUNT(*) as count FROM `answers`');
    const [rowsUsers]: any = await conn.query('SELECT COUNT(*) as count FROM `users`');
    const [rowsClasses]: any = await conn.query('SELECT COUNT(*) as count FROM `classes`');

    const totalStudents = rowsStudents[0]?.count || 0;
    const totalResponses = rowsResponses[0]?.count || 0;
    const totalAnswers = rowsAnswers[0]?.count || 0;
    const totalUsers = rowsUsers[0]?.count || 0;
    const totalClasses = rowsClasses[0]?.count || 0;

    conn.release();

    res.json({
      connected: true,
      database: 'sibks_db',
      host: MYSQL_CONFIG.host,
      stats: {
        totalStudents,
        totalResponses,
        totalAnswers,
        totalUsers,
        totalClasses,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err?.message || 'Failed to connect to MySQL',
    });
  }
});

// Sync / Pull All from MySQL
app.get('/api/mysql/pull-all', async (req, res) => {
  try {
    const p = getPool();
    const conn = await p.getConnection();
    await conn.query('USE `sibks_db`');

    const [settingsRows]: any = await conn.query('SELECT * FROM `system_settings` LIMIT 1');
    const [users]: any = await conn.query('SELECT * FROM `users`');
    const [students]: any = await conn.query('SELECT * FROM `students`');
    const [classes]: any = await conn.query('SELECT * FROM `classes`');
    const [programs]: any = await conn.query('SELECT * FROM `study_programs`');
    const [academicYears]: any = await conn.query('SELECT * FROM `academic_years`');
    const [teachers]: any = await conn.query('SELECT * FROM `teachers`');
    const [questionnaireTypes]: any = await conn.query('SELECT * FROM `questionnaire_types`');
    const [categories]: any = await conn.query('SELECT * FROM `categories`');
    const [questions]: any = await conn.query('SELECT * FROM `questions`');
    const [options]: any = await conn.query('SELECT * FROM `options_map`');
    const [assignments]: any = await conn.query('SELECT * FROM `assignments`');
    const [responses]: any = await conn.query('SELECT * FROM `responses`');
    const [answers]: any = await conn.query('SELECT * FROM `answers`');
    const [followUps]: any = await conn.query('SELECT * FROM `follow_ups`');
    const [counselingNotes]: any = await conn.query('SELECT * FROM `counseling_notes`');
    const [auditLogs]: any = await conn.query('SELECT * FROM `audit_logs`');

    conn.release();

    const settings = settingsRows.length > 0 ? (typeof settingsRows[0].data === 'string' ? JSON.parse(settingsRows[0].data) : settingsRows[0].data) : null;

    // Build options map
    const optionsMap: Record<string, any[]> = {};
    options.forEach((opt: any) => {
      if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = [];
      optionsMap[opt.question_id].push(opt);
    });

    res.json({
      success: true,
      data: {
        settings,
        users,
        students,
        classes,
        programs,
        academicYears,
        teachers,
        questionnaireTypes,
        categories,
        questions,
        optionsMap,
        assignments,
        responses,
        answers,
        followUps,
        counselingNotes,
        auditLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to pull data from MySQL',
    });
  }
});

// Push Full Dataset to MySQL
app.post('/api/mysql/push-all', async (req, res) => {
  try {
    const {
      settings,
      users,
      students,
      classes,
      programs,
      academicYears,
      teachers,
      questionnaireTypes,
      categories,
      questions,
      optionsMap,
      assignments,
      responses,
      answers,
      followUps,
      counselingNotes,
      auditLogs,
    } = req.body;

    const p = getPool();
    const conn = await p.getConnection();
    await conn.query('USE `sibks_db`');

    // 1. Settings
    if (settings) {
      await conn.query(
        'REPLACE INTO `system_settings` (`id`, `data`) VALUES (?, ?)',
        ['main', JSON.stringify(settings)]
      );
    }

    // Helper for batch REPLACE INTO
    const batchReplace = async (tableName: string, items: any[]) => {
      if (!items || items.length === 0) return;
      const CHUNK = 200;
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const keys = Object.keys(chunk[0]);
        const placeholders = chunk.map(() => `(${keys.map(() => '?').join(',')})`).join(',');
        const values: any[] = [];
        chunk.forEach((row) => {
          keys.forEach((k) => values.push(row[k] !== undefined ? row[k] : null));
        });
        const sql = `REPLACE INTO \`${tableName}\` (${keys.map((k) => `\`${k}\``).join(',')}) VALUES ${placeholders}`;
        await conn.query(sql, values);
      }
    };

    if (users && users.length) await batchReplace('users', users);
    if (teachers && teachers.length) await batchReplace('teachers', teachers);
    if (academicYears && academicYears.length) await batchReplace('academic_years', academicYears);
    if (programs && programs.length) await batchReplace('study_programs', programs);
    if (classes && classes.length) await batchReplace('classes', classes);
    if (students && students.length) await batchReplace('students', students);
    if (questionnaireTypes && questionnaireTypes.length) await batchReplace('questionnaire_types', questionnaireTypes);
    if (categories && categories.length) await batchReplace('categories', categories);
    if (questions && questions.length) await batchReplace('questions', questions);
    if (assignments && assignments.length) await batchReplace('assignments', assignments);
    if (responses && responses.length) await batchReplace('responses', responses);
    if (answers && answers.length) await batchReplace('answers', answers);
    if (followUps && followUps.length) await batchReplace('follow_ups', followUps);
    if (counselingNotes && counselingNotes.length) await batchReplace('counseling_notes', counselingNotes);
    if (auditLogs && auditLogs.length) await batchReplace('audit_logs', auditLogs);

    if (optionsMap) {
      const allOpts: any[] = [];
      Object.entries(optionsMap).forEach(([qId, opts]: [string, any]) => {
        if (Array.isArray(opts)) {
          opts.forEach((o) => {
            allOpts.push({
              id: o.id || `${qId}-${o.option_code}`,
              question_id: qId,
              option_code: o.option_code,
              label: o.label,
              score_weight: o.score_weight || 1,
              career_tag: o.career_tag || null,
              order_index: o.order_index || 0,
            });
          });
        }
      });
      if (allOpts.length > 0) {
        await batchReplace('options_map', allOpts);
      }
    }

    conn.release();

    res.json({
      success: true,
      message: 'Seluruh data berhasil disinkronkan ke TiDB Cloud MySQL!',
    });
  } catch (err: any) {
    console.error('Push all error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Gagal menyimpan ke MySQL',
    });
  }
});

// Real-time Save Single Response & Answers
app.post('/api/mysql/response', async (req, res) => {
  try {
    const { response, answers } = req.body;
    if (!response) {
      return res.status(400).json({ success: false, error: 'Response data required' });
    }

    const p = getPool();
    const conn = await p.getConnection();
    await conn.query('USE `sibks_db`');

    // Save response
    await conn.query(
      `REPLACE INTO \`responses\` (
        \`id\`, \`questionnaire_type_id\`, \`student_id\`, \`status\`, \`started_at\`, \`submitted_at\`,
        \`can_reedit\`, \`total_answered\`, \`initial_career_choice\`, \`student_notes\`, \`created_at\`, \`updated_at\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        response.id,
        response.questionnaire_type_id,
        response.student_id,
        response.status || 'SUBMITTED',
        response.started_at || null,
        response.submitted_at || null,
        response.can_reedit ? 1 : 0,
        response.total_answered || 0,
        response.initial_career_choice || null,
        response.student_notes || null,
        response.created_at || new Date().toISOString(),
        response.updated_at || new Date().toISOString(),
      ]
    );

    // Save answers
    if (answers && answers.length > 0) {
      const keys = ['id', 'response_id', 'question_id', 'selected_option_code', 'score_value', 'career_tag', 'created_at', 'updated_at'];
      const placeholders = answers.map(() => `(${keys.map(() => '?').join(',')})`).join(',');
      const values: any[] = [];
      answers.forEach((a: any) => {
        values.push(
          a.id,
          a.response_id,
          a.question_id,
          a.selected_option_code,
          a.score_value || 0,
          a.career_tag || null,
          a.created_at || new Date().toISOString(),
          a.updated_at || new Date().toISOString()
        );
      });
      await conn.query(
        `REPLACE INTO \`answers\` (${keys.map((k) => `\`${k}\``).join(',')}) VALUES ${placeholders}`,
        values
      );
    }

    conn.release();

    res.json({ success: true, message: 'Response saved to TiDB MySQL successfully' });
  } catch (err: any) {
    console.error('Save response error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to save response' });
  }
});

// Vite & Static file handler
async function startServer() {
  await initMySqlSchema();

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SIBKS Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('Failed to start server:', e);
});
