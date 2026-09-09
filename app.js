/**
 * PingX - Core Application Logic
 * Implements Android App parity: Splash, Register with 8-digit ID, OTP,
 * Login, Requests, Reason Dialogs, Chats, Google Meet, Voice Notes & Messaging.
 */

// Application State
const state = {
  activeScreen: 'screenSplash',
  registeredId: null,
  registeredOtp: null,
  currentUserId: '84920194',
  activeChatUser: {
    name: 'Rakesh',
    avatar: '👨‍💻',
    status: 'Online'
  },
  activeRequestTarget: null,
  pendingRequests: [
    { id: '1', name: 'Rakesh', reason: 'Project discussion', avatar: '👨‍💻' },
    { id: '2', name: 'Ram', reason: 'Notes sharing', avatar: '📚' },
    { id: '3', name: 'Rocky', reason: 'Doubt clarification', avatar: '⚡' }
  ],
  isRecording: false,
  recInterval: null,
  recSeconds: 0
};

// DOM Elements
const screens = {
  splash: document.getElementById('screenSplash'),
  register: document.getElementById('screenRegister'),
  otp: document.getElementById('screenOtp'),
  login: document.getElementById('screenLogin'),
  home: document.getElementById('screenHome'),
  chat: document.getElementById('screenChat')
};

