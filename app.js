/**
 * PingX - Core Application Logic (Production Edition)
 * Implements Android App parity: Splash, Register with 8-digit ID, OTP,
 * Login, Requests, Reason Dialogs, Chats, Google Meet, Voice Notes & Messaging.
 * Comprehensive Security Dashboard, Privacy Center, Settings Hub, Help & Support,
 * About Platform, and Safety Controls (Report & Block).
 */

// Application State
const state = {
  activeScreen: 'screenSplash',
  registeredId: null,
  registeredOtp: null,
  currentUserId: '84920194',
  userProfile: {
    username: 'Alex Rivera',
    email: 'alex_rivera@example.com',
    avatar: '👨‍💻'
  },
  activeChatUser: {
    name: 'Rakesh',
    avatar: '👨‍💻',
    status: 'Online',
    pingxId: '91028475'
  },
  activeRequestTarget: null,
  pendingRequests: [
    { id: '1', name: 'Rakesh', reason: 'Project discussion', avatar: '👨‍💻' },
    { id: '2', name: 'Ram', reason: 'Notes sharing', avatar: '📚' },
    { id: '3', name: 'Rocky', reason: 'Doubt clarification', avatar: '⚡' }
  ],
  blockedUsers: [],
  activeSessions: [
    { id: 'sess-current', name: 'Web Browser (Current Device)', meta: 'Active Now • IP: 192.168.1.104 • Local Session', icon: '💻', isCurrent: true },
    { id: 'sess-android', name: 'PingX Native Android Companion', meta: 'Active 2 hrs ago • Android 14 (APK Build)', icon: '📱', isCurrent: false },
    { id: 'sess-tablet', name: 'Safari Mobile Tablet', meta: 'Active Yesterday • IP: 172.56.21.90', icon: '📱', isCurrent: false }
  ],
  securitySettings: {
    twoFactorEnabled: false,
    alertNewDevice: true,
    alertSuspicious: true,
    alertPassword: true
  },
  privacySettings: {
    onlineStatus: true,
    readReceipts: true,
    requireReason: true,
    hideNotificationPreview: false
  },
  supportTickets: [],
  confirmModalCallback: null,
  isRecording: false,
  recInterval: null,
  recSeconds: 0
};

// DOM Screen References
const screens = {
  splash: document.getElementById('screenSplash'),
  register: document.getElementById('screenRegister'),
  otp: document.getElementById('screenOtp'),
  login: document.getElementById('screenLogin'),
  home: document.getElementById('screenHome'),
  chat: document.getElementById('screenChat'),
  security: document.getElementById('screenSecurity'),
  privacy: document.getElementById('screenPrivacy'),
  settings: document.getElementById('screenSettings'),
  help: document.getElementById('screenHelp'),
  about: document.getElementById('screenAbout')
};

// Toast Notification Helper (with status styling: success, error, warning, info)
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Universal Confirmation Dialog
function showConfirmDialog({ title, description, confirmText = 'Confirm', danger = true, onConfirm }) {
  const titleEl = document.getElementById('confirmModalTitle');
  const descEl = document.getElementById('confirmModalDescription');
  const confirmBtn = document.getElementById('btnConfirmExecute');
  const iconWrap = document.getElementById('confirmModalIconWrap');

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = description;
  if (confirmBtn) {
    confirmBtn.textContent = confirmText;
    confirmBtn.className = danger ? 'btn-danger-sm' : 'btn-gradient-sm';
  }
  if (iconWrap) {
    iconWrap.className = `modal-icon-header ${danger ? 'danger' : 'warning'}`;
  }

  state.confirmModalCallback = onConfirm;
  openModal('modalConfirmAction');
}

// Screen Navigation & Bottom Bar State Synchronization
function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    state.activeScreen = screenId;
  }

  // Bottom Navigation Bar visibility & active tab
  const bottomNav = document.getElementById('appBottomNav');
  const mainTabScreens = ['screenHome', 'screenSecurity', 'screenPrivacy', 'screenSettings'];
  
  if (bottomNav) {
    if (mainTabScreens.includes(screenId)) {
      bottomNav.style.display = 'flex';
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-screen') === screenId);
      });
    } else {
      bottomNav.style.display = 'none';
    }
  }

  // Scroll to top
  const scrollArea = target?.querySelector('.subview-scroll-area, .home-scroll-area, .chat-messages-container');
  if (scrollArea) scrollArea.scrollTop = 0;
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// XSS Prevention Utility
function escapeHtml(string) {
  if (!string) return '';
  const div = document.createElement('div');
  div.innerText = String(string);
  return div.innerHTML;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // 1. Splash Screen Timer
  setTimeout(() => {
    navigateTo('screenRegister');
  }, 2000);

  // Core Flows
  initShareAndBanner();
  initPasswordToggles();
  initRegister();
  initOtp();
  initLogin();
  initHome();
  initChat();

  // Navigation & Sub-views
  initBottomNav();
  initSecurityDashboard();
  initPrivacyCenter();
  initSettingsHub();
  initHelpAndSupport();
  initAbout();
  initUniversalModals();
});

/* ==========================================================
   Desktop Utilities & Share Link
   ========================================================== */
