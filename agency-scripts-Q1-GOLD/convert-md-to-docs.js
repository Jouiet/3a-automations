const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const htmlPdf = require('html-pdf-node');
const officegen = require('officegen');

const INPUT_FILE = path.join(__dirname, '../docs/CHARLENE_AI_ASSISTANT_KNOWLEDGE_BASE.md');
const PDF_OUTPUT = path.join(__dirname, '../docs/CHARLENE_AI_ASSISTANT_KNOWLEDGE_BASE.pdf');
const DOCX_OUTPUT = path.join(__dirname, '../docs/CHARLENE_AI_ASSISTANT_KNOWLEDGE_BASE.docx');

console.log('\n📚 CONVERTING CHARLENE KNOWLEDGE BASE TO PDF & DOCX');
console.log('='.repeat(80));

// Read markdown file
const markdown = fs.readFileSync(INPUT_FILE, 'utf-8');

console.log(`\n📄 Input: ${INPUT_FILE}`);
console.log(`   Size: ${(fs.statSync(INPUT_FILE).size / 1024).toFixed(1)} KB`);

// ====================
// CREATE PDF
// ====================
async function createPDF() {
  console.log('\n📄 Creating PDF...');

  // Convert markdown to HTML
  const htmlContent = marked(markdown);

  // Create styled HTML document
  const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #000;
      font-size: 24px;
      font-weight: bold;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    h2 {
      color: #222;
      font-size: 18px;
      font-weight: bold;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    h3 {
      color: #444;
      font-size: 14px;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p {
      margin-bottom: 10px;
      text-align: justify;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 5px;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    pre {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      font-size: 12px;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    blockquote {
      border-left: 4px solid #ccc;
      margin-left: 0;
      padding-left: 15px;
      color: #666;
      font-style: italic;
    }
    .title-page {
      text-align: center;
      margin-top: 100px;
      margin-bottom: 100px;
    }
    .title-page h1 {
      font-size: 36px;
      border-bottom: none;
      margin-bottom: 20px;
    }
    .title-page p {
      font-size: 18px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>CHARLENE</h1>
    <h1>HENDERSON SHOP</h1>
    <h1>AI CUSTOMER SERVICE ASSISTANT</h1>
    <p>Complete Knowledge Base & Training Manual</p>
    <p style="margin-top: 50px; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div style="page-break-after: always;"></div>
  ${htmlContent}
</body>
</html>
  `;

  // PDF options
  const options = {
    format: 'Letter',
    margin: {
      top: '0.75in',
      right: '0.75in',
      bottom: '0.75in',
      left: '0.75in'
    },
    printBackground: true
  };

  const file = { content: styledHTML };

  try {
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    fs.writeFileSync(PDF_OUTPUT, pdfBuffer);

    const pdfSize = (fs.statSync(PDF_OUTPUT).size / 1024).toFixed(1);
    console.log(`✅ PDF created: ${pdfSize} KB`);
    console.log(`   Location: ${PDF_OUTPUT}`);
  } catch (error) {
    console.error(`❌ PDF creation failed: ${error.message}`);
  }
}

// ====================
// CREATE DOCX
// ====================
function createDOCX() {
  console.log('\n📄 Creating DOCX...');

  return new Promise((resolve, reject) => {
    const docx = officegen('docx');

    // Error handling
    docx.on('error', (err) => {
      console.error(`❌ DOCX creation failed: ${err}`);
      reject(err);
    });

    // Title page
    let para = docx.createP({ align: 'center' });
    para.addText('CHARLENE - HENDERSON SHOP', {
      font_size: 28,
      bold: true,
      font_face: 'Arial'
    });
    para.addLineBreak();
    para.addLineBreak();

    para = docx.createP({ align: 'center' });
    para.addText('AI CUSTOMER SERVICE ASSISTANT', {
      font_size: 24,
      bold: true,
      font_face: 'Arial'
    });
    para.addLineBreak();
    para.addLineBreak();

    para = docx.createP({ align: 'center' });
    para.addText('Complete Knowledge Base & Training Manual', {
      font_size: 14,
      color: '666666',
      font_face: 'Arial'
    });

    // Page break
    docx.putPageBreak();

    // Parse markdown and add to docx
    const lines = markdown.split('\n');
    let currentList = null;

    for (let line of lines) {
      // Skip empty lines in title
      if (!line.trim()) {
        if (currentList) {
          currentList = null;
        }
        continue;
      }

      // H1 Headers
      if (line.startsWith('# ')) {
        para = docx.createP();
        para.addText(line.substring(2), {
          font_size: 18,
          bold: true,
          font_face: 'Arial'
        });
        para.addLineBreak();
        continue;
      }

      // H2 Headers
      if (line.startsWith('## ')) {
        para = docx.createP();
        para.addText(line.substring(3), {
          font_size: 14,
          bold: true,
          font_face: 'Arial'
        });
        continue;
      }

      // H3 Headers
      if (line.startsWith('### ')) {
        para = docx.createP();
        para.addText(line.substring(4), {
          font_size: 12,
          bold: true,
          font_face: 'Arial'
        });
        continue;
      }

      // Lists
      if (line.match(/^[-*+]\s+/) || line.match(/^\d+\.\s+/)) {
        const text = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
        para = docx.createP();
        para.addText('• ' + text, {
          font_size: 10,
          font_face: 'Arial'
        });
        currentList = true;
        continue;
      }

      // Code blocks
      if (line.startsWith('```')) {
        continue;
      }

      // Regular paragraphs
      para = docx.createP();
      const cleanLine = line.replace(/\*\*/g, '');
      para.addText(cleanLine, {
        font_size: 10,
        font_face: 'Arial'
      });
    }

    // Generate docx file
    const out = fs.createWriteStream(DOCX_OUTPUT);

    out.on('finish', () => {
      const docxSize = (fs.statSync(DOCX_OUTPUT).size / 1024).toFixed(1);
      console.log(`✅ DOCX created: ${docxSize} KB`);
      console.log(`   Location: ${DOCX_OUTPUT}`);
      resolve();
    });

    out.on('error', (err) => {
      console.error(`❌ DOCX write failed: ${err}`);
      reject(err);
    });

    docx.generate(out);
  });
}

// ====================
// MAIN EXECUTION
// ====================
async function main() {
  try {
    // Create both formats
    await createPDF();
    await createDOCX();

    console.log('\n' + '='.repeat(80));
    console.log('✅ CONVERSION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📁 Output files:');
    console.log(`   • PDF:  ${PDF_OUTPUT}`);
    console.log(`   • DOCX: ${DOCX_OUTPUT}`);
    console.log('\n💡 Both files ready for distribution!\n');
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    process.exit(1);
  }
}

main();
