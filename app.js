// ===================================

// AI音楽 Post Generator - Main Application

// ===================================



class AIPostGenerator {

    constructor() {

        this.artistData = new Map();

        this.posts = [];



        // Month configurations with different column mappings

        this.monthConfigs = {

            'asc': {

                name: 'AI Sound Cypher（ASC）',

                                                spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1y7QLArMG_maSg4wQUt5H8qt1bekFD9-jN5iOau1v5iE/edit?gid=103982788#gid=103982788',

                columns: {

                    artistName: 1,   // B列 - X名（アーティスト名）

                    xHandle: 3,      // D列 - X ID (@~)

                    songTitle: 5,    // F列 - 曲名

                    link: 7,         // H列 - 曲リンク

                    script: 10       // K列 - 台本用コメント

                }

            },

            'chainstream': {

                name: 'Chain Stream（チェンスト）',

                spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1HHYL-_VpXvEszprJs03P10K-nrDp3Xs_u3kmKq63tjU/edit?gid=64942825',

                columns: {

                    artistName: 2,   // C列 - X名（アーティスト名）

                    xHandle: 3,      // D列 - X ID (@~)

                    songTitle: 6,    // G列 - 曲名

                    link: 9,         // J列 - 曲リンク

                    script: [8, 10]  // I列 & K列 - 台本/メッセージ

                }

            }

        };



        // Show Templates with column mappings

        this.showTemplates = {

            asc: {

                name: 'AI Sound Cypher',

                shortName: 'ASC',

                hashtags: '#AIサウンドサイファー #ラジオ川越',

                hasTheme: true,

                copyRange: '全体（A列から）',

                format: (data) => {

                    return `AI Sound Cypher　${data.formattedDate}『${data.theme}』

${this.showTemplates.asc.hashtags}



${data.number}${data.artistName}　　${data.xHandle}

「${data.songTitle}」

${data.link}`;

                }

            },

            chainstream: {

                name: 'Chain Stream',

                shortName: 'チェンスト',

                hashtags: '#チェンスト #ラジオ川越',

                hasTheme: false,

                copyRange: '全体（A列から）',

                format: (data) => {

                    return `【AI音楽アーティストの曲を紹介するコーナー】

『Chain Stream』${data.formattedDate}　${this.showTemplates.chainstream.hashtags}



"${data.songTitle}" by ${data.artistName}（${data.xHandle}）



${data.link}`;

                },

                // 台本フォーマット

                scriptFormat: (data) => {

                    return `${data.script}`;

                }

            }

        };



        // Current month config (will be set based on selector)

        this.currentMonthConfig = null;



        // DOM Elements

        this.elements = {

            showSelect: document.getElementById('showSelect'),

            monthSelect: document.getElementById('monthSelect'),

            spreadsheetUrl: document.getElementById('spreadsheetUrl'),

            spreadsheetId: document.getElementById('spreadsheetId'),

            sheetName: document.getElementById('sheetName'),

            eventDate: document.getElementById('eventDate'),

            eventTheme: document.getElementById('eventTheme'),

            themeGroup: document.getElementById('themeGroup'),

            spreadsheetData: document.getElementById('spreadsheetData'),

            dataStatus: document.getElementById('dataStatus'),

            dataInfo: document.getElementById('dataInfo'),

            setlistInput: document.getElementById('setlistInput'),

            generateBtn: document.getElementById('generateBtn'),

            postsContainer: document.getElementById('postsContainer'),

            copyAllBtn: document.getElementById('copyAllBtn'),

            fetchDataBtn: document.getElementById('fetchDataBtn'),

            loadDataBtn: document.getElementById('loadDataBtn'),

            scriptPanel: document.getElementById('scriptPanel'),

            scriptContainer: document.getElementById('scriptContainer'),

            copyScriptBtn: document.getElementById('copyScriptBtn'),

            toast: document.getElementById('toast')

        };



        this.init();

    }