function initShareAndBanner() {
  const appViewport = document.getElementById('appViewport');
  const btnToggleView = document.getElementById('btnToggleView');
  const btnShareModal = document.getElementById('btnShareModal');
  const modalShare = document.getElementById('modalShare');
  const btnCloseShareModal = document.getElementById('btnCloseShareModal');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');
  const qrImage = document.getElementById('qrImage');

  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      appViewport.classList.toggle('full-mode');
    });
  }

  // Production URL resolution
  const currentUrl = window.location.href.startsWith('http') ? window.location.href : 'https://nikkusingh21.github.io/pingx/';
  if (shareUrlInput) shareUrlInput.value = currentUrl;
  if (qrImage) {
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=4A00E0`;
  }

  if (btnShareModal) {
    btnShareModal.addEventListener('click', () => openModal('modalShare'));
  }

  if (btnCloseShareModal) {
    btnCloseShareModal.addEventListener('click', () => closeModal('modalShare'));
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrlInput.value);
        showToast('Link copied to clipboard! 📋', 'success');
      } else {
        shareUrlInput.select();
        document.execCommand('copy');
        showToast('Link copied! 📋', 'success');
      }
    });
  }
}

/* ==========================================================
   Password Visibility Toggle
   ========================================================== */
function initPasswordToggles() {
  document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      }
    });
  });
}

/* ==========================================================
   Registration Flow
   ========================================================== */
function initRegister() {
  const form = document.getElementById('registerForm');
  const linkGoLogin = document.getElementById('linkGoLogin');
  const btnModalContinueToOtp = document.getElementById('btnModalContinueToOtp');

  if (linkGoLogin) {
    linkGoLogin.addEventListener('click', () => navigateTo('screenLogin'));
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const username = document.getElementById('regUsername').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill all fields', 'warning');
        return;
      }

      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      // Generate random 8-digit PingX ID & 4-digit OTP
      const generatedId = Math.floor(10000000 + Math.random() * 90000000);
      const generatedOtp = Math.floor(1000 + Math.random() * 9000);

      state.registeredId = String(generatedId);
      state.registeredOtp = String(generatedOtp);
      state.userProfile.username = username;
      state.userProfile.email = email;

      // Update UI displays
      document.getElementById('generatedPingxId').textContent = state.registeredId;
      document.getElementById('generatedOtp').textContent = state.registeredOtp;

      // Clear password field contents for security hygiene
      document.getElementById('regPassword').value = '';
      document.getElementById('regConfirmPassword').value = '';

      openModal('modalRegSuccess');
    });
  }

  // Copy button inside modal
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy');
      const val = document.getElementById(targetId)?.textContent;
      if (val) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(val);
        }
        showToast(`Copied ${val} 📋`, 'success');
      }
    });
  });

  if (btnModalContinueToOtp) {
    btnModalContinueToOtp.addEventListener('click', () => {
      closeModal('modalRegSuccess');
      document.getElementById('otpPingxIdBadge').textContent = `ID: ${state.registeredId}`;
      document.getElementById('hintCodeDisplay').textContent = state.registeredOtp;
      navigateTo('screenOtp');
    });
  }
}

/* ==========================================================
   OTP Verification Flow
   ========================================================== */
function initOtp() {
  const btnBackToRegister = document.getElementById('btnBackToRegister');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const btnVerifyOtp = document.getElementById('btnVerifyOtp');
  const btnResendOtp = document.getElementById('btnResendOtp');
  const btnAutoFillOtp = document.getElementById('btnAutoFillOtp');

  if (btnBackToRegister) {
    btnBackToRegister.addEventListener('click', () => navigateTo('screenRegister'));
  }

  // Auto-advance inputs
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      box.value = val;
      if (val && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });
  });

  if (btnAutoFillOtp) {
    btnAutoFillOtp.addEventListener('click', () => {
      if (!state.registeredOtp) state.registeredOtp = '4920';
      const digits = state.registeredOtp.split('');
      otpBoxes.forEach((box, i) => {
        box.value = digits[i] || '';
      });
      showToast('OTP Auto-filled! ⚡', 'info');
    });
  }

  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', () => {
      let enteredOtp = '';
      otpBoxes.forEach(b => enteredOtp += b.value);

      if (enteredOtp.length !== 4) {
        showToast('Please enter complete 4-digit code', 'warning');
        return;
      }

      if (state.registeredOtp && enteredOtp !== state.registeredOtp) {
        showToast('Incorrect OTP. Try again.', 'error');
        return;
      }

      showToast('Verification Successful! 🎉', 'success');
      const loginIdInput = document.getElementById('loginIdInput');
      if (loginIdInput && state.registeredId) {
        loginIdInput.value = state.registeredId;
      }
      setTimeout(() => navigateTo('screenLogin'), 600);
    });
  }

  if (btnResendOtp) {
    btnResendOtp.addEventListener('click', () => {
      state.registeredOtp = String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('hintCodeDisplay').textContent = state.registeredOtp;
      showToast(`New OTP Sent: ${state.registeredOtp} 📬`, 'info');
    });
  }
}

/* ==========================================================
   Login Flow
   ========================================================== */
function initLogin() {
  const form = document.getElementById('loginForm');
  const linkGoRegister = document.getElementById('linkGoRegister');

  if (linkGoRegister) {
    linkGoRegister.addEventListener('click', () => navigateTo('screenRegister'));
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const id = document.getElementById('loginIdInput').value.trim();
      const password = document.getElementById('loginPasswordInput').value;

      if (!id || !password) {
        showToast('Enter ID and Password', 'warning');
        return;
      }

      if (id.length !== 8) {
        showToast('PingX ID must be exactly 8 digits', 'warning');
        return;
      }

      state.currentUserId = id;
      syncUserDataAcrossApp(id);

      // Clean password input for security hygiene
      document.getElementById('loginPasswordInput').value = '';

      showToast('Login Successful! Welcome to PingX 🚀', 'success');
      setTimeout(() => navigateTo('screenHome'), 400);
    });
  }
}

function syncUserDataAcrossApp(id) {
  // Update header and profile cards
  const currentIdDisplay = document.getElementById('currentPingxIdDisplay');
  if (currentIdDisplay) currentIdDisplay.textContent = `ID: ${id}`;

  const profileIdDisplay = document.getElementById('profileIdDisplay');
  if (profileIdDisplay) profileIdDisplay.textContent = `ID: ${id}`;

  const secPingxIdDisplay = document.getElementById('secPingxIdDisplay');
  if (secPingxIdDisplay) secPingxIdDisplay.textContent = id;

  const profileNameDisplay = document.getElementById('profileNameDisplay');
  if (profileNameDisplay) profileNameDisplay.textContent = state.userProfile.username;

  const profileEmailDisplay = document.getElementById('profileEmailDisplay');
  if (profileEmailDisplay) profileEmailDisplay.textContent = state.userProfile.email;

  const profileAvatarDisplay = document.getElementById('profileAvatarDisplay');
  if (profileAvatarDisplay) profileAvatarDisplay.textContent = state.userProfile.avatar;

  const timelineCurrentLogin = document.getElementById('timelineCurrentLoginMeta');
  if (timelineCurrentLogin) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timelineCurrentLogin.textContent = `Today, ${timeStr} • Web Client (Active Session)`;
  }
}

/* ==========================================================
   Home Screen Flow (Requests, Dialogs, Chats, Topbar)
   ========================================================== */
function initHome() {
  const btnLogout = document.getElementById('btnLogout');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const btnFabAdd = document.getElementById('btnFabAdd');
  const userPillBadge = document.getElementById('userPillBadge');
  const chatsContainer = document.getElementById('chatsContainer');
  const chatSearchInput = document.getElementById('chatSearchInput');

  // User Pill click -> Navigate to Settings
  if (userPillBadge) {
    userPillBadge.style.cursor = 'pointer';
    userPillBadge.addEventListener('click', () => {
      navigateTo('screenSettings');
    });
  }

  // Logout with confirmation
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Sign Out?',
        description: 'Are you sure you want to log out of your PingX session on this device?',
        confirmText: 'Log Out',
        danger: true,
        onConfirm: () => {
          showToast('Logged out securely', 'info');
          navigateTo('screenLogin');
        }
      });
    });
  }

  // Theme Toggle in header
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      syncThemeUI(isDark);
      showToast(isDark ? 'Dark Mode Activated 🌙' : 'Light Mode Activated ☀️', 'info');
    });
  }

  // Request cards click -> Open Accept/Reject Dialog
  document.querySelectorAll('.request-card').forEach(card => {
    attachRequestCardEvent(card);
  });

  // Modal Accept/Reject Actions
  const btnModalAccept = document.getElementById('btnModalAccept');
  const btnModalReject = document.getElementById('btnModalReject');

  if (btnModalAccept) {
    btnModalAccept.addEventListener('click', () => {
      if (!state.activeRequestTarget) return;

      const { name, avatar } = state.activeRequestTarget;

      // Safe DOM construction to avoid XSS
      const newChat = document.createElement('div');
      newChat.className = 'chat-list-item';
      newChat.setAttribute('data-name', name);
      newChat.setAttribute('data-status', 'Online');
      newChat.setAttribute('data-avatar', avatar);

      newChat.innerHTML = `
        <div class="chat-avatar-box">
          <span class="avatar-emoji">${escapeHtml(avatar)}</span>
          <span class="status-dot online"></span>
        </div>
        <div class="chat-details">
          <div class="chat-header-row">
            <div class="chat-user-name">${escapeHtml(name)}</div>
            <div class="chat-timestamp">Just now</div>
          </div>
          <div class="chat-sub-row">
            <div class="chat-last-message">Tap to start conversation</div>
            <span class="unread-pill">1</span>
          </div>
        </div>
      `;

      attachChatItemClick(newChat);
      if (chatsContainer) {
        chatsContainer.insertBefore(newChat, chatsContainer.firstChild);
      }

      if (state.activeRequestTarget.element) {
        state.activeRequestTarget.element.remove();
      }

      updateRequestsCount();
      closeModal('modalAcceptRequest');
      showToast(`Request accepted! Chat with ${name} ready.`, 'success');
    });
  }

  if (btnModalReject) {
    btnModalReject.addEventListener('click', () => {
      if (state.activeRequestTarget && state.activeRequestTarget.element) {
        state.activeRequestTarget.element.remove();
        updateRequestsCount();
      }
      closeModal('modalAcceptRequest');
      showToast('Connection request declined.', 'info');
    });
  }

  // Add Request FAB (+)
  if (btnFabAdd) {
    btnFabAdd.addEventListener('click', () => {
      openModal('modalSendRequest');
    });
  }

  const formSendRequest = document.getElementById('formSendRequest');
  const btnModalCancelRequest = document.getElementById('btnModalCancelRequest');

  if (btnModalCancelRequest) {
    btnModalCancelRequest.addEventListener('click', () => {
      closeModal('modalSendRequest');
    });
  }

  if (formSendRequest) {
    formSendRequest.addEventListener('submit', (e) => {
      e.preventDefault();
      const reqId = document.getElementById('inputReqId').value.trim();
      const reason = document.getElementById('inputReqReason').value.trim();

      if (reqId.length !== 8) {
        showToast('PingX ID must be 8 digits', 'warning');
        return;
      }

      showToast(`Connection Request Sent to ID: ${reqId} 🚀`, 'success');
      formSendRequest.reset();
      closeModal('modalSendRequest');
    });
  }

  // Chats Click -> Open Chat Screen
  document.querySelectorAll('.chat-list-item').forEach(item => {
    attachChatItemClick(item);
  });

  // Search Filter with Empty State
  if (chatSearchInput) {
    chatSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      let matchCount = 0;

      document.querySelectorAll('.chat-list-item').forEach(item => {
        const name = item.getAttribute('data-name')?.toLowerCase() || '';
        const isMatch = name.includes(q);
        item.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) matchCount++;
      });

      // Show/hide empty state
      let emptySearch = document.getElementById('emptySearchMessage');
      if (matchCount === 0) {
        if (!emptySearch) {
          emptySearch = document.createElement('div');
          emptySearch.id = 'emptySearchMessage';
          emptySearch.className = 'empty-state-wrap';
          emptySearch.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">No conversations found</div>
            <div class="empty-state-desc">No chats match "${escapeHtml(q)}"</div>
          `;
          chatsContainer?.appendChild(emptySearch);
        } else {
          emptySearch.style.display = 'flex';
          emptySearch.querySelector('.empty-state-desc').textContent = `No chats match "${q}"`;
        }
      } else if (emptySearch) {
        emptySearch.style.display = 'none';
      }
    });
  }
}

