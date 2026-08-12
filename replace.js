const fs = require('fs');
const path = require('path');

const directory = __dirname;
const directoriesToSearch = ['src', 'app.json', 'package.json'];
const excludeFiles = ['package-lock.json'];

function walkAndReplace(dir) {
    if (excludeFiles.includes(path.basename(dir))) return;
    
    if (fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            walkAndReplace(path.join(dir, file));
        }
    } else {
        if (!dir.match(/\.(ts|tsx|js|jsx|json)$/)) return;
        
        const content = fs.readFileSync(dir, 'utf8');
        let newContent = content.replace(/Walletly/g, 'Cbudget');
        newContent = newContent.replace(/walletly/g, 'cbudget');
        newContent = newContent.replace(/WALLETLY/g, 'CBUDGET');
        
        if (content !== newContent) {
            fs.writeFileSync(dir, newContent, 'utf8');
            console.log(`Replaced in ${dir}`);
        }
    }
}

for (const p of directoriesToSearch) {
    const fullPath = path.join(directory, p);
    if (fs.existsSync(fullPath)) {
        walkAndReplace(fullPath);
    }
}