    init() {

        // Set default date to today

        const today = new Date().toISOString().split('T')[0];

        this.elements.eventDate.value = today;



        // Set default month/sheet

        const keys = Object.keys(this.monthConfigs);

        if (keys.length > 0) {

            this.elements.monthSelect.value = keys[0];

        }



        // Event Listeners

        this.elements.showSelect.addEventListener('change', () => this.onShowChange());

        this.elements.monthSelect.addEventListener('change', () => this.onMonthChange());

        this.elements.spreadsheetUrl.addEventListener('input', () => this.parseSpreadsheetUrl());

        this.elements.spreadsheetData.addEventListener('input', () => this.parseSpreadsheetData());

        this.elements.generateBtn.addEventListener('click', () => this.generatePosts());

        this.elements.copyAllBtn.addEventListener('click', () => this.copyAllPosts());

        this.elements.fetchDataBtn.addEventListener('click', () => this.fetchSpreadsheetData());

        this.elements.loadDataBtn.addEventListener('click', () => this.showLoadInstructions());

        this.elements.copyScriptBtn.addEventListener('click', () => this.copyScript());



        // Load from localStorage if available

        this.loadFromStorage();



        // Initial month and show setup

        this.onMonthChange();

        this.onShowChange();

    }



    // Handle month selection change

    onMonthChange() {

        const selectedMonth = this.elements.monthSelect.value;

        this.currentMonthConfig = this.monthConfigs[selectedMonth];



        if (this.currentMonthConfig) {

            // Update spreadsheet URL

            this.elements.spreadsheetUrl.value = this.currentMonthConfig.spreadsheetUrl;

            this.parseSpreadsheetUrl();



            // Update theme if available

            if (this.currentMonthConfig.theme) {

                this.elements.eventTheme.value = this.currentMonthConfig.theme;

            }



            // Clear existing data when switching months

            this.artistData.clear();

            this.elements.spreadsheetData.value = '';

            this.elements.dataStatus.classList.remove('hidden');

            this.elements.dataInfo.classList.remove('visible');



            this.showToast(`${this.currentMonthConfig.name}のスプレッドシートに切り替えました`);

        }

    }



    // Handle show selection change

    onShowChange() {

        const selectedShow = this.elements.showSelect.value;



        // 自動的に対応するシートを選択

        if (this.monthConfigs[selectedShow]) {

            this.elements.monthSelect.value = selectedShow;

            this.onMonthChange();

        }



        const template = this.showTemplates[selectedShow];



        // Show/hide theme input based on show type

        if (template.hasTheme) {

            this.elements.themeGroup.style.display = 'flex';

        } else {

            this.elements.themeGroup.style.display = 'none';

        }



        // Show/hide script panel based on show type (Chain Stream only)

        if (selectedShow === 'chainstream') {

            this.elements.scriptPanel.style.display = 'block';

        } else {

            this.elements.scriptPanel.style.display = 'none';

        }



        // Clear existing data when switching shows

        this.artistData.clear();

        this.elements.spreadsheetData.value = '';

        this.elements.dataStatus.classList.remove('hidden');

        this.elements.dataInfo.classList.remove('visible');



        // Update placeholder hints

        if (selectedShow === 'chainstream') {

            this.elements.setlistInput.placeholder = `セットリストをペースト...



形式（アーティスト名だけでOK！）:

旧雅之

ろーとP

SynthWave

...`;

        } else {

            this.elements.setlistInput.placeholder = `セットリストをペースト...



形式:

00:00 OP

01:09 Digital Soul Wave_スポットライト

03:09 旧雅之_Electric Light Revolution

...`;

        }



        this.saveToStorage();

    }



    // Parse spreadsheet URL to extract ID and gid

    parseSpreadsheetUrl() {

        const url = this.elements.spreadsheetUrl.value.trim();



        // Extract spreadsheet ID from URL

        // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...

        const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);

        if (idMatch) {

            this.elements.spreadsheetId.value = idMatch[1];

        }



        // Extract gid from URL

        // Format: ...?gid=GID_NUMBER or #gid=GID_NUMBER