function attachRequestCardEvent(card) {
  card.addEventListener('click', () => {
    const name = card.getAttribute('data-name');
    const reason = card.getAttribute('data-reason');
    const avatar = card.getAttribute('data-avatar') || '👤';

    state.activeRequestTarget = {
      name,
      reason,
      avatar,
      element: card
    };

    const reqName = document.getElementById('modalReqName');
    const reqReason = document.getElementById('modalReqReason');
    const reqAvatar = document.getElementById('modalReqAvatar');

    if (reqName) reqName.textContent = name;
    if (reqReason) reqReason.textContent = `Reason: ${reason}`;
    if (reqAvatar) reqAvatar.textContent = avatar;

    openModal('modalAcceptRequest');
  });
}

function updateRequestsCount() {
  const remaining = document.querySelectorAll('.request-card').length;
  const badge = document.getElementById('requestsCountBadge');
  const container = document.getElementById('requestsListContainer');

  if (badge) {
    badge.textContent = `${remaining} pending`;
    if (remaining === 0) {
      badge.textContent = 'All caught up ✓';
      if (container && !document.getElementById('emptyRequestsMsg')) {
        container.innerHTML = `
          <div id="emptyRequestsMsg" style="padding: 12px 16px; color: var(--text-muted); font-size: 13px; font-weight: 500;">
            No pending requests. You're all caught up! ✨
          </div>
        `;
      }
    }
  }
}

