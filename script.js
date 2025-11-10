// Configuration
const CONFIG = {
    // Backend proxy server (untuk bypass CORS)
    apiEndpoint: 'http://localhost:3000/api',
    
    // Legacy config (tidak dipakai lagi karena pakai backend proxy)
    replicateToken: 'YOUR_REPLICATE_API_TOKEN_HERE',
    modelVersion: 'cfd0f86fbcd03df45fca7ce83af9bb9c07850a3317303fe8dcf677038541db8a',
    
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    pollInterval: 2000, // Check status setiap 2 detik
    maxPollAttempts: 60 // Maksimal 2 menit
};

// Anime generation prompt template optimized for Animagine XL V4
const ANIME_PROMPT_TEMPLATE = `
1girl, solo, beautiful detailed anime girl, 
expressive large eyes, detailed face, beautiful detailed hair,
elegant feminine pose, graceful, 
detailed clothing, intricate outfit design,
soft lighting, vibrant colors matching palette: {colors},
dominant color scheme: {mainColor},
full body, standing,
masterpiece, best quality, highly detailed, ultra detailed,
4k, high resolution, perfect anatomy,
modern anime style, professional illustration,
detailed background, depth of field
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

// Generate anime art
async function handleGenerate() {
    if (!uploadedImage || extractedColors.length === 0) {
        alert('Silakan upload gambar terlebih dahulu!');
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
        
        // Call API untuk generate
        const result = await generateAnimeWithAPI(uploadedImage, prompt);
        
        // Show result
        if (result && result.output) {
            resultImage.src = Array.isArray(result.output) ? result.output[0] : result.output;
            loadingSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
        } else {
            throw new Error('Failed to generate image');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        alert('Terjadi kesalahan saat membuat gambar. Silakan coba lagi!');
        loadingSection.classList.add('hidden');
        generateSection.classList.remove('hidden');
    }
}

// API Integration untuk generate anime menggunakan Backend Proxy
async function generateAnimeWithAPI(imageData, prompt) {
    try {
        console.log('Sending request to backend proxy...');
        
        // Step 1: Create prediction via backend proxy
        const response = await fetch(`${CONFIG.apiEndpoint}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                negativePrompt: 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, ugly, duplicate, morbid, mutilated, extra limbs, deformed, disfigured'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend proxy error: ${response.status} - ${errorText}`);
        }

        const prediction = await response.json();
        currentPredictionId = prediction.id;
        
        console.log('Prediction created:', prediction.id);

        // Step 2: Poll for result via backend proxy
        return await pollForResult(prediction.id);

    } catch (error) {
        console.error('API Error:', error);
        
        // Check jika backend server tidak running
        if (error.message.includes('Failed to fetch')) {
            alert('⚠️ Backend server tidak terdeteksi!\n\nJalankan server dulu dengan: npm start\n\nLihat README.md untuk instruksi lengkap.');
            throw new Error('Backend server is not running. Please start the server with: npm start');
        }
        
        // Fallback: Return demo result
        console.log('Falling back to demo mode...');
        return await createDemoResult(imageData);
    }
}

// Poll API untuk mendapatkan hasil via backend proxy
async function pollForResult(predictionId) {
    let attempts = 0;
    
    while (attempts < CONFIG.maxPollAttempts) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.pollInterval));
        
        const response = await fetch(`${CONFIG.apiEndpoint}/prediction/${predictionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Poll error: ${response.status}`);
        }
        
        const prediction = await response.json();
        
        console.log(`Polling attempt ${attempts + 1}: ${prediction.status}`);
        
        if (prediction.status === 'succeeded') {
            console.log('Generation completed!');
            return prediction;
        }
        
        if (prediction.status === 'failed') {
            throw new Error('Prediction failed: ' + (prediction.error || 'Unknown error'));
        }
        
        attempts++;
    }
    
    throw new Error('Timeout waiting for result');
}

// Demo result (fallback ketika API tidak tersedia)
async function createDemoResult(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Apply anime-style filter effect (simplified)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Increase saturation and contrast
            for (let i = 0; i < data.length; i += 4) {
                // Increase contrast
                data[i] = Math.min(255, data[i] * 1.2);     // R
                data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
                data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Add text overlay
            ctx.fillStyle = 'rgba(255, 107, 157, 0.1)';
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
            ctx.fillStyle = '#FF6B9D';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('DEMO MODE - Configure API for real AI generation', canvas.width / 2, canvas.height - 25);
            
            resolve({
                output: canvas.toDataURL('image/png')
            });
        };
        img.src = imageData;
    });
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
console.log('%c🎨 Anime AI Generator initialized', 'color: #FF6B9D; font-size: 16px; font-weight: bold');
console.log('%c📡 Backend proxy mode enabled', 'color: #C371F5; font-size: 14px');
console.log('%cℹ️  Make sure to run: npm start', 'color: #667eea; font-size: 12px');
console.log('%cℹ️  Configure API token in server.js', 'color: #667eea; font-size: 12px');