        const gidMatch = url.match(/[?&#]gid=(\d+)/);

        if (gidMatch) {

            this.elements.sheetName.value = gidMatch[1];

        }



        this.saveToStorage();

    }



    // Fetch spreadsheet data automatically

    async fetchSpreadsheetData() {

        const spreadsheetId = this.elements.spreadsheetId.value;

        const gid = this.elements.sheetName.value || '0';



        if (!spreadsheetId) {

            this.showToast('スプレッドシートURLを入力してください');

            return;

        }



        // Show loading state

        this.elements.fetchDataBtn.disabled = true;

        this.elements.fetchDataBtn.innerHTML = '<span class="btn-icon">⏳</span> 取得中...';



        try {

            // Direct CSV Export URL

            const googleUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;



            // GAS-based mirror (fallback/proxy)

            const gasProxyUrl = `https://script.google.com/macros/s/AKfycbz_G1Dq8vXp6b7Y_Hj-L17G07w00M1l9vB6qDkz6C7z/exec?url=${encodeURIComponent(googleUrl)}`;



            // List of methods to try

            const corsProxies = [

                gasProxyUrl, // Try GAS proxy first as it's often most reliable for Google Sheets

                `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`,

                `https://corsproxy.io/?${encodeURIComponent(googleUrl)}`,

                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(googleUrl)}`,

                `https://win-cors-anywhere.herokuapp.com/${googleUrl}`

            ];



            let csvText = null;

            let lastError = null;



            for (const proxyUrl of corsProxies) {

                try {

                    const response = await fetch(proxyUrl, {

                        method: 'GET',

                        headers: {

                            'Accept': 'text/csv,text/plain,*/*'

                        }

                    });



                    if (response.ok) {

                        csvText = await response.text();



                        // Check if we got valid CSV data (not an error page)

                        if (csvText && !csvText.includes('<!DOCTYPE') && !csvText.includes('<html')) {

                            break;

                        }

                    }

                } catch (e) {

                    lastError = e;

                    continue;

                }

            }



            if (!csvText || csvText.includes('<!DOCTYPE') || csvText.includes('<html')) {

                throw new Error('データを取得できませんでした');

            }



            // Convert CSV to TSV format (tab-separated) for consistency

            const tsvText = this.csvToTsv(csvText);



            // Set the data and parse it

            this.elements.spreadsheetData.value = tsvText;

            this.parseSpreadsheetData();



            this.showToast('✓ データを自動取得しました！');

        } catch (error) {

            console.error('Fetch error:', error);

            // Show detailed error and fallback instructions

            alert(`自動取得に失敗しました。



【手動でペーストしてください】

1. スプレッドシートを開く

2. Ctrl+A（全選択）

3. Ctrl+C（コピー）

4. このツールのデータ欄にCtrl+V（ペースト）



※スプレッドシートが「リンクを知っている全員が閲覧可」に設定されていても、

　CORSプロキシの問題で取得できない場合があります。`);

        } finally {

            // Reset button state

            this.elements.fetchDataBtn.disabled = false;

            this.elements.fetchDataBtn.innerHTML = '<span class="btn-icon">🔄</span> 自動取得';

        }

    }



    // Convert CSV to TSV format

    csvToTsv(csv) {

        const lines = [];

        let currentLine = '';

        let inQuotes = false;



        for (let i = 0; i < csv.length; i++) {

            const char = csv[i];




            // ROBUSTNESS: If we are at the start of a line, check if it looks like a new entry.
            // If so, force inQuotes to false to prevent a stray quote from swallowining the rest of the file.
            if ((char === '\n' || i === 0)) {
                const checkPos = (char === '\n') ? i + 1 : i;
                const lookAhead = text.substring(checkPos, checkPos + 20);
                const timestampRegex = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/;
                if (timestampRegex.test(lookAhead)) {
                    inQuotes = false; 
                }
            }
            if (char === '"') {

                if (inQuotes && csv[i + 1] === '"') {

                    currentLine += '"';

                    i++;

                } else {

                    inQuotes = !inQuotes;

                }

            } else if (char === ',' && !inQuotes) {

                currentLine += '\t';

            } else if (char === '\n' && !inQuotes) {

                lines.push(currentLine);

                currentLine = '';

            } else if (char !== '\r') {

                currentLine += char;

            }

        }



        if (currentLine) {

            lines.push(currentLine);

        }



        return lines.join('\n');

    }



    // Parse TSV data with quoted fields (handles newlines inside cells)