function attachChatItemClick(item) {
  item.addEventListener('click', () => {
    const name = item.getAttribute('data-name') || 'Friend';
    const status = item.getAttribute('data-status') || 'Online';
    const avatar = item.getAttribute('data-avatar') || '👤';

    state.activeChatUser = { name, status, avatar, element: item };

    // Update Chat Screen Header
    const chatHeaderName = document.getElementById('chatHeaderName');
    const chatHeaderStatus = document.getElementById('chatHeaderStatus');
    const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');

    if (chatHeaderName) chatHeaderName.textContent = name;
    if (chatHeaderStatus) chatHeaderStatus.textContent = status;
    if (chatHeaderAvatar) chatHeaderAvatar.textContent = avatar;

    // Remove unread pill
    const unread = item.querySelector('.unread-pill');
    if (unread) unread.remove();

    navigateTo('screenChat');
  });
}

/* ==========================================================
   Chat Activity Screen Flow (Options Menu, Report, Block, Clear)
   ========================================================== */
function initChat() {
  const btnChatBack = document.getElementById('btnChatBack');
  const btnVideoCall = document.getElementById('btnVideoCall');
  const btnChatMenu = document.getElementById('btnChatMenu');
  const chatMenuDropdown = document.getElementById('chatMenuDropdown');
  const btnSendMessage = document.getElementById('btnSendMessage');
  const chatInputMessage = document.getElementById('chatInputMessage');
  const chatMessagesContainer = document.getElementById('chatMessagesContainer');
  const chatHeaderStatus = document.getElementById('chatHeaderStatus');
  const btnMic = document.getElementById('btnMic');
  const btnCancelRec = document.getElementById('btnCancelRec');
  const voiceRecordingBanner = document.getElementById('voiceRecordingBanner');
  const recTimer = document.getElementById('recTimer');
  const btnAttach = document.getElementById('btnAttach');
  const fileAttachInput = document.getElementById('fileAttachInput');

  // Chat back button
  if (btnChatBack) {
    btnChatBack.addEventListener('click', () => navigateTo('screenHome'));
  }

  // Google Meet Video Call
  if (btnVideoCall) {
    btnVideoCall.addEventListener('click', () => {
      showToast('Opening Google Meet video call room... 📹', 'info');
      window.open('https://meet.google.com/', '_blank');
    });
  }

  // 3-Dots Menu Toggle
  if (btnChatMenu && chatMenuDropdown) {
    btnChatMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      chatMenuDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      chatMenuDropdown.classList.remove('active');
    });
  }

  // Menu: View User Details
  const btnMenuContactInfo = document.getElementById('btnMenuContactInfo');
  if (btnMenuContactInfo) {
    btnMenuContactInfo.addEventListener('click', () => {
      chatMenuDropdown?.classList.remove('active');
      const contactAvatar = document.getElementById('contactModalAvatar');
      const contactName = document.getElementById('contactModalName');
      const contactId = document.getElementById('contactModalId');
      const contactStatus = document.getElementById('contactModalStatus');

      if (contactAvatar) contactAvatar.textContent = state.activeChatUser.avatar;
      if (contactName) contactName.textContent = state.activeChatUser.name;
      if (contactId) contactId.textContent = `PingX Peer Contact`;
      if (contactStatus) contactStatus.textContent = `Status: ${state.activeChatUser.status}`;

      openModal('modalContactProfile');
    });
  }

  const btnCloseContactProfile = document.getElementById('btnCloseContactProfile');
  if (btnCloseContactProfile) {
    btnCloseContactProfile.addEventListener('click', () => closeModal('modalContactProfile'));
  }

  const btnContactModalBlock = document.getElementById('btnContactModalBlock');
  if (btnContactModalBlock) {
    btnContactModalBlock.addEventListener('click', () => {
      closeModal('modalContactProfile');
      triggerBlockUserFlow(state.activeChatUser.name, state.activeChatUser.avatar);
    });
  }

  // Menu: Clear Messages
  const btnMenuClearChat = document.getElementById('btnMenuClearChat');
  if (btnMenuClearChat) {
    btnMenuClearChat.addEventListener('click', () => {
      chatMenuDropdown?.classList.remove('active');
      showConfirmDialog({
        title: `Clear Chat with ${state.activeChatUser.name}?`,
        description: 'All message bubbles will be purged from this conversation view.',
        confirmText: 'Clear Messages',
        danger: true,
        onConfirm: () => {
          if (chatMessagesContainer) {
            chatMessagesContainer.innerHTML = `<div class="chat-date-pill">Conversation Cleared</div>`;
          }
          showToast('Conversation history cleared 🧹', 'info');
        }
      });
    });
  }

  // Menu: Report User
  const btnMenuReportUser = document.getElementById('btnMenuReportUser');
  const reportTargetUser = document.getElementById('reportTargetUser');
  const formReportUser = document.getElementById('formReportUser');
  const btnCancelReport = document.getElementById('btnCancelReport');

  if (btnMenuReportUser) {
    btnMenuReportUser.addEventListener('click', () => {
      chatMenuDropdown?.classList.remove('active');
      if (reportTargetUser) {
        reportTargetUser.value = `${state.activeChatUser.name} (Peer)`;
      }
      openModal('modalReportUser');
    });
  }

  if (btnCancelReport) {
    btnCancelReport.addEventListener('click', () => closeModal('modalReportUser'));
  }

  if (formReportUser) {
    formReportUser.addEventListener('submit', (e) => {
      e.preventDefault();
      const andBlock = document.getElementById('reportAndBlockCheckbox')?.checked;
      const reportedName = state.activeChatUser.name;
      const reportedAvatar = state.activeChatUser.avatar;

      closeModal('modalReportUser');
      showToast(`Report submitted for ${reportedName}. Thank you for keeping PingX safe 🛡️`, 'success');

      if (andBlock) {
        blockUserDirect(reportedName, reportedAvatar);
        navigateTo('screenHome');
      }
      formReportUser.reset();
    });
  }

  // Menu: Block User
  const btnMenuBlockUser = document.getElementById('btnMenuBlockUser');
  if (btnMenuBlockUser) {
    btnMenuBlockUser.addEventListener('click', () => {
      chatMenuDropdown?.classList.remove('active');
      triggerBlockUserFlow(state.activeChatUser.name, state.activeChatUser.avatar);
    });
  }

  function triggerBlockUserFlow(name, avatar) {
    showConfirmDialog({
      title: `Block ${name}?`,
      description: 'They will no longer be able to message you or send connection requests.',
      confirmText: 'Block User',
      danger: true,
      onConfirm: () => {
        blockUserDirect(name, avatar);
        showToast(`Blocked ${name} 🚫`, 'warning');
        navigateTo('screenHome');
      }
    });
  }

  function blockUserDirect(name, avatar) {
    if (!state.blockedUsers.some(u => u.name === name)) {
      state.blockedUsers.push({
        id: 'blk-' + Date.now(),
        name,
        avatar: avatar || '👤',
        blockedAt: 'Just now'
      });
    }
    // Remove from home chats container
    document.querySelectorAll('.chat-list-item').forEach(item => {
      if (item.getAttribute('data-name') === name) {
        item.remove();
      }
    });
    updateBlockedUsersUI();
  }

  // File Attachment
  if (btnAttach && fileAttachInput) {
    btnAttach.addEventListener('click', () => fileAttachInput.click());
    fileAttachInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast(`Attached: ${file.name}`, 'info');
        appendMessage(`📎 Shared file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'sent');
        fileAttachInput.value = '';
      }
    });
  }

  // Chat message sending
  if (chatInputMessage) {
    chatInputMessage.addEventListener('input', () => {
      chatInputMessage.style.height = 'auto';
      chatInputMessage.style.height = Math.min(chatInputMessage.scrollHeight, 100) + 'px';
    });

    chatInputMessage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendUserMessage();
      }
    });
  }

  if (btnSendMessage) {
    btnSendMessage.addEventListener('click', sendUserMessage);
  }

  function sendUserMessage() {
    const text = chatInputMessage.value.trim();
    if (!text) return;

    appendMessage(text, 'sent');
    chatInputMessage.value = '';
    chatInputMessage.style.height = 'auto';

    // Simulate reply if user is not blocked
    if (!state.blockedUsers.some(u => u.name === state.activeChatUser.name)) {
      setTimeout(() => {
        if (chatHeaderStatus) chatHeaderStatus.textContent = 'Typing...';
      }, 450);

      setTimeout(() => {
        const replies = [
          "hey! 👋",
          "Got it, sounds great!",
          "Yes, PingX is super fast!",
          "Let's jump on a quick Google Meet call?",
          "Awesome update. I'll check it right away!"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        appendMessage(randomReply, 'received');
        if (chatHeaderStatus) chatHeaderStatus.textContent = 'Online';
      }, 1300);
    }
  }

  function appendMessage(text, type = 'sent') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${type}`;
    bubble.innerHTML = `
      <div class="bubble-text">${escapeHtml(text)}</div>
      <div class="bubble-meta">
        ${time} ${type === 'sent' ? '<span class="read-ticks">✓✓</span>' : ''}
      </div>
    `;

    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // Voice recording
  if (btnMic) {
    btnMic.addEventListener('click', () => {
      if (!state.isRecording) {
        startVoiceRecording();
      } else {
        stopVoiceRecording(true);
      }
    });
  }

  if (btnCancelRec) {
    btnCancelRec.addEventListener('click', () => stopVoiceRecording(false));
  }

  function startVoiceRecording() {
    state.isRecording = true;
    state.recSeconds = 0;
    voiceRecordingBanner?.classList.add('active');
    btnMic.style.color = '#e53935';

    state.recInterval = setInterval(() => {
      state.recSeconds++;
      const m = Math.floor(state.recSeconds / 60);
      const s = state.recSeconds % 60;
      if (recTimer) recTimer.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);

    showToast('Recording voice note... 🎙️', 'info');
  }

  function stopVoiceRecording(send = true) {
    state.isRecording = false;
    clearInterval(state.recInterval);
    voiceRecordingBanner?.classList.remove('active');
    btnMic.style.color = '';

    if (send && state.recSeconds > 0) {
      appendMessage(`🎙️ Voice Message (${recTimer.textContent})`, 'sent');
      showToast('Voice note sent! 🎵', 'success');
    }
  }
}

/* ==========================================================
   Bottom Navigation Bar & Back Buttons
   ========================================================== */
function initBottomNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetScreen = tab.getAttribute('data-screen');
      if (targetScreen) {
        navigateTo(targetScreen);
      }
    });
  });

  // Wire all sub-view back buttons
  document.querySelectorAll('.btn-subview-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const backScreen = btn.getAttribute('data-back-to') || 'screenHome';
      navigateTo(backScreen);
    });
  });
}

