class BaccaratTrainer {
    constructor() {
        this.cards = [];
        this.currentHand = {
            player: [],
            banker: []
        };
        this.scores = {
            correct: 0,
            incorrect: 0,
            hands: 0
        };
        this.currentQuestion = null;
        this.initializeCards();
        this.setupEventListeners();
        this.startNewHand();
    }

    initializeCards() {
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
        for (const suit of suits) {
            for (const value of values) {
                this.cards.push({ suit, value });
            }
        }
    }

    setupEventListeners() {
        document.getElementById('options').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.handleAnswer(e.target.dataset.answer);
            }
        });
    }

    getCardValue(card) {
        if (['T', 'J', 'Q', 'K'].includes(card.value)) return 0;
        if (card.value === 'A') return 1;
        return parseInt(card.value);
    }

    calculateHandValue(hand) {
        return hand.reduce((sum, card) => (sum + this.getCardValue(card)) % 10, 0);
    }

    dealCard() {
        const index = Math.floor(Math.random() * this.cards.length);
        return this.cards[index];
    }

    displayCard(card, position) {
        const cardElement = document.getElementById(position);
        cardElement.innerHTML = `<img src="../images/${card.suit}${card.value}.png" alt="${card.value} of ${card.suit}">`;
    }

    clearCards() {
        const positions = ['player-card-1', 'player-card-2', 'player-card-3',
                          'banker-card-1', 'banker-card-2', 'banker-card-3'];
        positions.forEach(pos => {
            document.getElementById(pos).innerHTML = '';
        });
    }

    updateScores() {
        document.getElementById('correct').textContent = this.scores.correct;
        document.getElementById('incorrect').textContent = this.scores.incorrect;
        document.getElementById('hands').textContent = this.scores.hands;
    }

    startNewHand() {
        this.clearCards();
        this.currentHand = {
            player: [this.dealCard(), this.dealCard()],
            banker: [this.dealCard(), this.dealCard()]
        };

        // Display initial cards
        this.displayCard(this.currentHand.player[0], 'player-card-1');
        this.displayCard(this.currentHand.player[1], 'player-card-2');
        this.displayCard(this.currentHand.banker[0], 'banker-card-1');
        this.displayCard(this.currentHand.banker[1], 'banker-card-2');

        this.askNaturalQuestion();
    }

    askNaturalQuestion() {
        const playerValue = this.calculateHandValue(this.currentHand.player);
        const bankerValue = this.calculateHandValue(this.currentHand.banker);
        
        this.currentQuestion = {
            type: 'natural',
            correctAnswer: this.getNaturalOutcome(playerValue, bankerValue)
        };

        document.getElementById('question').textContent = 
            'Check for naturals (8 or 9). What is the outcome?';
        
        const options = [
            'Player Wins Natural',
            'Banker Wins Natural',
            'Natural Tie',
            'No Naturals'
        ];

        this.displayOptions(options);
    }

    getNaturalOutcome(playerValue, bankerValue) {
        if (playerValue >= 8 || bankerValue >= 8) {
            if (playerValue === bankerValue) return 'Natural Tie';
            if (playerValue > bankerValue) return 'Player Wins Natural';
            return 'Banker Wins Natural';
        }
        return 'No Naturals';
    }

    shouldPlayerDraw(playerValue) {
        return playerValue <= 5;
    }

    shouldBankerDraw(bankerValue, playerThirdCard) {
        if (playerThirdCard === undefined) {
            return bankerValue <= 5;
        }

        if (bankerValue <= 2) return true;
        if (bankerValue === 3) return playerThirdCard !== 8;
        if (bankerValue === 4) return [2, 3, 4, 5, 6, 7].includes(playerThirdCard);
        if (bankerValue === 5) return [4, 5, 6, 7].includes(playerThirdCard);
        if (bankerValue === 6) return [6, 7].includes(playerThirdCard);
        return false;
    }

    askPlayerDrawQuestion() {
        const playerValue = this.calculateHandValue(this.currentHand.player);
        const shouldDraw = this.shouldPlayerDraw(playerValue);
        
        this.currentQuestion = {
            type: 'playerDraw',
            correctAnswer: shouldDraw ? 'Card for Player' : 'No Card for Player'
        };

        document.getElementById('question').textContent = 
            'Should the Player draw a third card?';
        
        this.displayOptions(['Card for Player', 'No Card for Player']);
    }

    askBankerDrawQuestion() {
        const bankerValue = this.calculateHandValue(this.currentHand.banker);
        const playerThirdCard = this.currentHand.player[2] ? 
            this.getCardValue(this.currentHand.player[2]) : undefined;
        
        const shouldDraw = this.shouldBankerDraw(bankerValue, playerThirdCard);
        
        this.currentQuestion = {
            type: 'bankerDraw',
            correctAnswer: shouldDraw ? 'Card for Banker' : 'No Card for Banker'
        };

        document.getElementById('question').textContent = 
            'Should the Banker draw a third card?';
        
        this.displayOptions(['Card for Banker', 'No Card for Banker']);
    }

    askFinalOutcome() {
        const playerValue = this.calculateHandValue(this.currentHand.player);
        const bankerValue = this.calculateHandValue(this.currentHand.banker);
        
        let correctAnswer;
        if (playerValue === bankerValue) correctAnswer = 'Tie';
        else if (playerValue > bankerValue) correctAnswer = 'Player Wins';
        else correctAnswer = 'Banker Wins';

        this.currentQuestion = {
            type: 'finalOutcome',
            correctAnswer
        };

        document.getElementById('question').textContent = 
            'What is the final outcome?';
        
        this.displayOptions(['Player Wins', 'Banker Wins', 'Tie']);
    }

    displayOptions(options) {
        const optionsContainer = document.getElementById('options');
        optionsContainer.innerHTML = options.map(option => 
            `<button data-answer="${option}">${option}</button>`
        ).join('');
    }

    handleAnswer(answer) {
        if (answer === this.currentQuestion.correctAnswer) {
            this.scores.correct++;
            this.handleCorrectAnswer();
        } else {
            this.scores.incorrect++;
        }
        this.updateScores();
    }

    handleCorrectAnswer() {
        switch (this.currentQuestion.type) {
            case 'natural':
                if (this.currentQuestion.correctAnswer === 'No Naturals') {
                    this.askPlayerDrawQuestion();
                } else {
                    this.completeHand();
                }
                break;
            
            case 'playerDraw':
                if (this.currentQuestion.correctAnswer === 'Card for Player') {
                    const card = this.dealCard();
                    this.currentHand.player.push(card);
                    this.displayCard(card, 'player-card-3');
                }
                this.askBankerDrawQuestion();
                break;
            
            case 'bankerDraw':
                if (this.currentQuestion.correctAnswer === 'Card for Banker') {
                    const card = this.dealCard();
                    this.currentHand.banker.push(card);
                    this.displayCard(card, 'banker-card-3');
                }
                this.askFinalOutcome();
                break;
            
            case 'finalOutcome':
                this.completeHand();
                break;
        }
    }

    completeHand() {
        this.scores.hands++;
        this.updateScores();
        setTimeout(() => this.startNewHand(), 1500);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new BaccaratTrainer();
});