    parseTsvWithQuotes(text) {

        const rows = [];

        let currentRow = [];

        let currentCell = '';

        let inQuotes = false;



        for (let i = 0; i < text.length; i++) {

            const char = text[i];

            const nextChar = text[i + 1];



            if (char === '"') {

                if (inQuotes && nextChar === '"') {

                    // Escaped quote

                    currentCell += '"';

                    i++;

                } else {

                    // Toggle quote state

                    inQuotes = !inQuotes;

                }

            } else if (char === '\t' && !inQuotes) {

                // End of cell

                currentRow.push(currentCell);

                currentCell = '';

            } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {

                // End of row

                if (char === '\r') i++; // Skip \n after \r

                currentRow.push(currentCell);

                if (currentRow.some(cell => cell.trim())) { // Skip empty rows

                    rows.push(currentRow);

                }

                currentRow = [];

                currentCell = '';

            } else if (char !== '\r') {

                currentCell += char;

            }

        }



        // Don't forget the last cell and row

        if (currentCell || currentRow.length > 0) {

            currentRow.push(currentCell);

            if (currentRow.some(cell => cell.trim())) {

                rows.push(currentRow);

            }

        }



        return rows;

    }



    // Parse pasted spreadsheet data

    parseSpreadsheetData() {

        const rawData = this.elements.spreadsheetData.value.trim();

        if (!rawData) {

            this.artistData.clear();

            this.elements.dataStatus.classList.remove('hidden');

            this.elements.dataInfo.classList.remove('visible');

            return;

        }



        // Get column mapping for selected month (or fallback to default)

        const cols = this.currentMonthConfig?.columns || {

            artistName: 1,

            xHandle: 3,

            songTitle: 4,

            link: 6,

            script: 11

        };



        // Parse TSV data handling quoted fields with newlines

        const rows = this.parseTsvWithQuotes(rawData);

        this.artistData.clear();

        let count = 0;

        let skippedHeader = false;



        rows.forEach((columns, index) => {



            // Skip header row (detect common header patterns - use exact match to avoid false positives)

            const firstCol = columns[0]?.trim().toLowerCase() || '';

            const secondCol = columns[1]?.trim().toLowerCase() || '';



            // Header detection: check for exact header values or very specific patterns

            const headerPatterns = [

                'タイムスタンプ', 'timestamp', 'アーティスト名', 'artist name', 'artist',

                '名前', 'a', 'xのid', 'x id', 'twitter id', 'xアカウント'

            ];

            const isFirstColHeader = headerPatterns.includes(firstCol) ||

                firstCol === 'アーティスト' ||

                firstCol.startsWith('タイムスタンプ');

            const isSecondColHeader = headerPatterns.includes(secondCol) ||

                secondCol === 'アーティスト' ||

                secondCol === 'b';



            if (isFirstColHeader || isSecondColHeader) {

                skippedHeader = true;

                return; // Skip this row

            }



            // Use show-specific column mapping

            if (columns.length >= 3) {

                const artistName = columns[cols.artistName]?.trim();

                const xHandle = columns[cols.xHandle]?.trim() || '';

                const songTitle = columns[cols.songTitle]?.trim() || '';

                const link = columns[cols.link]?.trim() || '';



                // Get script column (supports single index or array of indices)

                let script = '';

                if (Array.isArray(cols.script)) {

                    script = cols.script

                        .map(idx => columns[idx]?.trim() || '')

                        .filter(s => s)

                        .join('\n');

                } else if (cols.script !== undefined) {

                    script = columns[cols.script]?.trim() || '';

                }



                // Skip empty or invalid rows

                if (!artistName || artistName === '' || artistName.toLowerCase() === 'undefined') {

                    return;

                }



                const key = artistName.toLowerCase();

                this.artistData.set(key, {

                    artistName: artistName,

                    xHandle: xHandle,

                    songTitle: songTitle,

                    link: link,

                    script: script,

                    row: index + 1

                });

                count++;



                // Also add with variations for matching

                const simpleName = artistName.replace(/[-_\s]/g, '').toLowerCase();

                if (simpleName !== key) {

                    this.artistData.set(simpleName, {

                        artistName: artistName,

                        xHandle: xHandle,

                        songTitle: songTitle,

                        link: link,

                        script: script,

                        row: index + 1

                    });

                }

            }

        });



        this.elements.dataStatus.classList.add('hidden');

        const headerNote = skippedHeader ? '（ヘッダー行スキップ済）' : '';

        this.elements.dataInfo.textContent = `✓ ${count} 件のアーティストデータを読み込みました${headerNote}`;

        this.elements.dataInfo.classList.add('visible');



        // Save to localStorage

        this.saveToStorage();

    }