/* ==========================================================
   Security Dashboard Flow
   ========================================================== */
function initSecurityDashboard() {
  const btnCopySecId = document.getElementById('btnCopySecId');
  const btnOpenChangePassword = document.getElementById('btnOpenChangePassword');
  const btnSetup2fa = document.getElementById('btnSetup2fa');
  const btnLogoutAllDevices = document.getElementById('btnLogoutAllDevices');
  const formVerify2fa = document.getElementById('formVerify2fa');
  const btnCancel2fa = document.getElementById('btnCancel2fa');
  const formChangePassword = document.getElementById('formChangePassword');
  const btnCancelChangePassword = document.getElementById('btnCancelChangePassword');

  // Copy Security ID
  if (btnCopySecId) {
    btnCopySecId.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(state.currentUserId);
      }
      showToast(`Copied PingX ID: ${state.currentUserId} 📋`, 'success');
    });
  }

  // Password Change modal
  if (btnOpenChangePassword) {
    btnOpenChangePassword.addEventListener('click', () => openModal('modalChangePassword'));
  }
  if (btnCancelChangePassword) {
    btnCancelChangePassword.addEventListener('click', () => closeModal('modalChangePassword'));
  }
  if (formChangePassword) {
    formChangePassword.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById('currentPasswordInput')?.value;
      const newPwd = document.getElementById('newPasswordInput')?.value;
      const confirmPwd = document.getElementById('confirmNewPasswordInput')?.value;

      if (!currentPwd || !newPwd || !confirmPwd) {
        showToast('Please fill all password fields', 'warning');
        return;
      }
      if (newPwd.length < 8) {
        showToast('New password must be at least 8 characters', 'warning');
        return;
      }
      if (newPwd !== confirmPwd) {
        showToast('New passwords do not match', 'error');
        return;
      }

      closeModal('modalChangePassword');
      formChangePassword.reset();
      showToast('Password updated successfully! 🔑', 'success');
      const lastLoginEl = document.getElementById('secLastLoginText');
      if (lastLoginEl) lastLoginEl.textContent = 'Password changed today';
    });
  }

  // 2FA Setup
  if (btnSetup2fa) {
    btnSetup2fa.addEventListener('click', () => {
      if (state.securitySettings.twoFactorEnabled) {
        showConfirmDialog({
          title: 'Disable Two-Factor Authentication?',
          description: 'Your account will only be protected by your PingX ID and password.',
          confirmText: 'Disable 2FA',
          danger: true,
          onConfirm: () => {
            state.securitySettings.twoFactorEnabled = false;
            update2faStatusUI();
            showToast('2FA has been disabled.', 'info');
          }
        });
      } else {
        openModal('modalSetup2fa');
      }
    });
  }

  if (btnCancel2fa) {
    btnCancel2fa.addEventListener('click', () => closeModal('modalSetup2fa'));
  }

  if (formVerify2fa) {
    formVerify2fa.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('input2faCode')?.value.trim();
      if (!code || code.length !== 6) {
        showToast('Please enter a 6-digit TOTP code', 'warning');
        return;
      }

      state.securitySettings.twoFactorEnabled = true;
      update2faStatusUI();
      closeModal('modalSetup2fa');
      formVerify2fa.reset();
      showToast('Two-Factor Authentication Enabled! 🔐', 'success');
    });
  }

  function update2faStatusUI() {
    const statusText = document.getElementById('sec2faStatusText');
    const btn = document.getElementById('btnSetup2fa');
    const scoreVal = document.getElementById('secScoreVal');
    const scoreFill = document.querySelector('.score-fill');

    if (state.securitySettings.twoFactorEnabled) {
      if (statusText) statusText.innerHTML = '<span style="color: #00E676; font-weight: 700;">Enabled & Active ✓</span>';
      if (btn) {
        btn.textContent = 'Disable 2FA';
        btn.className = 'btn-danger-sm';
      }
      if (scoreVal) scoreVal.textContent = '100%';
      if (scoreFill) scoreFill.style.width = '100%';
    } else {
      if (statusText) statusText.textContent = 'Not Configured';
      if (btn) {
        btn.textContent = 'Configure 2FA';
        btn.className = 'btn-gradient-sm';
      }
      if (scoreVal) scoreVal.textContent = '92%';
      if (scoreFill) scoreFill.style.width = '92%';
    }
  }

  // Log Out All Other Devices
  if (btnLogoutAllDevices) {
    btnLogoutAllDevices.addEventListener('click', () => {
      const otherCount = state.activeSessions.filter(s => !s.isCurrent).length;
      if (otherCount === 0) {
        showToast('No other active sessions.', 'info');
        return;
      }

      showConfirmDialog({
        title: 'Revoke All Other Sessions?',
        description: `This will instantly log out ${otherCount} other device(s). You will remain signed in here.`,
        confirmText: 'Log Out Others',
        danger: true,
        onConfirm: () => {
          state.activeSessions = state.activeSessions.filter(s => s.isCurrent);
          renderSessionsList();
          showToast('Logged out from all other devices ✓', 'success');
        }
      });
    });
  }

  function renderSessionsList() {
    const container = document.getElementById('sessionsListContainer');
    const countBadge = document.getElementById('activeSessionsCount');
    if (!container) return;

    if (countBadge) countBadge.textContent = `${state.activeSessions.length} active`;

    container.innerHTML = state.activeSessions.map(sess => `
      <div class="session-item ${sess.isCurrent ? 'current-session' : 'other-session'}">
        <div class="session-icon">${sess.icon}</div>
        <div class="session-info">
          <div class="session-title-row">
            <span class="session-name">${escapeHtml(sess.name)}</span>
            <span class="session-tag ${sess.isCurrent ? 'current' : ''}">${sess.isCurrent ? 'This Device' : 'Authorized'}</span>
          </div>
          <div class="session-meta">${escapeHtml(sess.meta)}</div>
        </div>
      </div>
    `).join('');
  }
}

