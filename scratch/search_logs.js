const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\Mohamed\\.gemini\\antigravity-ide\\brain\\755f1fd8-bc53-4d81-be9a-d6416ba03c31\\.system_generated\\logs\\transcript.jsonl';

async function search() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('Searching for Analytics Responses in log transcript...');
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.includes('Analytics Response') || line.includes('analytics/revenue') || line.includes('analytics/orders')) {
      console.log(`Line ${lineCount}: ${line.substring(0, 1500)}...`);
    }
  }
  console.log('Search finished.');
}

search().catch(err => console.error(err));

