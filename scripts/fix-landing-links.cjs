const fs = require('fs');
const path = require('path');

const filesToFix = ['cities.html', 'index.html', 'about.html', 'services.html', 'latest-works.html', 'contact.html', 'request.html'];

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace schema url: "https://designquixo.in/landing.html?city=([a-z0-9-]+)"
    content = content.replace(/https:\/\/designquixo\.in\/landing\.html\?city=([a-z0-9-]+)/g, 'https://designquixo.in/graphic-designer-in-$1.html');
    
    // Replace href="landing.html?city=([a-z0-9-]+)"
    content = content.replace(/href="landing\.html\?city=([a-z0-9-]+)"/g, 'href="graphic-designer-in-$1.html"');

    // Replace href='landing.html?city=([a-z0-9-]+)'
    content = content.replace(/href='landing\.html\?city=([a-z0-9-]+)'/g, "href='graphic-designer-in-$1.html'");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated links in ${file}`);
  }
}