    // Find artist in data

    findArtist(searchName) {

        const normalizedSearch = searchName.toLowerCase().trim();



        // Direct match

        if (this.artistData.has(normalizedSearch)) {

            return this.artistData.get(normalizedSearch);

        }



        // Remove special characters and spaces

        const simplifiedSearch = normalizedSearch.replace(/[-_\s　]/g, '');

        if (this.artistData.has(simplifiedSearch)) {

            return this.artistData.get(simplifiedSearch);

        }



        // Partial match - try both directions

        for (const [key, value] of this.artistData) {

            const simplifiedKey = key.replace(/[-_\s　]/g, '');



            // Check if either contains the other

            if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {

                return value;

            }



            // Check simplified versions

            if (simplifiedKey.includes(simplifiedSearch) || simplifiedSearch.includes(simplifiedKey)) {

                return value;

            }

        }



        // Log for debugging

        console.log(`Artist not found: "${searchName}" (normalized: "${normalizedSearch}")`);

        return null;

    }



    // Parse setlist

    parseSetlist(setlistText) {

        const lines = setlistText.trim().split('\n');

        const entries = [];

        const selectedShow = this.elements.showSelect.value;



        lines.forEach((line) => {

            line = line.trim();

            if (!line) return;



            let timestamp = '';

            let rest = line;



            // Check for timestamp format (HH:MM)

            const timeMatch = line.match(/^(\d{1,2}:\d{2})\s+(.+)$/);

            if (timeMatch) {

                timestamp = timeMatch[1];

                rest = timeMatch[2];

            }



            // Skip OP/ED entries

            if (rest.toLowerCase() === 'op' || rest.toLowerCase() === 'ed') {

                return;

            }



            let artistName, songTitle;



            if (selectedShow === 'chainstream') {

                // Chain Stream: artist name only (no underscore needed)

                // Remove any underscore suffix if present

                const parts = rest.split('_');

                artistName = parts[0]?.trim();

                songTitle = ''; // Will be fetched from spreadsheet

            } else {

                // ASC: artist_song format

                const parts = rest.split('_');

                artistName = parts[0]?.trim();

                songTitle = parts.length > 1 ? parts.slice(1).join('_').trim() : '';

            }



            if (artistName) {

                entries.push({

                    timestamp,

                    artistName,

                    songTitle

                });

            }

        });



        return entries;

    }



    // Generate posts

    generatePosts() {

        const setlistText = this.elements.setlistInput.value;

        if (!setlistText.trim()) {

            this.showToast('セットリストを入力してください');

            return;

        }



        const entries = this.parseSetlist(setlistText);

        if (entries.length === 0) {

            this.showToast('有効なセットリストエントリが見つかりません');

            return;

        }



        // Get selected show

        const selectedShow = this.elements.showSelect.value;

        const template = this.showTemplates[selectedShow];



        // Get event info

        const eventDate = this.elements.eventDate.value;

        const eventTheme = this.elements.eventTheme.value || '光・LIGHT';



        // Format date

        const dateObj = new Date(eventDate);

        const month = dateObj.getMonth() + 1;

        const day = dateObj.getDate();

        const formattedDate = `${month}月${day}日`;



        this.posts = [];



        entries.forEach((entry, index) => {

            const artistData = this.findArtist(entry.artistName);



            const number = this.getCircledNumber(index + 1);

            const artistName = artistData?.artistName || entry.artistName;

            const xHandle = artistData?.xHandle || '';

            const songTitle = artistData?.songTitle || entry.songTitle;

            const link = artistData?.link || '';



            // Get script data for Chain Stream (single L column)

            const script = artistData?.script || '';



            // Determine display link based on show type

            let displayLink = link || '☺';



            // ASCでもSuno/Udio以外のリンク（Google Drive等）を許容するように変更

            if (selectedShow === 'asc') {

                displayLink = link || '☺';

            }



            const postText = template.format({

                formattedDate,

                theme: eventTheme,

                number,

                artistName,

                xHandle,

                songTitle,

                link: displayLink

            });



            this.posts.push({

                number: index + 1,

                artistName,

                text: postText,

                script

            });

        });



        this.renderPosts();



        // Generate broadcast script for Chain Stream

        if (selectedShow === 'chainstream') {

            this.generateScript();

        }



        this.showToast(`${this.posts.length} 件のポストを生成しました`);

    }



