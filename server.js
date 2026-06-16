const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// MODIFIED FOR CLOUD DEPLOYMENT: Dynamic port allocation handled automatically
const PORT = process.env.PORT || 5500;

// ========================================================
// DIRECTORY MANIPULATION & PHYSICAL FILE DATABASE HOOKS
// ========================================================

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Database file setup link on disk
const dbFilePath = path.join(__dirname, 'data.json');

// Reusable core helper function to load data safely from data.json
function loadDatabase() {
    const defaultData = {
        projects: [{ id: 1, title: 'Project 1: Sample only', desc: '<p>Initial rolling infrastructure layout configurations.</p>', itemDate: '2026-06-16', videoPath: '' }],
        news: [], blogs: [], events: [], careers: [], awards: []
    };

    try {
        if (!fs.existsSync(dbFilePath)) {
            // Write physical file if it doesn't exist yet
            fs.writeFileSync(dbFilePath, JSON.stringify(defaultData, null, 4), 'utf8');
            return defaultData;
        }
        const fileContent = fs.readFileSync(dbFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.log("[ERROR] Failed reading local file database. Using temporary defaults.");
        return defaultData;
    }
}

// Reusable core helper function to save your data permanently to disk
function saveDatabase(data) {
    try {
        fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
        console.error("[ERROR] Physical disk write failure. Progress wasn't saved.");
    }
}

// Initialize working state memory tracking loop directly from database file
let websiteData = loadDatabase();

// Configure Disk Storage Engine to stream heavy files straight to your uploads folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 1500 * 1024 * 1024, // 1.5GB limit for standalone video uploads
        fieldSize: 100 * 1024 * 1024  // 100MB limit for text fields containing embedded base64 data strings
    } 
});

// ========================================================
// SECURITY & PAYLOAD PARSING MIDDLEWARE
// ========================================================

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(session({
    secret: 'super-secret-admin-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/admin-login');
}

app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// AUTHENTICATION CHANNELS
// ========================================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password123') {
        req.session.isAdmin = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Unauthorized verification failure' });
});

app.get('/admin-logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin-login');
});

// ========================================================
// DYNAMIC DATA MANAGEMENT API CHANNELS
// ========================================================

// Reload fresh content from disk on load
app.get('/api/content', (req, res) => {
    websiteData = loadDatabase();
    res.json(websiteData);
});

app.post('/api/content/:category', requireAdmin, upload.single('heavyVideo'), (req, res) => {
    const { category } = req.params;
    if (!req.body) req.body = {};

    const { id, title, desc, itemDate } = req.body;
    
    if (!title || !desc) {
        return res.status(400).json({ success: false, error: 'Required text fields are missing.' });
    }

    // Refresh database baseline map structure before push modifications
    websiteData = loadDatabase();

    if (!websiteData[category]) {
        return res.status(400).json({ success: false, error: 'Invalid data category mapping token.' });
    }

    let videoPath = '';
    if (req.file) {
        videoPath = '/uploads/' + req.file.filename;
    }

    // EDIT MODE
    if (id && id.trim() !== '') {
        const itemIndex = websiteData[category].findIndex(item => item.id === parseInt(id));
        if (itemIndex !== -1) {
            websiteData[category][itemIndex].title = title;
            websiteData[category][itemIndex].desc = desc;
            websiteData[category][itemIndex].itemDate = itemDate || '';
            if (req.file) {
                websiteData[category][itemIndex].videoPath = videoPath;
            }
            // Commit changes to physical file
            saveDatabase(websiteData);
            return res.json({ success: true, item: websiteData[category][itemIndex] });
        }
    }

    // ADD MODE
    const newItem = { 
        id: Date.now(), 
        title, 
        desc, 
        itemDate: itemDate || '',
        videoPath: videoPath 
    };
    
    websiteData[category].push(newItem);
    
    // Commit changes to physical file permanently
    saveDatabase(websiteData);
    
    res.json({ success: true, item: newItem });
});

app.delete('/api/content/:category/:id', requireAdmin, (req, res) => {
    const { category, id } = req.params;
    
    websiteData = loadDatabase();
    
    if (websiteData[category]) {
        websiteData[category] = websiteData[category].filter(item => item.id !== parseInt(id));
        
        // Save database status post removal
        saveDatabase(websiteData);
        return res.json({ success: true });
    }
    res.status(400).json({ error: 'Invalid selection parameters.' });
});

// ========================================================
// ROUTE VIEWS & RE-ROUTING GATEWAYS
// ========================================================

app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin-login.html')));
app.get('/admin-dashboard', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'public/admin-dashboard.html')));
app.get(/.*$/, (req, res) => res.sendFile(path.join(__dirname, 'public/webpage.html')));

// MODIFIED FOR CLOUD DEPLOYMENT: Listens dynamically to assigned variable allocations
app.listen(PORT, () => console.log(`\n==================================================\n[SUCCESS] Node Server Engine initialized flawlessly.\n[PERSISTENCE] JSON Local Database Active.\n[PORT] Running on system distribution track: ${PORT}\n==================================================`));