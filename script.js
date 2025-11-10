// Configuration
const CONFIG = {
    backendUrl: 'http://localhost:3000/api', // Backend proxy URL
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    pollInterval: 2000, // Check status setiap 2 detik
    maxPollAttempts: 60 // Maksimal 2 menit
};

// Anime generation prompt template optimized for Animagine XL V4
const ANIME_PROMPT_TEMPLATE = `
A beautiful anime waifu version of the attached person, extract dominant colors from reference: hair, eyes, clothing -- keep facial features accurate, cute anime girl, detailed eyes, soft blush, flowing hair, masterpiece, anime key visual, by Makoto Shinkai --ar 2:3 --v 5
`;

// Global state
let uploadedImage = null;
let extractedColors = [];
let currentPredictionId = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const generateSection = document.getElementById('generateSection');
const generateBtn = document.getElementById('generateBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const colorsDisplay = document.getElementById('colorsDisplay');
const changeImageBtn = document.getElementById('changeImageBtn');
const downloadBtn = document.getElementById('downloadBtn');
const generateAgainBtn = document.getElementById('generateAgainBtn');

// Event Listeners
uploadBox.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
changeImageBtn.addEventListener('click', () => fileInput.click());
generateBtn.addEventListener('click', handleGenerate);
downloadBtn.addEventListener('click', handleDownload);
generateAgainBtn.addEventListener('click', resetToUpload);

// Drag and drop functionality
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#FF6B9D';
    uploadBox.style.transform = 'translateY(-5px)';
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '';
    uploadBox.style.transform = '';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '';
    uploadBox.style.transform = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validasi format file
    if (!CONFIG.allowedFormats.includes(file.type)) {
        alert('Format file tidak didukung! Gunakan PNG, JPG, atau WEBP.');
        return;
    }
    
    // Validasi ukuran file
    if (file.size > CONFIG.maxFileSize) {
        alert('Ukuran file terlalu besar! Maksimal 10MB.');
        return;
    }
    
    // Baca dan preview file
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        previewImage.src = uploadedImage;
        originalImage.src = uploadedImage;
        
        // Extract colors dari gambar
        extractColorsFromImage(uploadedImage);
        
        // Show preview dan hide upload
        uploadSection.classList.remove('hidden');
        previewSection.classList.remove('hidden');
        generateSection.classList.remove('hidden');
        uploadBox.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Color extraction menggunakan Canvas API
function extractColorsFromImage(imageSrc) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize untuk performa lebih baik
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Extract colors
        const colorMap = {};
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Quantize colors (group similar colors)
            const quantizedR = Math.round(r / 32) * 32;
            const quantizedG = Math.round(g / 32) * 32;
            const quantizedB = Math.round(b / 32) * 32;
            
            const key = `${quantizedR},${quantizedG},${quantizedB}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
        }
        
        // Sort by frequency dan ambil top 5
        const sortedColors = Object.entries(colorMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([rgb, count]) => {
                const [r, g, b] = rgb.split(',').map(Number);
                return { r, g, b, count };
            });
        
        extractedColors = sortedColors;
        displayColors(sortedColors);
    };
    img.src = imageSrc;
}

// Display extracted colors
function displayColors(colors) {
    colorsDisplay.innerHTML = '';
    
    colors.forEach((color, index) => {
        const hex = rgbToHex(color.r, color.g, color.b);
        const colorName = getColorName(color.r, color.g, color.b);
        
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        colorItem.innerHTML = `
            <div class="color-box" style="background-color: ${hex};"></div>
            <div class="color-info">
                <div class="color-name">${colorName}</div>
                <div class="color-hex">${hex}</div>
            </div>
        `;
        colorsDisplay.appendChild(colorItem);
    });
}

// Helper: RGB to Hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Helper: Get color name
function getColorName(r, g, b) {
    const hsl = rgbToHsl(r, g, b);
    const h = hsl.h;
    const s = hsl.s;
    const l = hsl.l;
    
    if (s < 10) {
        if (l < 20) return 'Black';
        if (l < 40) return 'Dark Gray';
        if (l < 60) return 'Gray';
        if (l < 80) return 'Light Gray';
        return 'White';
    }
    
    if (h < 15) return 'Red';
    if (h < 45) return 'Orange';
    if (h < 75) return 'Yellow';
    if (h < 165) return 'Green';
    if (h < 255) return 'Blue';
    if (h < 285) return 'Purple';
    if (h < 330) return 'Pink';
    return 'Red';
}

// Helper: RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Check backend health
async function checkBackendHealth() {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/health`);
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
}