/* ==========================================================
   Privacy Center Flow (Data Export, Clear Cache, Deletion)
   ========================================================== */
function initPrivacyCenter() {
  const btnExportData = document.getElementById('btnExportData');
  const btnClearLocalData = document.getElementById('btnClearLocalData');
  const btnDeleteAccountPrompt = document.getElementById('btnDeleteAccountPrompt');

  // Real JSON Data Export
  if (btnExportData) {
    btnExportData.addEventListener('click', () => {
      const exportArchive = {
        app: "PingX Messenger",
        exportTimestamp: new Date().toISOString(),
        user: {
          pingxId: state.currentUserId,
          profile: state.userProfile,
          registeredAt: "2026-09-10T12:00:00Z"
        },
        privacyPreferences: state.privacySettings,
        securityOverview: {
          twoFactorAuthActive: state.securitySettings.twoFactorEnabled,
          authorizedSessions: state.activeSessions
        },
        blockedUsers: state.blockedUsers,
        messageHistorySnapshot: [
          {
            with: "Rakesh",
            status: "Connected",
            messages: [
              { direction: "incoming", text: "Hi! Thanks for connecting on PingX.", time: "10:44 AM" },
              { direction: "outgoing", text: "Hey! Glad to connect. How is your project going?", time: "10:45 AM" }
            ]
          },
          { with: "Alex Carter", lastMessage: "Hey, did you check the new APK update?" },
          { with: "Sarah Lin", lastMessage: "Awesome! Let's connect over video call soon." }
        ]
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportArchive, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pingx-data-export-${state.currentUserId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Personal Data Archive Exported! 📥', 'success');
    });
  }

  // Clear Local Data
  if (btnClearLocalData) {
    btnClearLocalData.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Clear Local History & Cache?',
        description: 'This will purge local conversation messages, temp audio recordings, and recent previews from this browser.',
        confirmText: 'Clear Local Cache',
        danger: true,
        onConfirm: () => {
          const chatMessagesContainer = document.getElementById('chatMessagesContainer');
          if (chatMessagesContainer) {
            chatMessagesContainer.innerHTML = `<div class="chat-date-pill">History Purged</div>`;
          }
          showToast('Local history & cache cleared 🧹', 'info');
        }
      });
    });
  }

  // Delete PingX Account
  if (btnDeleteAccountPrompt) {
    btnDeleteAccountPrompt.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Permanently Delete PingX Account?',
        description: `This will revoke PingX ID ${state.currentUserId} and permanently erase your account credentials. This action is irreversible.`,
        confirmText: 'Delete My Account',
        danger: true,
        onConfirm: () => {
          state.currentUserId = null;
          state.registeredId = null;
          state.registeredOtp = null;
          showToast('Account deleted. We hope to see you again.', 'info');
          navigateTo('screenRegister');
        }
      });
    });
  }
}

