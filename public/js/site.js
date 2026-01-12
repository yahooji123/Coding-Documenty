document.addEventListener('DOMContentLoaded', () => {
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const themeToggle = document.getElementById('themeToggle');
    const fontIncrease = document.getElementById('fontIncrease');
    const fontDecrease = document.getElementById('fontDecrease');
    const copyBtn = document.getElementById('copyBtn');
    
    // Sidebar Toggle
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Chapter Toggles
    const chapterTitles = document.querySelectorAll('.chapter-title');
    chapterTitles.forEach(title => {
        title.addEventListener('click', () => {
            title.parentElement.classList.toggle('active');
        });
    });

    // Theme Toggle
    if (themeToggle) {
        // Check saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀';
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                themeToggle.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.textContent = '☀';
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // Font Size
    if (fontIncrease && fontDecrease) {
        let currentFontSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--code-font-size')) || 14;
        
        fontIncrease.addEventListener('click', () => {
            if (currentFontSize < 24) {
                currentFontSize += 2;
                document.documentElement.style.setProperty('--code-font-size', `${currentFontSize}px`);
            }
        });

        fontDecrease.addEventListener('click', () => {
            if (currentFontSize > 10) {
                currentFontSize -= 2;
                document.documentElement.style.setProperty('--code-font-size', `${currentFontSize}px`);
            }
        });
    }

    // Copy Button
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const codeBlock = document.getElementById('codeBlock');
            if (codeBlock) {
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    copyBtn.style.backgroundColor = '#27c93f';
                    copyBtn.style.color = 'white';
                    
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.style.backgroundColor = '';
                        copyBtn.style.color = '';
                    }, 2000);
                });
            }
        });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const filter = e.target.value.toLowerCase();
            const chapters = document.querySelectorAll('.chapter-item');
            
            chapters.forEach(chapter => {
                const chapterTitle = chapter.querySelector('.chapter-title').textContent.toLowerCase();
                const files = chapter.querySelectorAll('.file-item');
                let hasVisibleFile = false;

                files.forEach(file => {
                    if (file.textContent.toLowerCase().includes(filter) || chapterTitle.includes(filter)) {
                        file.style.display = 'block';
                        hasVisibleFile = true;
                    } else {
                        file.style.display = 'none';
                    }
                });

                if (hasVisibleFile) {
                    chapter.style.display = 'block';
                    if (filter) chapter.classList.add('active'); // Expand on search
                } else {
                    chapter.style.display = 'none';
                }
            });
        });
    }
});