// Toast Notification Helper
function showToast(message, duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Navigation between screens
function navigateTo(screenId) {
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove('active');
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    state.activeScreen = screenId;
  }
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

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // 1. Splash Screen Timer (2.2s delay to match Android Handler)
  setTimeout(() => {
    navigateTo('screenRegister');
  }, 2200);

  // Setup Viewport and Share Link
  initShareAndBanner();

  // Setup Eye Password Toggles
  initPasswordToggles();

  // Setup Registration Flow
  initRegister();

  // Setup OTP Flow
  initOtp();

  // Setup Login Flow
  initLogin();

  // Setup Home Screen
  initHome();

  // Setup Chat Screen
  initChat();
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

  // Toggle Frame vs Full View
  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      appViewport.classList.toggle('full-mode');
    });
  }

  // Update share link and QR code
  const currentUrl = window.location.href;
  if (shareUrlInput) shareUrlInput.value = currentUrl;
  if (qrImage) {
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=4A00E0`;
  }

  if (btnShareModal) {
    btnShareModal.addEventListener('click', () => {
      openModal('modalShare');
    });
  }

  if (btnCloseShareModal) {
    btnCloseShareModal.addEventListener('click', () => {
      closeModal('modalShare');
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrlInput.value);
        showToast('Link copied to clipboard! 📋');
      } else {
        shareUrlInput.select();
        document.execCommand('copy');
        showToast('Link copied! 📋');
      }
    });
  }

  // Close modals when clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });
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
        showToast('Please fill all fields');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }

      // Generate random 8-digit PingX ID (10000000 - 99999999)
      const generatedId = Math.floor(10000000 + Math.random() * 90000000);
      // Generate 4-digit OTP (1000 - 9999)
      const generatedOtp = Math.floor(1000 + Math.random() * 9000);

      state.registeredId = String(generatedId);
      state.registeredOtp = String(generatedOtp);

      // Populate Success Modal
      document.getElementById('generatedPingxId').textContent = state.registeredId;
      document.getElementById('generatedOtp').textContent = state.registeredOtp;

      openModal('modalRegSuccess');
    });
  }

  // Copy button inside modal
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy');
      const val = document.getElementById(targetId)?.textContent;
      if (val) {
        navigator.clipboard?.writeText(val);
        showToast(`Copied ${val} 📋`);
      }
    });
  });

  if (btnModalContinueToOtp) {
    btnModalContinueToOtp.addEventListener('click', () => {
      closeModal('modalRegSuccess');
      // Setup OTP screen
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

  // Auto-advance OTP inputs
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

  // Auto-fill OTP button
  if (btnAutoFillOtp) {
    btnAutoFillOtp.addEventListener('click', () => {
      if (!state.registeredOtp) state.registeredOtp = '4920';
      const digits = state.registeredOtp.split('');
      otpBoxes.forEach((box, i) => {
        box.value = digits[i] || '';
      });
      showToast('OTP Auto-filled! ⚡');
    });
  }

  // Verify OTP
  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', () => {
      let enteredOtp = '';
      otpBoxes.forEach(b => enteredOtp += b.value);

      if (enteredOtp.length !== 4) {
        showToast('Please enter complete 4-digit code');
        return;
      }

      if (state.registeredOtp && enteredOtp !== state.registeredOtp) {
        showToast('Incorrect OTP. Try again.');
        return;
      }

      showToast('Verification Successful! 🎉');
      // Pre-fill Login screen with registered ID
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
      showToast(`New OTP Sent: ${state.registeredOtp} 📬`);
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
        showToast('Enter ID and Password');
        return;
      }

      if (id.length !== 8) {
        showToast('PingX ID must be exactly 8 digits');
        return;
      }

      state.currentUserId = id;
      document.getElementById('currentPingxIdDisplay').textContent = `ID: ${id}`;
      showToast('Login Successful! Welcome to PingX 🚀');

      setTimeout(() => navigateTo('screenHome'), 400);
    });
  }
}

/* ==========================================================
   Home Screen Flow (Requests, Dialogs, Chats)
   ========================================================== */
function initHome() {
  const btnLogout = document.getElementById('btnLogout');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const btnFabAdd = document.getElementById('btnFabAdd');
  const requestsContainer = document.getElementById('requestsListContainer');
  const chatsContainer = document.getElementById('chatsContainer');
  const chatSearchInput = document.getElementById('chatSearchInput');

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      showToast('Logged out');
      navigateTo('screenLogin');
    });
  }

  // Theme Toggle
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      showToast(document.body.classList.contains('dark-theme') ? 'Dark Mode' : 'Light Mode');
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

      // Add to chats list dynamically (Exact Android Java parity: adds chat item)
      const newChat = document.createElement('div');
      newChat.className = 'chat-list-item';
      newChat.setAttribute('data-name', name);
      newChat.setAttribute('data-status', 'Online');
      newChat.setAttribute('data-avatar', avatar);

      newChat.innerHTML = `
        <div class="chat-avatar-box">
          <span class="avatar-emoji">${avatar}</span>
          <span class="status-dot online"></span>
        </div>
        <div class="chat-details">
          <div class="chat-header-row">
            <div class="chat-user-name">${name}</div>
            <div class="chat-timestamp">Just now</div>
          </div>
          <div class="chat-sub-row">
            <div class="chat-last-message">Tap to chat</div>
            <span class="unread-pill">1</span>
          </div>
        </div>
      `;

      attachChatItemClick(newChat);
      chatsContainer.insertBefore(newChat, chatsContainer.firstChild);

      // Remove request card
      if (state.activeRequestTarget.element) {
        state.activeRequestTarget.element.remove();
      }

      updateRequestsCount();
      closeModal('modalAcceptRequest');
      showToast(`Request accepted! Chat with ${name} added.`);
    });
  }

  if (btnModalReject) {
    btnModalReject.addEventListener('click', () => {
      if (state.activeRequestTarget && state.activeRequestTarget.element) {
        state.activeRequestTarget.element.remove();
        updateRequestsCount();
      }
      closeModal('modalAcceptRequest');
      showToast('Request declined.');
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
        showToast('PingX ID must be 8 digits');
        return;
      }

      showToast(`Request Sent to ${reqId} 🚀`);
      formSendRequest.reset();
      closeModal('modalSendRequest');
    });
  }

  // Chats Click -> Open Chat Screen
  document.querySelectorAll('.chat-list-item').forEach(item => {
    attachChatItemClick(item);
  });

  // Search Filter
  if (chatSearchInput) {
    chatSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.chat-list-item').forEach(item => {
        const name = item.getAttribute('data-name')?.toLowerCase() || '';
        item.style.display = name.includes(q) ? 'flex' : 'none';
      });
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

    document.getElementById('modalReqName').textContent = name;
    document.getElementById('modalReqReason').textContent = `Reason: ${reason}`;
    document.getElementById('modalReqAvatar').textContent = avatar;

    openModal('modalAcceptRequest');
  });
}

function updateRequestsCount() {
  const remaining = document.querySelectorAll('.request-card').length;
  const badge = document.getElementById('requestsCountBadge');
  if (badge) {
    badge.textContent = `${remaining} pending`;
    if (remaining === 0) badge.textContent = 'No pending';
  }
}

function attachChatItemClick(item) {
  item.addEventListener('click', () => {
    const name = item.getAttribute('data-name') || 'Friend';
    const status = item.getAttribute('data-status') || 'Online';
    const avatar = item.getAttribute('data-avatar') || '👤';

    state.activeChatUser = { name, status, avatar };

    // Update Chat Screen Header
    document.getElementById('chatHeaderName').textContent = name;
    document.getElementById('chatHeaderStatus').textContent = status;
    document.getElementById('chatHeaderAvatar').textContent = avatar;

    // Reset unread pill
    const unread = item.querySelector('.unread-pill');
    if (unread) unread.remove();

    navigateTo('screenChat');
  });
}

/* ==========================================================
   Chat Activity Screen Flow
   ========================================================== */
function initChat() {
  const btnChatBack = document.getElementById('btnChatBack');
  const btnVideoCall = document.getElementById('btnVideoCall');
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

  // Back Button
  if (btnChatBack) {
    btnChatBack.addEventListener('click', () => navigateTo('screenHome'));
  }

  // Video Call -> Google Meet (matches ChatActivity.java: uri "https://meet.google.com/")
  if (btnVideoCall) {
    btnVideoCall.addEventListener('click', () => {
      showToast('Opening Google Meet video call... 📹');
      window.open('https://meet.google.com/', '_blank');
    });
  }

  // File Attachment
  if (btnAttach && fileAttachInput) {
    btnAttach.addEventListener('click', () => fileAttachInput.click());
    fileAttachInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast(`Attached file: ${file.name}`);
        appendMessage(`📎 Shared file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'sent');
        fileAttachInput.value = '';
      }
    });
  }

  // Typing status effect
  if (chatInputMessage) {
    chatInputMessage.addEventListener('input', () => {
      // Auto-resize textarea
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

    // Simulate friend typing and reply (Matches Android Java flow: fake reply)
    setTimeout(() => {
      if (chatHeaderStatus) chatHeaderStatus.textContent = 'Typing...';
    }, 500);

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
    }, 1400);
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

  // Voice Recording Mic
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
    btnCancelRec.addEventListener('click', () => {
      stopVoiceRecording(false);
    });
  }

  function startVoiceRecording() {
    state.isRecording = true;
    state.recSeconds = 0;
    voiceRecordingBanner.classList.add('active');
    btnMic.style.color = '#e53935';

    state.recInterval = setInterval(() => {
      state.recSeconds++;
      const m = Math.floor(state.recSeconds / 60);
      const s = state.recSeconds % 60;
      recTimer.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);

    showToast('Recording voice note... 🎙️');
  }

  function stopVoiceRecording(send = true) {
    state.isRecording = false;
    clearInterval(state.recInterval);
    voiceRecordingBanner.classList.remove('active');
    btnMic.style.color = '';

    if (send && state.recSeconds > 0) {
      appendMessage(`🎙️ Voice Message (${recTimer.textContent})`, 'sent');
      showToast('Voice note sent! 🎵');
    }
  }
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}
