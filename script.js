const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const missedEl = document.getElementById('missed');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');

let width = 0;
let height = 0;
let score = 0;
let missed = 0;
let maxMissed = 3;
let gameOver = false;
let fruits = [];
let particles = [];
let lastSpawn = 0;
let spawnInterval = 1000;
let pointer = { x: 0, y: 0 };

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
});

function updateUI() {
    scoreEl.textContent = `Score: ${score}`;
    missedEl.textContent = `Missed: ${missed}`;
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function getFruitColor() {
    const colors = ['#ff5f57', '#ffb703', '#7bd389', '#ff9f1c', '#ff6b6b', '#6c5ce7'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function spawnFruit() {
    if (gameOver) return;

    const radius = randomBetween(20, 32);
    const x = randomBetween(radius, width - radius);
    const y = -radius - 10;
    const dx = randomBetween(-2.3, 2.3);
    const dy = randomBetween(3.8, 6.5);

    fruits.push({
        x,
        y,
        radius,
        color: getFruitColor(),
        dx,
        dy,
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.08, 0.08),
        sliced: false,
        sliceTime: 0,
        isBomb: false,
    });
}

function createSliceEffect(x, y, color) {
    for (let i = 0; i < 16; i++) {
        particles.push({
            x,
            y,
            vx: randomBetween(-5, 5),
            vy: randomBetween(-5, 5),
            radius: randomBetween(2, 5),
            color,
            life: 1,
            decay: randomBetween(0.02, 0.04),
        });
    }
}

function detectSlice(fruit) {
    const dx = pointer.x - fruit.x;
    const dy = pointer.y - fruit.y;
    const distance = Math.hypot(dx, dy);
    return distance < fruit.radius + 12;
}

function cutFruit(index) {
    const fruit = fruits[index];
    if (!fruit || fruit.sliced) return;

    fruit.sliced = true;
    fruit.sliceTime = 0.4;
    score += 10;
    updateUI();
    createSliceEffect(fruit.x, fruit.y, fruit.color);
}

function updateFruits(delta) {
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];

        if (fruit.sliced) {
            fruit.sliceTime -= delta;
            if (fruit.sliceTime <= 0) {
                fruits.splice(i, 1);
            }
            continue;
        }

        fruit.x += fruit.dx;
        fruit.y += fruit.dy;
        fruit.dy += 0.12;
        fruit.rotation += fruit.rotationSpeed;

        if (detectSlice(fruit)) {
            cutFruit(i);
            continue;
        }

        if (fruit.y - fruit.radius > height) {
            fruits.splice(i, 1);
            missed += 1;
            updateUI();

            if (missed >= maxMissed) {
                endGame();
            }
        }
    }
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawFruit(fruit) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);

    ctx.beginPath();
    ctx.fillStyle = fruit.color;
    ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.arc(-fruit.radius * 0.28, -fruit.radius * 0.28, fruit.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#3c2d1d';
    ctx.lineWidth = 2;
    ctx.moveTo(-fruit.radius * 0.15, 0);
    ctx.lineTo(fruit.radius * 0.55, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#3c2d1d';
    ctx.arc(-fruit.radius * 0.7, 0, 3, 0, Math.PI * 2);
    ctx.arc(fruit.radius * 0.7, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawSlicedFruit(fruit) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);

    // Left half
    ctx.beginPath();
    ctx.moveTo(-fruit.radius, -fruit.radius);
    ctx.arc(0, 0, fruit.radius, -Math.PI/2, Math.PI/2, false);
    ctx.closePath();
    ctx.fillStyle = fruit.color;
    ctx.fill();

    // Right half
    ctx.beginPath();
    ctx.moveTo(fruit.radius, -fruit.radius);
    ctx.arc(0, 0, fruit.radius, Math.PI/2, -Math.PI/2, false);
    ctx.closePath();
    ctx.fillStyle = fruit.color;
    ctx.fill();

    ctx.restore();
}

function drawParticles() {
    particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function render() {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#dff3ff');
    gradient.addColorStop(1, '#eafaf1');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    fruits.forEach((fruit) => {
        if (fruit.sliced) {
            drawSlicedFruit(fruit);
        } else {
            drawFruit(fruit);
        }
    });

    drawParticles();
}

function endGame() {
    gameOver = true;
    finalScoreEl.textContent = `Final Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

let lastTime = 0;

function gameLoop(timestamp) {
    const delta = Math.min(32, timestamp - lastTime || 16);
    lastTime = timestamp;

    if (!gameOver) {
        if (timestamp - lastSpawn >= spawnInterval) {
            spawnFruit();
            lastSpawn = timestamp;
        }

        updateFruits(delta / 1000);
        updateParticles(delta / 1000);
    }

    render();
    requestAnimationFrame(gameLoop);
}

resizeCanvas();
updateUI();
requestAnimationFrame(gameLoop);
