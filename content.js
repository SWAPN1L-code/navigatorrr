(() => {
  if (window.__scrollNavInjected) return;
  window.__scrollNavInjected = true;

  // --- 1. PROVIDERS ---
  const PROVIDERS = {
    claude: {
      isMatch: () => window.location.hostname.includes('claude'),
      scrollContainerSelector: 'html', // Default to root, let findScrollableAncestor refine it
      getTurns: (container) => {
        const turns = [];
        const assistantSelectors = [
          '.font-claude-response',
          '[data-testid="assistant-response"]',
          '[data-testid="assistant-message"]'
        ].join(', ');
        const selector = `[data-testid="user-message"], ${assistantSelectors}`;
        const seen = new Set();
        const allItems = Array.from(container.querySelectorAll(selector)).filter(el => {
          if (!el) return false;
          if (seen.has(el)) return false;
          const containerEl = el.closest('[data-testid="conversation-turn"]') || el.closest('.group');
          if (!containerEl) return false;
          const text = (el.innerText || '').trim();
          if (!text) return false;
          seen.add(el);
          return true;
        });

        allItems.forEach(el => {
          const isUser = el.getAttribute('data-testid') === 'user-message';
          const turnContainer = el.closest('[data-testid="conversation-turn"]') || el.closest('.group') || el.parentElement;

          let headings = [];
          if (!isUser) {
            headings = Array.from(el.querySelectorAll('h1, h2, h3, h4')).map(h => ({
              innerText: h.innerText, element: h, tagName: h.tagName
            }));
          }

          turns.push({
            role: isUser ? 'user' : 'assistant',
            element: turnContainer,
            text: el.innerText || '',
            headings: headings
          });
        });
        return turns;
      }
    },
    chatgpt: {
      isMatch: () => window.location.hostname.includes('chatgpt') || window.location.hostname.includes('openai'),
      scrollContainerSelector: 'html', // Use root and let finding logic refine it
      getTurns: (container) => {
        const turns = [];

        // Strategy A: Explicit Conversation Turns (Newer)
        let wrappers = Array.from(container.querySelectorAll('[data-testid*="conversation-turn"]'));

        // Strategy B: Data Attributes (Older)
        if (wrappers.length === 0) {
          const explicitMessages = container.querySelectorAll('[data-message-author-role]');
          if (explicitMessages.length > 0) {
            // Return early with the previous logic if this attribute exists
            const extracted = [];
            explicitMessages.forEach(msg => {
              const role = msg.getAttribute('data-message-author-role');
              const particle = msg.closest('article') || msg.closest('div[class*="group"]') || msg.parentElement;
              if (extracted.some(t => t.element === particle)) return;

              let text = msg.innerText || '';
              let headings = [];
              if (role === 'assistant') {
                headings = Array.from(msg.querySelectorAll('h1, h2, h3, h4')).map(h => ({
                  innerText: h.innerText, element: h, tagName: h.tagName
                }));
              }
              extracted.push({ role, element: particle || msg, text, headings });
            });
            return extracted;
          }
        }

        // Strategy C: 'div.group' Fallback (Common in Tailwind apps)
        if (wrappers.length === 0) {
          wrappers = Array.from(container.querySelectorAll('div.group'));
        }

        wrappers.forEach(wrapper => {
          // Check if this wrapper actually looks like a message
          // User messages often have specific icons or alignment, but simpler is to check for 'markdown' class for AI

          const aiContent = wrapper.querySelector('.markdown') || wrapper.querySelector('.prose'); // .prose is sometimes used
          const userContent = !aiContent ? (wrapper.innerText || '') : ''; // Fallback for user

          // Refine User Detection:
          // User messages in ChatGPT often don't have a specific class, but they lack the .markdown/.prose container.
          // They might be just text nodes or simple divs. 
          // We can look for the "You" label or "User" avatar, but that's localized and brittle.
          // Robust heuristic: If it has .markdown, it's AI. If it's a sibling of an AI node, it's user.

          // Let's try to find an explicit role indicator
          let role = 'user';
          let formattedText = userContent;
          let headings = [];

          if (aiContent) {
            role = 'assistant';
            formattedText = aiContent.innerText || '';
            headings = Array.from(aiContent.querySelectorAll('h1, h2, h3, h4')).map(h => ({
              innerText: h.innerText, element: h, tagName: h.tagName
            }));
          } else {
            // Verify it has some text content to be a user message
            if (!wrapper.innerText || wrapper.innerText.length < 2) return;
            // Exclude system messages / buttons
            if (wrapper.querySelector('button') && wrapper.innerText.length < 20) return;
          }

          turns.push({
            role: role,
            element: wrapper,
            text: formattedText,
            headings: headings
          });
        });

        return turns;
      }
    },
    gemini: {
      isMatch: () => window.location.hostname.includes('gemini') || window.location.hostname.includes('google'),
      scrollContainerSelector: '.mat-sidenav-content',
      getTurns: (container) => {
        const turns = [];
        const items = Array.from(container.querySelectorAll('user-query, model-response'));
        items.forEach(item => {
          const isUser = item.tagName.toLowerCase() === 'user-query';
          let text = '';
          let headings = [];

          if (isUser) {
            const textEl = item.querySelector('.query-text');
            text = textEl ? textEl.innerText : '';
          } else {
            const markdown = item.querySelector('.markdown');
            if (markdown) {
              text = markdown.innerText || '';
              headings = Array.from(markdown.querySelectorAll('h1, h2, h3, h4')).map(h => ({
                innerText: h.innerText, element: h, tagName: h.tagName
              }));
            }
          }

          turns.push({
            role: isUser ? 'user' : 'assistant',
            element: item,
            text: text,
            headings: headings
          });
        });
        return turns;
      }
    },
    dev: {
      isMatch: () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:',
      scrollContainerSelector: 'main',
      getTurns: (container) => {
        const turns = [];
        const items = Array.from(container.querySelectorAll('.message'));
        items.forEach(item => {
          const isUser = item.classList.contains('user');
          let text = '';
          let headings = [];

          if (isUser) {
            text = item.innerText || '';
          } else {
            text = item.innerText || '';
            headings = Array.from(item.querySelectorAll('h1, h2, h3, h4')).map(h => ({
              innerText: h.innerText, element: h, tagName: h.tagName
            }));
          }

          turns.push({
            role: isUser ? 'user' : 'assistant',
            element: item,
            text: text,
            headings: headings
          });
        });
        return turns;
      }
    }
  };

  // --- State Management ---
  const state = {
    isOpen: false,
    currentProvider: null,
    searchTerm: '',
    viewLevel: 2, // 1 = Prompts Only, 2 = All, 3 = Start Only
    starredSignature: new Set(),
    themeMode: 'auto', // auto, light, dark

    // Drag State
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    btnStartX: 0,
    btnStartY: 0,

    navTargets: new Map(),
    navItems: new Map(),
    focusableIds: [],
    focusedIndex: -1,
    activeNavId: null,
    scrollContainer: null,
    scrollEventTarget: null,
    scrollListenerTarget: null,
    conversationObserver: null,
    bodyObserver: null,
    suppressNavAutoScroll: false,
    navAutoScrollTimeout: null
  };

  // --- Initialization ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (!document.body) {
      requestAnimationFrame(init);
      return;
    }
    state.currentProvider = Object.values(PROVIDERS).find(p => p.isMatch());
    if (!state.currentProvider) return;

    createUI();
    applyTheme();
    observeForContainerChanges();

    const container = findConversationContainer();
    if (container) setConversationContainer(container);

    refreshNavigation();
  }

  // --- UI Creation ---
  function createUI() {
    const root = document.createElement('div');
    root.className = 'scroll-nav-root';
    root.id = 'scroll-nav-root';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'scroll-nav-toggle';
    toggleBtn.title = 'Toggle Outline (Cmd+.)';
    // Standard menu icon
    toggleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
    `;

    // --- DRAG LOGIC ---
    toggleBtn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Left click only
      state.isDragging = false;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;

      const rect = toggleBtn.getBoundingClientRect();
      state.btnStartX = rect.left;
      state.btnStartY = rect.top;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - state.dragStartX;
        const dy = moveEvent.clientY - state.dragStartY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          state.isDragging = true;
          toggleBtn.style.right = 'auto'; // Disable right anchoring
          toggleBtn.style.left = `${state.btnStartX + dx}px`;
          toggleBtn.style.top = `${state.btnStartY + dy}px`;
          toggleBtn.style.cursor = 'grabbing';
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        toggleBtn.style.cursor = '';

        // Re-anchor if easy/needed (optional), for now absolute positioning persists
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // Override click to prevent toggle if dragged
    toggleBtn.addEventListener('click', (e) => {
      if (state.isDragging) {
        e.stopImmediatePropagation();
        e.preventDefault();
        state.isDragging = false;
        return;
      }
      toggleNav();
    });

    const panel = document.createElement('div');
    panel.className = 'scroll-nav-panel';

    // HEADER STRUCTURE
    panel.innerHTML = `
      <div class="scroll-nav-header">
        <span class="scroll-nav-progress" id="scroll-progress">0%</span>
        
        <div class="scroll-nav-actions">
           <button class="scroll-action-btn" id="scroll-to-top" title="Jump to Top">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
           </button>
           <button class="scroll-action-btn" id="scroll-to-bottom" title="Jump to Bottom">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
           </button>
           <div style="width:1px; height:16px; background:var(--border-glass); margin:0 4px;"></div>
           <button class="scroll-action-btn" id="scroll-theme-toggle" title="Toggle Theme">
             <!-- Icon injected dynamically -->
           </button>
        </div>

        <div class="scroll-view-toggle">
             <button class="scroll-view-btn" data-level="1">Prompts</button>
             <button class="scroll-view-btn active" data-level="2">All</button>
             <button class="scroll-view-btn" data-level="3">Stars</button>
        </div>
      </div>
      
      <div class="scroll-search-container">
        <div class="scroll-search-wrapper">
            <svg class="scroll-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="scroll-search-input" placeholder="Filter..." id="scroll-search-input">
        </div>
      </div>

      <div class="scroll-nav-content" id="scroll-content"></div>
    `;

    root.appendChild(toggleBtn);
    root.appendChild(panel);
    document.body.appendChild(root);

    // Search Listeners
    const searchInput = root.querySelector('#scroll-search-input');
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value.toLowerCase();
      refreshNavigation();
    });
    searchInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        state.searchTerm = '';
        searchInput.value = '';
        refreshNavigation();
        searchInput.blur();
      }
    });

    // Toggle View Listeners
    const viewBtns = panel.querySelectorAll('.scroll-view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const level = parseInt(btn.dataset.level);
        setViewLevel(level);
      });
    });

    // Jump Buttons
    const btnTop = root.querySelector('#scroll-to-top');
    const btnBot = root.querySelector('#scroll-to-bottom');

    if (btnTop && btnBot) {
      btnTop.addEventListener('click', (e) => {
        e.stopPropagation();
        const scroller = getScrollSourceNode();
        if (!scroller) return;

        if (typeof scroller.scrollTo === 'function') {
          scroller.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scroller.scrollTop = 0;
        }
      });

      btnBot.addEventListener('click', (e) => {
        e.stopPropagation();
        const scroller = getScrollSourceNode();
        if (!scroller) return;

        const top = scroller.scrollHeight;
        if (typeof scroller.scrollTo === 'function') {
          scroller.scrollTo({ top: top, behavior: 'smooth' });
        } else {
          scroller.scrollTop = top;
        }
      });
    }

    // Keyboard Shortcuts (Cmd + . or Cmd + ;)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === '.' || e.key === ';')) {
        e.preventDefault();
        toggleNav();
        return;
      }
      if (!state.isOpen) return;

      if (e.key === 'Escape') {
        toggleNav(false);
        return;
      }

      const activeEl = document.activeElement;
      const typingContext = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );
      if (typingContext) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        moveFocus(1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        moveFocus(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activateFocusedItem();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Cycle backwards: 3 -> 2 -> 1
        const newLevel = state.viewLevel > 1 ? state.viewLevel - 1 : 1;
        setViewLevel(newLevel);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Cycle forwards: 1 -> 2 -> 3
        const newLevel = state.viewLevel < 3 ? state.viewLevel + 1 : 3;
        setViewLevel(newLevel);
      }
    });

    // Theme Toggle
    const themeBtn = root.querySelector('#scroll-theme-toggle');
    updateThemeIcon(themeBtn);
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cycle: auto -> light -> dark -> auto
      if (state.themeMode === 'auto') state.themeMode = 'light';
      else if (state.themeMode === 'light') state.themeMode = 'dark';
      else state.themeMode = 'auto';

      updateThemeIcon(themeBtn);
      applyTheme(); // apply mode
    });
  }

  function updateThemeIcon(btn) {
    if (!btn) return;
    let icon = '';
    if (state.themeMode === 'auto') {
      // Monitor Icon
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
    } else if (state.themeMode === 'light') {
      // Sun Icon
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    } else {
      // Moon Icon
      icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
    btn.innerHTML = icon;
  }

  function toggleNav(forceState) {
    const root = document.getElementById('scroll-nav-root');
    const newState = forceState !== undefined ? forceState : !state.isOpen;
    state.isOpen = newState;
    root.classList.toggle('scroll-nav-open', newState);

    if (newState) {
      const activeIndex = state.focusableIds.indexOf(state.activeNavId);
      if (activeIndex >= 0) {
        state.focusedIndex = activeIndex;
      } else if (state.focusableIds.length > 0) {
        state.focusedIndex = 0;
      } else {
        state.focusedIndex = -1;
      }
    } else {
      state.focusedIndex = -1;
    }
    updateFocusVisuals();
  }

  function applyTheme() {
    const root = document.getElementById('scroll-nav-root');
    const host = window.location.hostname;

    // Host specific font/accent (unchanged)
    if (host.includes('chatgpt')) root.classList.add('theme-chatgpt');
    else if (host.includes('gemini') || host.includes('google')) root.classList.add('theme-gemini');
    else root.classList.add('theme-claude');

    // Mode handling
    root.classList.remove('mode-light', 'mode-dark');
    if (state.themeMode === 'light') root.classList.add('mode-light');
    if (state.themeMode === 'dark') root.classList.add('mode-dark');
  }

  // --- NEW FUNCTION ---
  function setViewLevel(level) {
    if (state.viewLevel === level) return; // Don't re-render if no change
    const root = document.getElementById('scroll-nav-root');
    if (!root) return;

    const viewBtns = root.querySelectorAll('.scroll-view-btn');
    viewBtns.forEach(b => {
      const btnLevel = parseInt(b.dataset.level);
      b.classList.toggle('active', btnLevel === level);
    });

    state.viewLevel = level;
    refreshNavigation();
  }

  // --- Core Navigation Logic ---
  function refreshNavigation() {
    const contentEl = document.getElementById('scroll-content');
    if (!contentEl || !state.currentProvider || !state.scrollContainer) return;

    let turns = state.currentProvider.getTurns(state.scrollContainer);
    updateScrollTargetFromTurns(turns);

    turns.sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);

    state.navTargets.clear();
    state.navItems.clear();
    const focusOrder = [];

    const list = document.createElement('ul');
    list.className = 'scroll-nav-list';
    let hasVisibleItems = false;

    turns.forEach((turn, index) => {
      const isUser = turn.role === 'user';

      const signature = (turn.role + ':' + cleanText(turn.text)).substring(0, 100);
      const isStarred = state.starredSignature.has(signature);

      // --- VIEW LEVEL LOGIC ---
      if (state.viewLevel === 1 && !isStarred && !isUser) return;
      if (state.viewLevel === 3 && !isStarred) return; // Stars Only mode

      // --- SEARCH FILTERING ---
      const rawText = (turn.text || '').toLowerCase();
      const term = state.searchTerm.trim();
      const promptMatch = term === '' || rawText.includes(term);
      const matchingHeadings = turn.headings.filter(h => term === '' || h.innerText.toLowerCase().includes(term));

      if (!promptMatch && matchingHeadings.length === 0) return;
      hasVisibleItems = true;

      // CREATE ITEM
      const li = document.createElement('li');
      li.className = 'scroll-nav-item';
      if (!isUser) li.classList.add('is-assistant');

      // 1. Icon Logic
      const userIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      const aiIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'scroll-nav-icon';
      iconSpan.innerHTML = isUser ? userIcon : aiIcon;
      li.appendChild(iconSpan);

      // 1.5 Star Button
      const starBtn = document.createElement('span');
      starBtn.className = `scroll-nav-star ${isStarred ? 'starred' : ''}`;
      // Star SVG
      starBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

      starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.starredSignature.has(signature)) {
          state.starredSignature.delete(signature);
        } else {
          state.starredSignature.add(signature);
        }
        refreshNavigation();
      });
      li.appendChild(starBtn);

      // 2. Text Logic
      const textSpan = document.createElement('span');
      textSpan.className = 'scroll-nav-text';

      let displayText = cleanText(turn.text);
      if (state.searchTerm && rawText.includes(term)) {
        const idx = rawText.indexOf(term);
        const start = Math.max(0, idx - 10);
        const end = Math.min(rawText.length, idx + 30);
        displayText = "..." + rawText.substring(start, end) + "...";
      }
      textSpan.textContent = displayText;
      li.appendChild(textSpan);

      // 3. Wiring
      const targetId = `nav-target-${index}`;
      state.navTargets.set(targetId, turn.element);
      state.navItems.set(targetId, li);
      focusOrder.push(targetId);

      li.addEventListener('click', (e) => {
        e.stopPropagation();
        scrollToElement(turn.element, targetId);
      });

      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(turn.text).then(() => {
          const originalText = textSpan.textContent;
          textSpan.textContent = "Copied to clipboard!";
          textSpan.style.color = "var(--theme-accent)";
          setTimeout(() => {
            textSpan.textContent = originalText;
            textSpan.style.color = "";
          }, 1200);
        });
      });

      // 4. Headings (Sub-list)
      const showSubHeadings = (state.viewLevel === 2 || state.searchTerm.length > 0);
      const headingsToShow = state.searchTerm ? matchingHeadings : turn.headings;

      if (showSubHeadings && headingsToShow.length > 0) {
        const subList = document.createElement('ul');
        subList.className = 'scroll-nav-sublist';

        headingsToShow.forEach((h, hIndex) => {
          const subLi = document.createElement('li');
          subLi.className = 'scroll-nav-subitem';
          subLi.textContent = h.innerText;

          const hId = `${targetId}-h-${hIndex}`;
          state.navTargets.set(hId, h.element);
          state.navItems.set(hId, subLi);
          focusOrder.push(hId);

          subLi.addEventListener('click', (e) => {
            e.stopPropagation();
            scrollToElement(h.element, hId);
          });
          subList.appendChild(subLi);
        });
        li.appendChild(subList);
      }

      list.appendChild(li);
    });

    contentEl.innerHTML = '';
    if (hasVisibleItems) contentEl.appendChild(list);
    else contentEl.innerHTML = `<div class="scroll-nav-empty-state">No matches found</div>`;

    state.focusableIds = focusOrder;
    if (!focusOrder.length) {
      state.focusedIndex = -1;
    } else if (state.focusedIndex >= focusOrder.length) {
      state.focusedIndex = focusOrder.length - 1;
    }
    updateFocusVisuals();

    // Trigger update to show current position immediately
    if (!state.searchTerm) setTimeout(updateScrollProgress, 100);
  }

  function cleanText(text) {
    if (!text) return '...';
    let clean = text.trim().replace(/[#*`]/g, '').replace(/\s+/g, ' ');
    return clean.length > 50 ? clean.substring(0, 48) + '...' : clean;
  }

  function scrollToElement(element, targetId) {
    if (!element) return;
    state.suppressNavAutoScroll = true;
    if (state.navAutoScrollTimeout) clearTimeout(state.navAutoScrollTimeout);
    state.navAutoScrollTimeout = setTimeout(() => { state.suppressNavAutoScroll = false; }, 800);
    setActiveItem(targetId);

    const scrollSource = getScrollSourceNode();
    const offset = getScrollOffset();

    if (!scrollSource) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (isDocumentScroller(scrollSource)) {
      const globalTop = window.scrollY || window.pageYOffset || 0;
      const targetTop = element.getBoundingClientRect().top + globalTop - offset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      const containerRect = scrollSource.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const targetTop = scrollSource.scrollTop + (elementRect.top - containerRect.top) - offset;
      if (typeof scrollSource.scrollTo === 'function') {
        scrollSource.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        scrollSource.scrollTop = targetTop;
      }
    }

    const idx = state.focusableIds.indexOf(targetId);
    if (idx !== -1) {
      state.focusedIndex = idx;
      updateFocusVisuals();
    }
  }

  function setActiveItem(id) {
    if (state.activeNavId === id) return;
    if (state.activeNavId) {
      const oldItem = state.navItems.get(state.activeNavId);
      if (oldItem) oldItem.classList.remove('scroll-nav-active');
    }
    const newItem = state.navItems.get(id);
    if (newItem) {
      newItem.classList.add('scroll-nav-active');
      newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    state.activeNavId = id;
  }

  function moveFocus(direction) {
    const ids = state.focusableIds;
    if (!ids.length) return;
    if (state.focusedIndex === -1) {
      const activeIndex = state.focusableIds.indexOf(state.activeNavId);
      if (activeIndex >= 0) {
        state.focusedIndex = activeIndex;
      } else {
        state.focusedIndex = direction > 0 ? 0 : ids.length - 1;
      }
    } else {
      state.focusedIndex = (state.focusedIndex + direction + ids.length) % ids.length;
    }
    updateFocusVisuals();
  }

  function activateFocusedItem() {
    if (state.focusedIndex === -1) return;
    const id = state.focusableIds[state.focusedIndex];
    if (!id) return;
    const target = state.navTargets.get(id);
    if (target) scrollToElement(target, id);
  }

  function updateFocusVisuals() {
    const root = document.getElementById('scroll-nav-root');
    if (!root) return;
    root.querySelectorAll('.scroll-nav-focused').forEach(el => el.classList.remove('scroll-nav-focused'));
    if (state.focusedIndex === -1) return;
    const id = state.focusableIds[state.focusedIndex];
    const el = id ? state.navItems.get(id) : null;
    if (!el) return;
    el.classList.add('scroll-nav-focused');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateScrollProgress() {
    if (!state.scrollContainer) return;

    const scrollSource = getScrollSourceNode();
    if (!scrollSource) return;

    let scrolled = 0;
    let max = 0;

    if (scrollSource === document || scrollSource === document.body || scrollSource === document.documentElement) {
      const docEl = document.scrollingElement || document.documentElement || document.body;
      scrolled = docEl.scrollTop || 0;
      max = docEl.scrollHeight - docEl.clientHeight;
    } else {
      scrolled = scrollSource.scrollTop;
      max = scrollSource.scrollHeight - scrollSource.clientHeight;
    }

    if (max < 0) max = 0;
    let pct = max > 0 ? Math.round((scrolled / max) * 100) : 0;
    const label = document.getElementById('scroll-progress');
    if (label) label.textContent = `${pct}%`;

    if (state.suppressNavAutoScroll) return;

    const headerOffset = getScrollOffset();
    const viewLine = state.scrollContainer.getBoundingClientRect().top + headerOffset;
    let closestId = null;
    let minDist = Infinity;

    for (const [id, el] of state.navTargets) {
      if (!el.isConnected) continue;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - viewLine);
      if (dist < minDist) {
        minDist = dist;
        closestId = id;
      }
    }
    if (closestId) setActiveItem(closestId);
  }

  function findConversationContainer() {
    if (!state.currentProvider) return null;
    return document.querySelector(state.currentProvider.scrollContainerSelector) ||
      document.querySelector('main') ||
      document.body;
  }

  function setConversationContainer(node) {
    if (state.conversationObserver) state.conversationObserver.disconnect();
    state.scrollContainer = node;
    state.conversationObserver = new MutationObserver(debounce(() => { refreshNavigation(); }, 500));
    state.conversationObserver.observe(node, { childList: true, subtree: true });

    setScrollEventTarget(node);

    updateScrollProgress();
  }

  function setScrollEventTarget(target) {
    const metricsTarget = target || null;
    const listenerTarget = (metricsTarget === document.body || metricsTarget === document.documentElement) ? window : metricsTarget;

    if (state.scrollEventTarget === metricsTarget && state.scrollListenerTarget === listenerTarget) return;

    if (state.scrollListenerTarget) {
      state.scrollListenerTarget.removeEventListener('scroll', onScroll);
    }

    state.scrollEventTarget = metricsTarget;
    state.scrollListenerTarget = listenerTarget || null;

    if (state.scrollListenerTarget && state.scrollListenerTarget.addEventListener) {
      state.scrollListenerTarget.addEventListener('scroll', onScroll, { passive: true });
    }

    updateScrollProgress();
  }

  function observeForContainerChanges() {
    state.bodyObserver = new MutationObserver(() => {
      const candidate = findConversationContainer();
      if (candidate && candidate !== state.scrollContainer) {
        setConversationContainer(candidate);
        refreshNavigation();
      }
    });
    state.bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  function updateScrollTargetFromTurns(turns) {
    if (!turns || !turns.length) return;
    const firstWithElement = turns.find(t => t.element && t.element.isConnected);
    if (!firstWithElement) return;
    const scrollable = findScrollableAncestor(firstWithElement.element);
    if (scrollable) setScrollEventTarget(scrollable);
  }

  function findScrollableAncestor(node) {
    let current = node;
    while (current) {
      if (elementCanScroll(current)) return current;
      if (current === document.body || current === document.documentElement) break;
      current = getParentNode(current);
    }
    return document.scrollingElement || document.documentElement || document.body;
  }

  function getParentNode(node) {
    if (!node) return null;
    if (node.parentElement) return node.parentElement;
    const root = node.getRootNode && node.getRootNode();
    if (root && root.host) return root.host;
    return null;
  }

  function elementCanScroll(el) {
    if (!el || el.nodeType !== 1) return false;
    const style = window.getComputedStyle(el);
    if (!style) return false;
    const overflowY = style.overflowY || style.overflow;
    if (!overflowY || overflowY === 'visible') return false;
    const contentLarger = el.scrollHeight - el.clientHeight > 4;
    return contentLarger && /(auto|scroll|overlay)/.test(overflowY);
  }

  function getScrollSourceNode() {
    return state.scrollEventTarget || state.scrollContainer || document.scrollingElement || document.documentElement || document.body;
  }

  function isDocumentScroller(node) {
    if (!node) return false;
    const docEl = document.documentElement;
    const body = document.body;
    const scrollingEl = document.scrollingElement;
    return node === body || node === docEl || node === scrollingEl;
  }

  function getScrollOffset() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const dynamicOffset = viewportHeight ? viewportHeight * 0.15 : 0;
    const baseOffset = dynamicOffset || 110;
    const clamped = Math.min(Math.max(baseOffset, 80), 170);
    return clamped;
  }

  function onScroll() {
    if (state.scrollAnimationFrame) return;
    state.scrollAnimationFrame = requestAnimationFrame(() => {
      updateScrollProgress();
      state.scrollAnimationFrame = null;
    });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    }
  }
})();