document.addEventListener('DOMContentLoaded', () => {
    // Game Assets
    const EMOJIS = {
        easy: ['🚀', '🛸', '👾', '🪐', '☄️', '🌟', '🤖', '🛰️'],
        medium: [
            '🚀', '🛸', '👾', '🪐', '☄️', '🌟', '🤖', '🛰️', 
            '🌌', '🌍', '🌞', '🌙', '🧬', '🔮', '🔬', '🔭', '🔋', '📡'
        ]
    };

    // Game State
    let difficulty = 'easy'; // 'easy' or 'medium'
    let cards = [];
    let flippedCards = [];
    let matchedCount = 0;
    let moves = 0;
    let timeElapsed = 0; // in seconds
    let timerInterval = null;
    let gameStarted = false;
    let boardLocked = false;
    let leaderboardData = { easy: [], medium: [] };
    let currentTab = 'easy';

    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const timeVal = document.getElementById('time-val');
    const movesVal = document.getElementById('moves-val');
    const matchesVal = document.getElementById('matches-val');
    const restartBtn = document.getElementById('restart-btn');
    const diffButtons = document.querySelectorAll('.diff-btn');
    
    // Leaderboard Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // Modal Elements
    const victoryModal = document.getElementById('victory-modal');
    const modalMoves = document.getElementById('modal-moves');
    const modalTime = document.getElementById('modal-time');
    const scoreForm = document.getElementById('score-form');
    const usernameInput = document.getElementById('username');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Initialize Game
    init();

    function init() {
        setupEventListeners();
        loadLeaderboard();
        startNewGame();
    }

    function setupEventListeners() {
        // Restart game button
        restartBtn.addEventListener('click', startNewGame);

        // Difficulty selector buttons
        diffButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedDiff = e.currentTarget.getAttribute('data-difficulty');
                if (selectedDiff !== difficulty) {
                    difficulty = selectedDiff;
                    diffButtons.forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    // Update board CSS classes
                    gameBoard.className = `board ${difficulty}-grid`;
                    startNewGame();
                }
            });
        });

        // Leaderboard tabs
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                currentTab = targetTab;
                tabButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderLeaderboard();
            });
        });

        // Submit Score Form
        scoreForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitScore();
        });

        // Modal Close Button
        modalCloseBtn.addEventListener('click', () => {
            victoryModal.classList.remove('show');
        });
    }

    // Start a fresh game state
    function startNewGame() {
        // Reset state variables
        clearInterval(timerInterval);
        timerInterval = null;
        gameStarted = false;
        boardLocked = false;
        flippedCards = [];
        matchedCount = 0;
        moves = 0;
        timeElapsed = 0;

        // Reset display stats
        timeVal.textContent = '00:00';
        movesVal.textContent = '0';
        updateMatchCounter();

        // Generate and shuffle deck
        const symbols = [...EMOJIS[difficulty], ...EMOJIS[difficulty]];
        shuffleArray(symbols);
        cards = symbols.map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isFlipped: false,
            isMatched: false
        }));

        // Render board
        renderBoard();
    }

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Render Cards in HTML Grid
    function renderBoard() {
        gameBoard.innerHTML = '';
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('card');
            cardEl.setAttribute('data-id', card.id);

            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back">
                        <i class="fa-solid fa-question"></i>
                    </div>
                    <div class="card-face card-front">
                        ${card.symbol}
                    </div>
                </div>
            `;

            cardEl.addEventListener('click', () => handleCardClick(card.id));
            gameBoard.appendChild(cardEl);
        });
    }

    // Handle Card Click Action
    function handleCardClick(cardId) {
        if (boardLocked) return;
        
        const card = cards.find(c => c.id === cardId);
        
        // Prevent flipping matched or already flipped cards
        if (card.isMatched || card.isFlipped) return;

        // Start timer on first card click
        if (!gameStarted) {
            gameStarted = true;
            startTimer();
        }

        // Flip card visually and in state
        const cardEl = gameBoard.querySelector(`[data-id="${cardId}"]`);
        cardEl.classList.add('flipped');
        card.isFlipped = true;
        flippedCards.push(card);

        // Check matching when 2 cards are flipped
        if (flippedCards.length === 2) {
            moves++;
            movesVal.textContent = moves;
            checkMatch();
        }
    }

    // Compare the two flipped cards
    function checkMatch() {
        boardLocked = true;
        const [card1, card2] = flippedCards;

        if (card1.symbol === card2.symbol) {
            // Match found
            setTimeout(() => {
                const el1 = gameBoard.querySelector(`[data-id="${card1.id}"]`);
                const el2 = gameBoard.querySelector(`[data-id="${card2.id}"]`);
                
                el1.classList.add('matched');
                el2.classList.add('matched');
                
                card1.isMatched = true;
                card2.isMatched = true;

                matchedCount++;
                updateMatchCounter();
                flippedCards = [];
                boardLocked = false;

                // Check Victory
                if (matchedCount === EMOJIS[difficulty].length) {
                    handleVictory();
                }
            }, 300);
        } else {
            // No match
            setTimeout(() => {
                const el1 = gameBoard.querySelector(`[data-id="${card1.id}"]`);
                const el2 = gameBoard.querySelector(`[data-id="${card2.id}"]`);
                
                el1.classList.remove('flipped');
                el2.classList.remove('flipped');
                
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                flippedCards = [];
                boardLocked = false;
            }, 1000);
        }
    }

    // Game Timer Loop
    function startTimer() {
        timerInterval = setInterval(() => {
            timeElapsed++;
            timeVal.textContent = formatTime(timeElapsed);
        }, 1000);
    }

    // Helper: format seconds to MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Update matches count display
    function updateMatchCounter() {
        const maxMatches = EMOJIS[difficulty].length;
        matchesVal.textContent = `${matchedCount}/${maxMatches}`;
    }

    // Trigger Win Sequence
    function handleVictory() {
        clearInterval(timerInterval);
        
        // Show victory modal details
        modalMoves.textContent = moves;
        modalTime.textContent = formatTime(timeElapsed);
        
        // Reset input form
        usernameInput.value = '';
        
        // Open modal
        setTimeout(() => {
            victoryModal.classList.add('show');
        }, 500);
    }

    // Leaderboard Fetching (GET API)
    function loadLeaderboard() {
        fetch('/api/scores')
            .then(res => res.json())
            .then(data => {
                leaderboardData = data;
                renderLeaderboard();
            })
            .catch(err => {
                console.error('Leaderboard load failed:', err);
                leaderboardBody.innerHTML = `<tr><td colspan="4" class="no-records">読み込み失敗しました。</td></tr>`;
            });
    }

    // Render leaderboard table based on active tab
    function renderLeaderboard() {
        const scores = leaderboardData[currentTab] || [];
        leaderboardBody.innerHTML = '';

        if (scores.length === 0) {
            leaderboardBody.innerHTML = `<tr><td colspan="4" class="no-records">スコア記録がありません。一番乗りを目指そう！</td></tr>`;
            return;
        }

        scores.forEach((score, index) => {
            const tr = document.createElement('tr');
            
            // Format rank styling
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            else if (index === 1) rankClass = 'rank-2';
            else if (index === 2) rankClass = 'rank-3';

            tr.innerHTML = `
                <td class="${rankClass}">${index + 1}</td>
                <td>${escapeHtml(score.username)}</td>
                <td>${score.moves}回</td>
                <td>${formatTime(score.time)}</td>
            `;
            leaderboardBody.appendChild(tr);
        });
    }

    // Leaderboard Submission (POST API)
    function submitScore() {
        const username = usernameInput.value.trim();
        if (!username) return;

        const scorePayload = {
            username: username,
            difficulty: difficulty,
            moves: moves,
            time: timeElapsed
        };

        fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scorePayload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                victoryModal.classList.remove('show');
                loadLeaderboard(); // reload high scores
            } else {
                alert('スコアの保存に失敗しました。');
            }
        })
        .catch(err => {
            console.error('Score submission error:', err);
            alert('通信エラーによりスコアが保存できませんでした。');
        });
    }

    // Safe HTML Escaping for Usernames
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