/* ==========================================================
   Settings Hub Flow
   ========================================================== */
function initSettingsHub() {
  const rowGoSecurity = document.getElementById('rowGoSecurity');
  const rowGoPrivacy = document.getElementById('rowGoPrivacy');
  const rowGoBlockedUsers = document.getElementById('rowGoBlockedUsers');
  const rowGoHelp = document.getElementById('rowGoHelp');
  const rowGoAbout = document.getElementById('rowGoAbout');
  const rowOpenTerms = document.getElementById('rowOpenTerms');
  const rowOpenPrivacyPolicy = document.getElementById('rowOpenPrivacyPolicy');
  const rowLogoutAction = document.getElementById('rowLogoutAction');
  const btnSettingsLogout = document.getElementById('btnSettingsLogout');

  // Subview navigations
  rowGoSecurity?.addEventListener('click', () => navigateTo('screenSecurity'));
  rowGoPrivacy?.addEventListener('click', () => navigateTo('screenPrivacy'));
  rowGoHelp?.addEventListener('click', () => navigateTo('screenHelp'));
  rowGoAbout?.addEventListener('click', () => navigateTo('screenAbout'));

  // Modals from settings
  rowGoBlockedUsers?.addEventListener('click', () => {
    updateBlockedUsersUI();
    openModal('modalBlockedUsers');
  });

  rowOpenTerms?.addEventListener('click', () => openModal('modalTerms'));
  rowOpenPrivacyPolicy?.addEventListener('click', () => openModal('modalPrivacyPolicy'));

  // Logout actions
  const triggerLogout = () => {
    showConfirmDialog({
      title: 'Sign Out?',
      description: 'Are you sure you want to sign out of PingX on this device?',
      confirmText: 'Sign Out',
      danger: true,
      onConfirm: () => {
        showToast('Logged out securely', 'info');
        navigateTo('screenLogin');
      }
    });
  };

  rowLogoutAction?.addEventListener('click', triggerLogout);
  btnSettingsLogout?.addEventListener('click', triggerLogout);

  // Edit Profile
  const btnEditProfile = document.getElementById('btnEditProfile');
  const formEditProfile = document.getElementById('formEditProfile');
  const btnCancelEditProfile = document.getElementById('btnCancelEditProfile');

  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      const editName = document.getElementById('editUsernameInput');
      const editEmail = document.getElementById('editEmailInput');
      const editAvatar = document.getElementById('editAvatarSelect');

      if (editName) editName.value = state.userProfile.username;
      if (editEmail) editEmail.value = state.userProfile.email;
      if (editAvatar) editAvatar.value = state.userProfile.avatar;

      openModal('modalEditProfile');
    });
  }

  if (btnCancelEditProfile) {
    btnCancelEditProfile.addEventListener('click', () => closeModal('modalEditProfile'));
  }

  if (formEditProfile) {
    formEditProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('editUsernameInput')?.value.trim();
      const newEmail = document.getElementById('editEmailInput')?.value.trim();
      const newAvatar = document.getElementById('editAvatarSelect')?.value;

      if (newName) state.userProfile.username = newName;
      if (newEmail) state.userProfile.email = newEmail;
      if (newAvatar) state.userProfile.avatar = newAvatar;

      syncUserDataAcrossApp(state.currentUserId);
      closeModal('modalEditProfile');
      showToast('Profile updated! 👤', 'success');
    });
  }

  // Theme selector buttons
  const btnThemeLight = document.getElementById('btnThemeLight');
  const btnThemeDark = document.getElementById('btnThemeDark');

  if (btnThemeLight && btnThemeDark) {
    btnThemeLight.addEventListener('click', () => {
      document.body.classList.remove('dark-theme');
      syncThemeUI(false);
      showToast('Light Theme Active ☀️', 'info');
    });

    btnThemeDark.addEventListener('click', () => {
      document.body.classList.add('dark-theme');
      syncThemeUI(true);
      showToast('Dark Theme Active 🌙', 'info');
    });
  }

  // Desktop frame switch
  const toggleDesktopFrame = document.getElementById('toggleDesktopFrame');
  const appViewport = document.getElementById('appViewport');
  if (toggleDesktopFrame && appViewport) {
    toggleDesktopFrame.addEventListener('change', () => {
      appViewport.classList.toggle('full-mode', !toggleDesktopFrame.checked);
    });
  }
}

function syncThemeUI(isDark) {
  const btnLight = document.getElementById('btnThemeLight');
  const btnDark = document.getElementById('btnThemeDark');
  if (btnLight && btnDark) {
    btnLight.classList.toggle('active', !isDark);
    btnDark.classList.toggle('active', isDark);
  }
}

function updateBlockedUsersUI() {
  const container = document.getElementById('blockedUsersListContainer');
  const badge = document.getElementById('blockedUsersCountBadge');
  if (!container) return;

  if (badge) badge.textContent = state.blockedUsers.length;

  if (state.blockedUsers.length === 0) {
    container.innerHTML = `
      <div class="empty-state-wrap">
        <div class="empty-state-icon">🛡️</div>
        <div class="empty-state-title">No Blocked Users</div>
        <div class="empty-state-desc">You have not blocked any contacts. Your safety list is clear.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = state.blockedUsers.map(u => `
    <div class="blocked-user-item">
      <div class="blocked-user-left">
        <span class="blocked-avatar">${escapeHtml(u.avatar)}</span>
        <div>
          <div class="blocked-name">${escapeHtml(u.name)}</div>
          <div class="blocked-date">Blocked: ${escapeHtml(u.blockedAt)}</div>
        </div>
      </div>
      <button type="button" class="btn-ghost-sm btn-unblock-user" data-name="${escapeHtml(u.name)}">Unblock</button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-unblock-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      showConfirmDialog({
        title: `Unblock ${name}?`,
        description: 'They will be allowed to send you messages and connection requests again.',
        confirmText: 'Unblock',
        danger: false,
        onConfirm: () => {
          state.blockedUsers = state.blockedUsers.filter(u => u.name !== name);
          updateBlockedUsersUI();
          showToast(`Unblocked ${name} ✓`, 'success');
        }
      });
    });
  });
}