    // Get circled number character

    getCircledNumber(num) {

        const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',

            '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

        return num <= 20 ? circledNumbers[num - 1] : `(${num})`;

    }



    // Render posts

    renderPosts() {

        if (this.posts.length === 0) {

            this.elements.postsContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">🎤</div>

                    <p>セットリストを入力して「ポスト生成」をクリック</p>

                </div>

            `;

            return;

        }



        this.elements.postsContainer.innerHTML = this.posts.map((post, index) => `

            <div class="post-card" style="animation-delay: ${index * 0.05}s">

                <div class="post-card-header">

                    <div class="post-number">

                        <span class="num">${this.getCircledNumber(post.number)}</span>

                    </div>

                    <span class="post-artist">${post.artistName}</span>

                    <div class="post-actions">

                        <button class="btn btn-copy" data-index="${index}">

                            <span class="btn-icon">📋</span> コピー

                        </button>

                        <button class="btn btn-post-x" data-index="${index}">

                            <span class="btn-icon">𝕏</span> ポスト

                        </button>

                    </div>

                </div>

                <div class="post-card-content">

                    <div class="post-text">${this.escapeHtml(post.text)}</div>

                </div>

            </div>

        `).join('');



        // Add copy event listeners

        this.elements.postsContainer.querySelectorAll('.btn-copy').forEach(btn => {

            btn.addEventListener('click', (e) => {

                const index = parseInt(e.currentTarget.dataset.index);

                this.copyPost(index, e.currentTarget);

            });

        });



        // Add X post event listeners

        this.elements.postsContainer.querySelectorAll('.btn-post-x').forEach(btn => {

            btn.addEventListener('click', (e) => {

                const index = parseInt(e.currentTarget.dataset.index);

                this.openXPost(index);

            });

        });

    }



    // Copy single post

    async copyPost(index, button) {

        const post = this.posts[index];

        if (!post) return;



        try {

            await navigator.clipboard.writeText(post.text);

            button.classList.add('copied');

            button.innerHTML = '<span class="btn-icon">✓</span> コピー済';



            setTimeout(() => {

                button.classList.remove('copied');

                button.innerHTML = '<span class="btn-icon">📋</span> コピー';

            }, 2000);



            this.showToast(`${this.getCircledNumber(post.number)} をコピーしました`);

        } catch (err) {

            this.showToast('コピーに失敗しました');

        }

    }



    // Open X (Twitter) with pre-filled post (also copies to clipboard as backup)

    async openXPost(index) {

        const post = this.posts[index];

        if (!post) return;



        // First copy to clipboard as backup

        try {

            await navigator.clipboard.writeText(post.text);

        } catch (err) {

            // Ignore clipboard errors

        }



        // Then open X

        const encodedText = encodeURIComponent(post.text);

        const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;

        window.open(xUrl, '_blank');

        this.showToast(`${this.getCircledNumber(post.number)} コピー＆Xを開きました`);

    }



    // Copy all posts

    async copyAllPosts() {

        if (this.posts.length === 0) {

            this.showToast('コピーするポストがありません');

            return;

        }



        const allText = this.posts.map(p => p.text).join('\n\n---\n\n');



        try {

            await navigator.clipboard.writeText(allText);

            this.showToast('全てのポストをコピーしました');

        } catch (err) {

            this.showToast('コピーに失敗しました');

        }

    }



    // Generate broadcast script for Chain Stream (only for setlist entries)

    generateScript() {

        if (this.posts.length === 0) {

            this.scriptText = '';

            this.renderScript();

            return;

        }



        this.scriptText = '';

        let scriptParts = [];



        this.posts.forEach((post, index) => {

            const script = post.script || '';



            // Only add if there's script data

            if (script) {

                scriptParts.push(`【${index + 1}曲目】${post.artistName}

${script}`);

            }

        });



        this.scriptText = scriptParts.join('\n\n---\n\n');

        this.renderScript();

    }



    // Render broadcast script

    renderScript() {

        if (!this.scriptText) {

            this.elements.scriptContainer.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">📜</div>

                    <p>台本データがありません（L列が空）</p>

                </div>`;

            return;

        }



        this.elements.scriptContainer.innerHTML = `

            <div class="script-content">

                <pre>${this.escapeHtml(this.scriptText)}</pre>

            </div>`;

    }



