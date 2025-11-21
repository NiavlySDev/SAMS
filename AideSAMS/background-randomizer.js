// Système de randomisation des arrière-plans
class BackgroundRandomizer {
    constructor() {
        // 9 images: 1.png à 8.png + urgence.png
        this.backgrounds = [
            'images/background/1.png',
            'images/background/2.png',
            'images/background/3.png',
            'images/background/4.png',
            'images/background/5.png',
            'images/background/6.png',
            'images/background/7.png',
            'images/background/8.png',
            'images/background/urgence.png'
        ];
    }

    getRandomBackground() {
        return this.backgrounds[Math.floor(Math.random() * this.backgrounds.length)];
    }

    applyRandomBackground() {
        const randomBg = this.getRandomBackground();
        
        // Mettre à jour le pseudo-élément body::before
        let style = document.getElementById('random-bg-style');
        
        if (!style) {
            style = document.createElement('style');
            style.id = 'random-bg-style';
            document.head.appendChild(style);
        }
        
        style.textContent = `
            body::before {
                background-image: url('${randomBg}') !important;
            }
        `;
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    const randomizer = new BackgroundRandomizer();
    randomizer.applyRandomBackground();
});
