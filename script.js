class QRCodeGenerator {
    constructor() {
      this.initializeElements();
      this.setupEventListeners();
      this.loadHistory();
      this.isGenerating = false;
    }
  
    initializeElements() {
      // Form elements
      this.contentInput = document.getElementById('content');
      this.sizeInput = document.getElementById('size');
      this.sizeValue = document.querySelector('.size-value');
      this.foregroundColor = document.getElementById('foreground');
      this.backgroundColor = document.getElementById('background');
      this.formatSelect = document.getElementById('format');
      this.generateBtn = document.querySelector('.generate-btn');
  
      // Result elements
      this.qrCode = document.querySelector('.qr-code');
      this.qrImage = this.qrCode.querySelector('img');
      this.downloadBtn = document.querySelector('.download-btn');
      this.shareBtn = document.querySelector('.share-btn');
  
      // Tab elements
      this.tabBtns = document.querySelectorAll('.tab-btn');
      this.tabContents = document.querySelectorAll('.tab-content');
      this.historyList = document.querySelector('.history-list');
    }
  
    setupEventListeners() {
      // Generate button click
      this.generateBtn.addEventListener('click', () => this.generateQRCode());
  
      // Enter keypress for generating QR code
      this.contentInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.generateQRCode();
      });
  
      // Size input listener for updating the QR size value text
      this.sizeInput.addEventListener('input', () => {
        this.sizeValue.textContent = `${this.sizeInput.value} x ${this.sizeInput.value}`;
      });
  
      // Download button
      this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
  
      // Share button
      this.shareBtn.addEventListener('click', () => this.shareQRCode());
  
      // Tab switching
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => this.switchTab(btn));
      });
    }
  
    async generateQRCode() {
      const content = this.contentInput.value.trim();
      if (!content || this.isGenerating) return;
  
      try {
        this.isGenerating = true;
        this.generateBtn.textContent = 'Generating...';
        this.generateBtn.classList.add('loading');
  
        // Get the size value from the size input
        const size = parseInt(this.sizeInput.value); // Size from the slider
  
        const options = {
          width: size, // Set the QR code size
          margin: 1,
          color: {
            dark: this.foregroundColor.value,
            light: this.backgroundColor.value
          }
        };
  
        let url;
        if (this.formatSelect.value === 'svg') {
          url = 'data:image/svg+xml;base64,' + btoa(await QRCode.toString(content, {
            ...options,
            type: 'svg'
          }));
        } else {
          url = await QRCode.toDataURL(content, options);
        }
  
        this.qrImage.src = url;
        this.qrCode.classList.add('show');
        this.downloadBtn.disabled = false;
        this.shareBtn.disabled = false;
  
        // Save the QR code to history
        this.saveToHistory({
          content,
          url,
          timestamp: new Date().toISOString()
        });
  
      } catch (err) {
        console.error('Error generating QR code:', err);
        alert('Failed to generate QR code. Please try again.');
      } finally {
        this.isGenerating = false;
        this.generateBtn.textContent = 'Generate QR Code';
        this.generateBtn.classList.remove('loading');
      }
    }
  
    downloadQRCode() {
      const link = document.createElement('a');
      link.download = `qrcode.${this.formatSelect.value}`;
      link.href = this.qrImage.src;
      link.click();
    }
  
    async shareQRCode() {
      if (navigator.share) {
        try {
          const blob = await (await fetch(this.qrImage.src)).blob();
          const file = new File([blob], 'qrcode.png', { type: blob.type });
  
          await navigator.share({
            title: 'QR Code',
            text: this.contentInput.value,
            files: [file]
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error sharing QR code:', err);
            alert('Failed to share QR code');
          }
        }
      } else {
        alert('Sharing is not supported on this browser');
      }
    }
  
    switchTab(selectedTab) {
      this.tabBtns.forEach(btn => btn.classList.remove('active'));
      selectedTab.classList.add('active');
  
      const targetId = selectedTab.dataset.tab;
      this.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== targetId);
      });
  
      if (targetId === 'history') {
        this.renderHistory();
      }
    }
  
    saveToHistory(item) {
      const history = this.getHistory();
      history.unshift(item);
      localStorage.setItem('qrHistory', JSON.stringify(history.slice(0, 10))); // Keep last 10 entries
      if (document.querySelector('#history:not(.hidden)')) {
        this.renderHistory();
      }
    }
  
    getHistory() {
      try {
        return JSON.parse(localStorage.getItem('qrHistory')) || [];
      } catch {
        return [];
      }
    }
  
    loadHistory() {
      this.renderHistory();
    }
  
    renderHistory() {
      const history = this.getHistory();
      this.historyList.innerHTML = history.length ? history.map((item, index) => `
        <div class="history-item" data-index="${index}">
          <img src="${item.url}" alt="QR Code" />
          <div class="history-item-content">
            <p>${item.content}</p>
            <span>${new Date(item.timestamp).toLocaleString()}</span>
          </div>
        </div>
      `).join('') : '<p class="text-center text-gray-500 py-4">No history yet</p>';
  
      // Add click handlers for history items
      this.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          const historyItem = history[index];
  
          // Switch to generate tab
          this.tabBtns[0].click();
  
          // Fill in the form
          this.contentInput.value = historyItem.content;
          this.qrImage.src = historyItem.url;
          this.qrCode.classList.add('show');
          this.downloadBtn.disabled = false;
          this.shareBtn.disabled = false;
        });
      });
    }
  }
  
  // Initialize the app
  new QRCodeGenerator();
  