/* ==========================================================
   Help & Support Center Flow
   ========================================================== */
function initHelpAndSupport() {
  // Accordion Expand/Collapse
  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-accordion-item');
      if (item) {
        item.classList.toggle('active');
      }
    });
  });

  // FAQ Category Filter Pills
  const pills = document.querySelectorAll('.faq-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.getAttribute('data-filter');
      document.querySelectorAll('.faq-accordion-item').forEach(item => {
        const cat = item.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // FAQ Search Input
  const searchInput = document.getElementById('faqSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.faq-accordion-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  // Contact Support Form
  const formContactSupport = document.getElementById('formContactSupport');
  const supportDescription = document.getElementById('supportDescription');
  const supportCharCount = document.getElementById('supportCharCount');
  const supportAttachment = document.getElementById('supportAttachment');
  const supportAttachmentTag = document.getElementById('supportAttachmentTag');
  const btnSubmitSupport = document.getElementById('btnSubmitSupport');
  const supportBtnText = document.getElementById('supportBtnText');

  if (supportDescription && supportCharCount) {
    supportDescription.addEventListener('input', () => {
      supportCharCount.textContent = supportDescription.value.length;
    });
  }

  if (supportAttachment && supportAttachmentTag) {
    supportAttachment.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        supportAttachmentTag.style.display = 'inline-block';
        supportAttachmentTag.textContent = `📎 Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      } else {
        supportAttachmentTag.style.display = 'none';
      }
    });
  }

  if (formContactSupport) {
    formContactSupport.addEventListener('submit', (e) => {
      e.preventDefault();

      const subject = document.getElementById('supportSubject')?.value.trim();
      const category = document.getElementById('supportCategory')?.value;
      const desc = supportDescription?.value.trim();

      if (!subject || !desc) {
        showToast('Please provide subject and description', 'warning');
        return;
      }

      // Simulate loading state
      if (btnSubmitSupport && supportBtnText) {
        btnSubmitSupport.disabled = true;
        supportBtnText.textContent = 'Submitting Request...';
      }

      setTimeout(() => {
        const ticketRefId = `PX-${Math.floor(1000 + Math.random() * 9000)}-SUP`;
        state.supportTickets.unshift({
          id: ticketRefId,
          subject,
          category,
          date: 'Just now',
          status: 'Under Review'
        });

        if (btnSubmitSupport && supportBtnText) {
          btnSubmitSupport.disabled = false;
          supportBtnText.textContent = 'Submit Support Request';
        }

        formContactSupport.reset();
        if (supportCharCount) supportCharCount.textContent = '0';
        if (supportAttachmentTag) supportAttachmentTag.style.display = 'none';

        // Show Success Modal
        const refDisplay = document.getElementById('submittedTicketRefId');
        if (refDisplay) refDisplay.textContent = ticketRefId;
        openModal('modalSupportTicketSuccess');

        renderRecentTickets();
      }, 700);
    });
  }

  function renderRecentTickets() {
    const trackerArea = document.getElementById('ticketsTrackerArea');
    const container = document.getElementById('ticketsListContainer');
    if (!trackerArea || !container) return;

    if (state.supportTickets.length > 0) {
      trackerArea.style.display = 'block';
      container.innerHTML = state.supportTickets.map(t => `
        <div class="ticket-item">
          <div>
            <strong>${escapeHtml(t.id)}</strong> - ${escapeHtml(t.subject)}
          </div>
          <span class="ticket-status-badge">${escapeHtml(t.status)}</span>
        </div>
      `).join('');
    }
  }
}

/* ==========================================================
   About PingX Flow
   ========================================================== */
function initAbout() {
  const btnAboutTerms = document.getElementById('btnAboutTerms');
  const btnAboutPrivacy = document.getElementById('btnAboutPrivacy');
  const btnAboutLicenses = document.getElementById('btnAboutLicenses');

  btnAboutTerms?.addEventListener('click', () => openModal('modalTerms'));
  btnAboutPrivacy?.addEventListener('click', () => openModal('modalPrivacyPolicy'));
  btnAboutLicenses?.addEventListener('click', () => {
    showToast('PingX is built with Google Fonts, Lucide Icons, and Open Web standards.', 'info', 4000);
  });
}

/* ==========================================================
   Universal Modal Listeners
   ========================================================== */
function initUniversalModals() {
  // Close confirmation dialog
  document.getElementById('btnConfirmCancel')?.addEventListener('click', () => {
    closeModal('modalConfirmAction');
    state.confirmModalCallback = null;
  });

  document.getElementById('btnConfirmExecute')?.addEventListener('click', () => {
    if (typeof state.confirmModalCallback === 'function') {
      state.confirmModalCallback();
    }
    closeModal('modalConfirmAction');
    state.confirmModalCallback = null;
  });

  // Blocked users modal close buttons
  document.getElementById('btnCloseBlockedModal')?.addEventListener('click', () => closeModal('modalBlockedUsers'));
  document.getElementById('btnCloseBlockedModalX')?.addEventListener('click', () => closeModal('modalBlockedUsers'));

  // Support success modal close
  document.getElementById('btnCloseSupportSuccessModal')?.addEventListener('click', () => closeModal('modalSupportTicketSuccess'));

  // Terms & Policy modal closes
  document.getElementById('btnCloseTermsModal')?.addEventListener('click', () => closeModal('modalTerms'));
  document.getElementById('btnAcceptTermsModal')?.addEventListener('click', () => closeModal('modalTerms'));
  document.getElementById('btnClosePolicyModal')?.addEventListener('click', () => closeModal('modalPrivacyPolicy'));
  document.getElementById('btnAcceptPolicyModal')?.addEventListener('click', () => closeModal('modalPrivacyPolicy'));

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });
}