    // Copy broadcast script

    async copyScript() {

        if (!this.scriptText) {

            this.showToast('コピーする台本がありません');

            return;

        }



        try {

            await navigator.clipboard.writeText(this.scriptText);

            this.showToast('台本をコピーしました');

        } catch (err) {

            this.showToast('コピーに失敗しました');

        }

    }



    // Escape HTML

    escapeHtml(text) {

        const div = document.createElement('div');

        div.textContent = text;

        return div.innerHTML;

    }



    // Show toast notification

    showToast(message) {

        this.elements.toast.textContent = message;

        this.elements.toast.classList.add('show');



        setTimeout(() => {

            this.elements.toast.classList.remove('show');

        }, 3000);

    }



    // Show load instructions

    showLoadInstructions() {

        const selectedShow = this.elements.showSelect.value;

        const template = this.showTemplates[selectedShow];



        const cols = this.currentMonthConfig?.columns || {

            artistName: 1,

            xHandle: 3,

            songTitle: 5,

            link: 7,

            script: 10

        };



        const getColLetter = (idx) => String.fromCharCode(65 + idx);



        let scriptColInfo = '';

        if (Array.isArray(cols.script)) {

            scriptColInfo = `• ${cols.script.map(idx => getColLetter(idx)).join('・')}列 → 台本/感想`;

        } else if (cols.script !== undefined) {

            scriptColInfo = `• ${getColLetter(cols.script)}列 → 台本/感想`;

        }



        const columnInfo = `• ${getColLetter(cols.artistName)}列 → アーティスト名

• ${getColLetter(cols.xHandle)}列 → Xハンドル

• ${getColLetter(cols.songTitle)}列 → 曲名

• ${getColLetter(cols.link)}列 → 曲リンク

${scriptColInfo}`;



        const instructions = `【データ読込方法】- ${template.name}



⚠️ 設定変更後は「自動取得」を再度実行してください。



📋 簡単3ステップ:



1. Googleスプレッドシートを開く

2. 全体を選択してコピー（Ctrl+A → Ctrl+C）

   ※ヘッダー行も含めてOK（自動でスキップ）

3. このページの入力エリアにペースト（Ctrl+V）



現在の列設定:

${columnInfo}`;



        alert(instructions);

    }



    // Save to localStorage

    saveToStorage() {

        const data = {

            spreadsheetData: this.elements.spreadsheetData.value,

            spreadsheetUrl: this.elements.spreadsheetUrl.value,

            eventTheme: this.elements.eventTheme.value,

            showSelect: this.elements.showSelect.value

        };

        localStorage.setItem('aiPostGenerator', JSON.stringify(data));

    }



    // Load from localStorage

    loadFromStorage() {

        const saved = localStorage.getItem('aiPostGenerator');

        if (saved) {

            try {

                const data = JSON.parse(saved);

                if (data.spreadsheetData) {

                    this.elements.spreadsheetData.value = data.spreadsheetData;

                    this.parseSpreadsheetData();

                }

                if (data.spreadsheetUrl) {

                    this.elements.spreadsheetUrl.value = data.spreadsheetUrl;

                    this.parseSpreadsheetUrl();

                }

                if (data.eventTheme) {

                    this.elements.eventTheme.value = data.eventTheme;

                }

                if (data.showSelect) {

                    this.elements.showSelect.value = data.showSelect;

                }

            } catch (e) {

                console.error('Failed to load from storage:', e);

            }

        }

    }



    // Escape HTML

    escapeHtml(text) {

        const div = document.createElement('div');

        div.textContent = text;

        return div.innerHTML;

    }

}



// Initialize app

document.addEventListener('DOMContentLoaded', () => {

    window.aiApp = new AIPostGenerator();

});