// Generate anime art
async function handleGenerate() {
    if (!uploadedImage || extractedColors.length === 0) {
        alert('Silakan upload gambar terlebih dahulu!');
        return;
    }
    
    // Check backend health
    const health = await checkBackendHealth();
    if (!health) {
        alert('⚠️ Backend server tidak berjalan!\n\nJalankan server dengan:\nnpm start\n\nAtau:\nnode server.js');
        return;
    }
    
    if (!health.configured) {
        alert('⚠️ API Token belum dikonfigurasi!\n\nBuat file .env dengan:\nREPLICATE_API_TOKEN=your_token_here\n\nLalu restart server.');
        return;
    }
    
    // Hide previous sections
    generateSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    // Show loading
    loadingSection.classList.remove('hidden');
    
    try {
        // Create prompt dengan colors
        const colorStrings = extractedColors.map(c => rgbToHex(c.r, c.g, c.b)).join(', ');
        const mainColor = rgbToHex(extractedColors[0].r, extractedColors[0].g, extractedColors[0].b);
        
        const prompt = ANIME_PROMPT_TEMPLATE
            .replace('{colors}', colorStrings)
            .replace('{mainColor}', mainColor);
        
        console.log('🎨 Generated prompt:', prompt);
        
        // Call API untuk generate
        const result = await generateAnimeWithBackend(prompt);
        
        // Show result
        if (result && result.output) {
            const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            resultImage.src = imageUrl;
            loadingSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            console.log('✅ Generation successful!');
        } else {
            throw new Error('No output from API');
        }
        
    } catch (error) {
        console.error('❌ Generation error:', error);
        let errorMessage = 'Terjadi kesalahan saat membuat gambar.';
        
        if (error.message.includes('Backend')) {
            errorMessage = '⚠️ Backend server error!\n\nPastikan server berjalan dengan: npm start';
        } else if (error.message.includes('401')) {
            errorMessage = '⚠️ API Token tidak valid!\n\nPeriksa token di file .env';
        } else if (error.message.includes('402')) {
            errorMessage = '⚠️ Kredit Replicate habis!\n\nSilakan top-up di Replicate.com';
        }
        
        alert(errorMessage);
        loadingSection.classList.add('hidden');
        generateSection.classList.remove('hidden');
    }
}

// API Integration melalui backend proxy
async function generateAnimeWithBackend(prompt) {
    console.log('📡 Calling backend proxy...');
    
    try {
        // Step 1: Create prediction via backend
        const createResponse = await fetch(`${CONFIG.backendUrl}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(errorData.message || 'Backend error');
        }
        
        const prediction = await createResponse.json();
        currentPredictionId = prediction.id;
        
        console.log('⏳ Prediction created:', prediction.id);
        console.log('⏳ Waiting for result...');
        
        // Step 2: Poll for result
        return await pollBackendForResult(prediction.id);
        
    } catch (error) {
        console.error('❌ Backend Error:', error);
        throw error;
    }
}

// Poll backend untuk mendapatkan hasil
async function pollBackendForResult(predictionId) {
    let attempts = 0;
    
    while (attempts < CONFIG.maxPollAttempts) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.pollInterval));
        
        try {
            const response = await fetch(`${CONFIG.backendUrl}/status/${predictionId}`);
            
            if (!response.ok) {
                throw new Error(`Backend error: ${response.status}`);
            }
            
            const prediction = await response.json();
            
            console.log(`⏳ Status check ${attempts + 1}/${CONFIG.maxPollAttempts}: ${prediction.status}`);
            
            if (prediction.status === 'succeeded') {
                console.log('✅ Generation completed!');
                return prediction;
            }
            
            if (prediction.status === 'failed') {
                throw new Error(prediction.error || 'Prediction failed');
            }
            
            if (prediction.status === 'canceled') {
                throw new Error('Prediction was canceled');
            }
            
            attempts++;
            
        } catch (error) {
            console.error('❌ Poll error:', error);
            throw error;
        }
    }
    
    throw new Error('Timeout: Generation took too long (over 2 minutes)');
}

// Download result
function handleDownload() {
    const link = document.createElement('a');
    link.download = `anime-art-${Date.now()}.png`;
    link.href = resultImage.src;
    link.click();
}

// Reset to upload state
function resetToUpload() {
    uploadedImage = null;
    extractedColors = [];
    currentPredictionId = null;
    
    uploadBox.style.display = 'block';
    previewSection.classList.add('hidden');
    generateSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    fileInput.value = '';
}

// Initialize
async function init() {
    console.log('🎨 Anime AI Generator initialized');
    console.log('📡 Backend proxy mode');
    
    const health = await checkBackendHealth();
    
    if (!health) {
        console.warn('⚠️  Backend server not running!');
        console.log('📝 Start server with: npm start');
    } else {
        console.log('✅ Backend server connected');
        if (health.configured) {
            console.log('✅ API Token configured');
            console.log('🚀 Ready to generate anime art!');
        } else {
            console.warn('⚠️  API Token not configured');
            console.log('📝 Create .env file with: REPLICATE_API_TOKEN=your_token_here');
        }
    }
}

init();