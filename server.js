const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    console.log(`[${req.method}] ${req.url}`);

    // Handle root URL
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query strings
    filePath = filePath.split('?')[0];

    // Block access to dotfiles and sensitive config files (.env, .git)
    if (filePath.includes('/.') || filePath.endsWith('.env')) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 Forbidden: Access Denied</h1>', 'utf-8');
        return;
    }

    // Map to local file system
    const absolutePath = path.join(__dirname, filePath);

    // Get file extension
    const extname = String(path.extname(absolutePath)).toLowerCase();
    
    // Set content type
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // Read file
    fs.readFile(absolutePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 Server running at http://localhost:${PORT}/`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log('====================================');
    console.log('Press Ctrl+C to stop');
});
