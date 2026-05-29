import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\user\\.gemini\\antigravity\\brain\\3cabbb31-10e6-4cc5-82bb-498bbaed0308\\.system_generated\\logs\\overview.txt', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('00_init_database') || line.includes('sql') || line.includes('SQL') || line.includes('db_')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
