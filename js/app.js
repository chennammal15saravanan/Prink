// =========================================================================
// THE PRINK - Redesigned Minimal Premium SaaS Controller
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Global Initializations
  initPortalSwitcher();
  initThemeToggle();
  initCommandPalette();
  initCustomerPortal();
  initLivePreview();
  initAdminPortal();
  
  showToast("The Prink Dashboard Online. Shopify Active.", "success");
});

// ----------------------------------------------------
// Global Toast System
// ----------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-view-container');
  const toast = document.createElement('div');
  toast.className = `toast`;
  
  let iconClass = 'bi-info-circle';
  let colorStyle = 'var(--primary)';
  
  if (type === 'success') {
    iconClass = 'bi-check-circle-fill';
    colorStyle = 'var(--success)';
  } else if (type === 'error') {
    iconClass = 'bi-x-circle-fill';
    colorStyle = 'var(--error)';
  } else if (type === 'warning') {
    iconClass = 'bi-exclamation-triangle-fill';
    colorStyle = 'var(--warning)';
  }
  
  toast.innerHTML = `
    <i class="bi ${iconClass}" style="color: ${colorStyle}; font-size: 16px;"></i>
    <span style="font-size: 13px; font-weight: 500;">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Show animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ----------------------------------------------------
// Global Portal Switcher (Customer / Admin / Printer)
// ----------------------------------------------------
let activePortal = 'customer';

function switchPortal(portalId) {
  const views = document.querySelectorAll('.portal-container-view');
  const tabs = document.querySelectorAll('.portal-tab');
  
  views.forEach(view => view.classList.remove('active'));
  tabs.forEach(tab => tab.classList.remove('active'));
  
  const targetView = document.getElementById(`portal-${portalId}`);
  const targetTab = document.getElementById(`tab-portal-${portalId}`);
  
  if (targetView && targetTab) {
    targetView.classList.add('active');
    targetTab.classList.add('active');
    activePortal = portalId;
  }
  
  showToast(`Ported to ${portalId.toUpperCase()} workspace`, 'info');
  document.getElementById('cmd-palette-box').classList.remove('active');
}

function initPortalSwitcher() {
  // Can bind additional deep links here if required
}

// ----------------------------------------------------
// Theme Toggle (Light / Dark Mode)
// ----------------------------------------------------
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  
  toggleBtn.addEventListener('click', () => {
    const htmlEl = document.documentElement;
    const isDark = htmlEl.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    htmlEl.setAttribute('data-theme', newTheme);
    
    const icon = toggleBtn.querySelector('i');
    if (newTheme === 'dark') {
      icon.className = 'bi bi-sun';
      showToast('Dark Theme Applied', 'success');
    } else {
      icon.className = 'bi bi-moon-stars';
      showToast('Light Theme Applied', 'success');
    }
  });
}

// ----------------------------------------------------
// Command Palette (⌘K)
// ----------------------------------------------------
function initCommandPalette() {
  const palette = document.getElementById('cmd-palette-box');
  const input = document.getElementById('cmd-field');
  
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      palette.classList.toggle('active');
      if (palette.classList.contains('active')) input.focus();
    }
    if (e.key === 'Escape') {
      palette.classList.remove('active');
    }
  });
  
  palette.addEventListener('click', (e) => {
    if (e.target === palette) {
      palette.classList.remove('active');
    }
  });
}

function filterCommandPalette() {
  const query = document.getElementById('cmd-field').value.toLowerCase();
  const items = document.querySelectorAll('#cmd-results-view .cmd-item');
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    if (text.includes(query)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function handleCmdPaletteClick(commandType) {
  const palette = document.getElementById('cmd-palette-box');
  palette.classList.remove('active');
  
  if (commandType === 'customer-login') {
    switchPortal('customer');
    switchCustomerViewState('login');
  } else if (commandType === 'customer-dashboard') {
    switchPortal('customer');
    switchCustomerViewState('dashboard');
  } else if (commandType === 'admin-login') {
    switchPortal('admin');
    switchAdminViewState('login');
  } else if (commandType === 'admin-dashboard') {
    switchPortal('admin');
    switchAdminViewState('dashboard');
  } else if (commandType === 'printer-dashboard') {
    switchPortal('printer');
  } else if (commandType === 'toggle-theme') {
    document.getElementById('btn-theme-toggle').click();
  }
}

// =========================================================================
// CUSTOMER PORTAL MODULE
// =========================================================================
let customerAuthenticated = false;
let customerUploadedCount = 3;
let activeCustCropImageId = null;

function initCustomerPortal() {
  const dropZone = document.getElementById('cust-upload-zone');
  
  if (!dropZone) return;
  
  // Drop zone events
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--text-primary)';
      dropZone.style.background = 'var(--bg-tertiary)';
    });
  });
  
  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border-color)';
      dropZone.style.background = 'var(--bg-secondary)';
    });
  });
  
  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handleCustFiles(files);
  });
  
  setupCustGalleryDrag();
}

function switchCustomerViewState(state) {
  const views = ['login', 'dashboard'];
  views.forEach(v => {
    const el = document.getElementById(`customer-state-${v}`);
    if (el) el.classList.remove('active');
  });
  
  const target = document.getElementById(`customer-state-${state}`);
  if (target) target.classList.add('active');
}

function handleCustomerOTPRequest() {
  const phone = document.getElementById('customer-login-tel').value;
  if (!phone) {
    showToast('Please enter a valid phone number.', 'error');
    return;
  }
  
  // Prompt simulation
  const otp = prompt('A mock OTP code was sent to your phone. Enter "1234" to login:');
  if (otp === '1234') {
    customerAuthenticated = true;
    switchCustomerViewState('dashboard');
    showToast('Login authorized. Synced Shopify Order #1042.', 'success');
  } else {
    showToast('Incorrect passcode. Enter 1234.', 'error');
  }
}

function handleCustomerWhatsAppLogin() {
  customerAuthenticated = true;
  switchCustomerViewState('dashboard');
  showToast('Authenticated via WhatsApp Quick-Link! Order #1042 ready.', 'success');
}

// Subview router in Customer Dashboard sidebar
function switchCustomerSubView(subId) {
  const subViews = ['upload', 'preview', 'tracking', 'drafts'];
  subViews.forEach(v => {
    document.getElementById(`customer-subview-${v}`).classList.remove('active');
    document.getElementById(`subnav-cust-${v}`).classList.remove('active');
  });
  
  document.getElementById(`customer-subview-${subId}`).classList.add('active');
  document.getElementById(`subnav-cust-${subId}`).classList.add('active');
  
  showToast(`Customer view: ${subId.toUpperCase()}`, 'info');
}

// File uploads
function triggerCustFileSelect() {
  document.getElementById('cust-file-input').click();
}

document.getElementById('cust-file-input')?.addEventListener('change', (e) => {
  handleCustFiles(e.target.files);
});

function handleCustFiles(files) {
  if (files.length === 0) return;
  
  const container = document.getElementById('cust-progress-container');
  const list = document.getElementById('cust-progress-list');
  
  container.style.display = 'block';
  
  Array.from(files).forEach((file, idx) => {
    const fileId = 'cust-file-' + Date.now() + '-' + idx;
    const progressRow = document.createElement('div');
    progressRow.className = 'flex flex-col gap-1';
    progressRow.id = fileId;
    
    progressRow.innerHTML = `
      <div class="flex justify-between text-xs">
        <span class="font-semibold">${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)</span>
        <span id="cust-pct-${fileId}">0%</span>
      </div>
      <div style="background: var(--bg-tertiary); height: 4px; border-radius: var(--radius-sm); overflow: hidden; position: relative;">
        <div id="cust-bar-${fileId}" style="position: absolute; left:0; top:0; bottom:0; background: var(--primary); width: 0%; transition: width 0.1s ease;"></div>
      </div>
    `;
    list.appendChild(progressRow);
    
    let pct = 0;
    const runner = setInterval(() => {
      pct += Math.floor(Math.random() * 20) + 10;
      if (pct >= 100) {
        pct = 100;
        clearInterval(runner);
        
        setTimeout(() => {
          progressRow.remove();
          if (list.children.length === 0) {
            container.style.display = 'none';
          }
          addCustFileToGallery(file);
        }, 400);
      }
      document.getElementById(`cust-bar-${fileId}`).style.width = pct + '%';
      document.getElementById(`cust-pct-${fileId}`).textContent = pct + '%';
    }, 120);
  });
}

function addCustFileToGallery(file) {
  const gallery = document.getElementById('cust-upload-gallery');
  const reader = new FileReader();
  
  reader.onload = (e) => {
    customerUploadedCount++;
    document.getElementById('cust-upload-count').textContent = customerUploadedCount;
    
    const id = 'cust-img-' + Date.now();
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.draggable = true;
    card.setAttribute('data-id', id);
    
    card.innerHTML = `
      <img src="${e.target.result}">
      <div class="preview-card-overlay">
        <button class="preview-card-btn" onclick="openCustCropper('${id}')" title="Smart Crop"><i class="bi bi-crop"></i></button>
        <button class="preview-card-btn" onclick="deleteCustImage('${id}')" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
    `;
    gallery.appendChild(card);
    setupCustGalleryDrag();
    showToast(`"${file.name}" uploaded successfully!`, 'success');
  };
  
  reader.readAsDataURL(file);
}

function deleteCustImage(id) {
  const item = document.querySelector(`.preview-card[data-id="${id}"]`);
  if (item) {
    item.remove();
    customerUploadedCount--;
    document.getElementById('cust-upload-count').textContent = customerUploadedCount;
    showToast('Image deleted.', 'warning');
  }
}

// Drag & Drop Swapping positions
function setupCustGalleryDrag() {
  const cards = document.querySelectorAll('.preview-card');
  let dragSource = null;
  
  cards.forEach(card => {
    card.addEventListener('dragstart', function(e) {
      dragSource = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
      e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
      this.style.opacity = '0.5';
    });
    
    card.addEventListener('dragover', function(e) {
      e.preventDefault();
      return false;
    });
    
    card.addEventListener('dragend', function() {
      cards.forEach(c => c.style.opacity = '1.0');
    });
    
    card.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      const sourceId = e.dataTransfer.getData('text/plain');
      const targetId = this.getAttribute('data-id');
      
      if (dragSource !== this) {
        const tempHTML = this.innerHTML;
        const tempId = this.getAttribute('data-id');
        
        this.innerHTML = dragSource.innerHTML;
        this.setAttribute('data-id', dragSource.getAttribute('data-id'));
        
        dragSource.innerHTML = tempHTML;
        dragSource.setAttribute('data-id', tempId);
        
        showToast('Sequence reordered.', 'info');
      }
      return false;
    });
  });
}

// ----------------------------------------------------
// AI Crop Modal Tool (Customer Portal)
// ----------------------------------------------------
let custCropZoom = 1.0;
let custCropRotate = 0;

function openCustCropper(imageId) {
  activeCustCropImageId = imageId;
  const modal = document.getElementById('cust-crop-modal');
  const targetImg = document.getElementById('cust-crop-img-target');
  
  const galleryImg = document.querySelector(`.preview-card[data-id="${imageId}"] img`);
  if (galleryImg) {
    targetImg.src = galleryImg.src;
  }
  
  custCropZoom = 1.0;
  custCropRotate = 0;
  document.getElementById('range-cust-zoom').value = 1.0;
  document.getElementById('range-cust-rotate').value = 0;
  applyCustCropTransforms();
  
  modal.classList.add('active');
}

function closeCustCropper() {
  document.getElementById('cust-crop-modal').classList.remove('active');
  activeCustCropImageId = null;
}

function applyCustCropTransforms() {
  custCropZoom = document.getElementById('range-cust-zoom').value;
  custCropRotate = document.getElementById('range-cust-rotate').value;
  
  const img = document.getElementById('cust-crop-img-target');
  img.style.transform = `scale(${custCropZoom}) rotate(${custCropRotate}deg)`;
}

function setCustCropMask(type) {
  const mask = document.getElementById('cust-crop-mask');
  mask.className = `crop-border-mask ${type}`;
}

function saveCustCropData() {
  if (activeCustCropImageId) {
    showToast('AI Crop alignment saved.', 'success');
    closeCustCropper();
  }
}

// =========================================================================
// CUSTOMER LIVE PREVIEW PAGE
// =========================================================================
let custPreviewScale = 1.0;
let custPreviewRotation = 0;
let isCustSliderActive = false;
let isDraggingCustSlider = false;

function initLivePreview() {
  const handle = document.getElementById('cust-slider-handle');
  const box = document.getElementById('cust-slider-box');
  const mask = document.getElementById('cust-slider-mask');
  
  if (!handle || !box) return;
  
  handle.addEventListener('mousedown', () => {
    isDraggingCustSlider = true;
  });
  
  document.addEventListener('mouseup', () => {
    isDraggingCustSlider = false;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDraggingCustSlider) return;
    
    const rect = box.getBoundingClientRect();
    let x = e.clientX - rect.left;
    
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    
    const pct = (x / rect.width) * 100;
    mask.style.width = pct + '%';
    handle.style.left = pct + '%';
  });
}

function selectCustProduct(prodType) {
  const frame = document.getElementById('cust-mockup-frame');
  const buttons = ['mug', 'canvas'];
  
  buttons.forEach(b => {
    document.getElementById(`btn-select-${b}`).classList.remove('active');
  });
  document.getElementById(`btn-select-${prodType}`).classList.add('active');
  
  frame.className = 'mockup-wrapper';
  
  if (prodType === 'mug') {
    frame.classList.add('mug');
    showToast('Switched layout to Coffee Mug Wrap format.', 'info');
  } else if (prodType === 'canvas') {
    frame.classList.add('canvas');
    showToast('Switched layout to Stretch Canvas frame borders.', 'info');
  }
}

function zoomCustPreview(val) {
  custPreviewScale += val;
  if (custPreviewScale < 0.7) custPreviewScale = 0.7;
  if (custPreviewScale > 2.2) custPreviewScale = 2.2;
  updateCustPreviewStyle();
}

function rotateCustPreview(val) {
  custPreviewRotation += val;
  updateCustPreviewStyle();
}

function updateCustPreviewStyle() {
  const img = document.getElementById('cust-mockup-default-img');
  img.style.transform = `scale(${custPreviewScale}) rotate(${custPreviewRotation}deg)`;
}

function toggleCustSafeMargins() {
  const zone = document.getElementById('cust-safe-zone');
  const btn = document.getElementById('btn-cust-safe');
  
  if (zone.style.display === 'block') {
    zone.style.display = 'none';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    zone.style.display = 'block';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-secondary');
  }
}

function toggleCustBleedMargins() {
  const zone = document.getElementById('cust-bleed-zone');
  const btn = document.getElementById('btn-cust-bleed');
  
  if (zone.style.display === 'block') {
    zone.style.display = 'none';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    zone.style.display = 'block';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-secondary');
  }
}

function toggleCustComparison() {
  isCustSliderActive = !isCustSliderActive;
  
  const defImg = document.getElementById('cust-mockup-default-img');
  const sliderBox = document.getElementById('cust-slider-box');
  const btn = document.getElementById('btn-cust-compare');
  
  if (isCustSliderActive) {
    defImg.style.display = 'none';
    sliderBox.style.display = 'block';
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-outline');
    showToast('HD compare slider enabled. Drag the center dividing line.', 'info');
  } else {
    defImg.style.display = 'block';
    sliderBox.style.display = 'none';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
  }
}

function handleApproveCustomerOrder() {
  showToast('Template layout validated and approved successfully!', 'success');
  
  // Transition to Admin Portal layout for workflow showcase
  setTimeout(() => {
    switchPortal('admin');
    switchAdminViewState('dashboard');
    showToast('Demonstration Flow: Navigated to Admin Dashboard.', 'success');
  }, 1000);
}


// =========================================================================
// ADMIN PORTAL MODULE
// =========================================================================
let adminAuthenticated = false;

function initAdminPortal() {
  // Setup logic if required
}

function switchAdminViewState(state) {
  const states = ['login', 'dashboard'];
  states.forEach(s => {
    document.getElementById(`admin-state-${s}`).classList.remove('active');
  });
  
  const target = document.getElementById(`admin-state-${state}`);
  if (target) target.classList.add('active');
}

function handleAdminLoginSubmit() {
  const email = document.getElementById('admin-email-field').value;
  const pass = document.getElementById('admin-password-field').value;
  
  if (!email || !pass) {
    showToast('Please fill in login credentials.', 'error');
    return;
  }
  
  adminAuthenticated = true;
  switchAdminViewState('dashboard');
  showToast('Authenticated as Shop Administrator.', 'success');
}

function filterAdminOrdersTable() {
  const query = document.getElementById('admin-orders-search').value.toLowerCase();
  const rows = document.querySelectorAll('#admin-orders-table tbody .admin-order-row');
  
  rows.forEach(row => {
    const customer = row.getAttribute('data-customer').toLowerCase();
    if (customer.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function runAdminDPIUpscaler() {
  showToast('Initiating automated AI DPI check on synchronizations...', 'info');
  
  setTimeout(() => {
    const targetBadge = document.getElementById('badge-1043');
    if (targetBadge) {
      targetBadge.className = 'badge badge-success';
      targetBadge.innerHTML = '300 DPI (AI Up)';
    }
    
    // Decrease pending metric count
    document.getElementById('admin-metrics-pending').textContent = '3';
    showToast('Upscaled 1 low-resolution order layout.', 'success');
  }, 1500);
}

function sendWhatsAppAlert(orderId, customerName) {
  showToast(`WhatsApp notification link sent to ${customerName} for ${orderId}`, 'success');
}

function forceApproveAdmin(orderId) {
  showToast(`Order ${orderId} forced approved into print-ready queue.`, 'warning');
}

function routeToPrinterQueue(orderId, customerName) {
  showToast(`Routing layout of ${orderId} to Operator workstation...`, 'info');
  
  setTimeout(() => {
    const tbody = document.getElementById('printer-queue-tbody');
    const tr = document.createElement('tr');
    tr.id = `printer-row-${orderId}`;
    
    tr.innerHTML = `
      <td class="font-bold">${orderId}</td>
      <td>${customerName}</td>
      <td>Canvas Print (stretched)</td>
      <td>12.25" x 16.25"</td>
      <td><span class="badge badge-success">Ready</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="downloadPrintPDF('${orderId}', '${customerName}')"><i class="bi bi-file-pdf"></i> Download PDF</button>
      </td>
    `;
    tbody.appendChild(tr);
    
    showToast(`Order ${orderId} synced with Printer Operator queue.`, 'success');
  }, 1000);
}


// =========================================================================
// PRINTER WORKFLOW QUEUE MODULE
// =========================================================================
function downloadPrintPDF(orderId, customer) {
  showToast(`Compiling vector PDF for ${orderId}...`, 'info');
  
  setTimeout(() => {
    showToast('Appending trim margins and color calibration bars...', 'info');
    setTimeout(() => {
      // Mock File Download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `THEPRINK_${orderId}_${customer.replace(' ', '_')}_VECTOR_PRINT.pdf`;
      showToast(`Downloaded vector layout template: THEPRINK_${orderId}_VECTOR_PRINT.pdf`, 'success');
    }, 1000);
  }, 1000);
}

function batchDownloadPrinterPDFs() {
  showToast('Assembling print jobs ZIP compression batch...', 'info');
  setTimeout(() => {
    showToast('Download started for 2 active print vector files.', 'success');
  }, 1500);
}
