
document.addEventListener('DOMContentLoaded', function() {
    initBackground();
});

function initBackground() {
    const shapes = document.querySelectorAll('.bg-shape');
    if (!shapes.length) return;
    
    shapes.forEach((shape, index) => {
        animateShape(shape, index);
    });
    
    document.addEventListener('mousemove', function(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const moveX = (mouseX - 0.5) * (index === 0 ? 40 : 20);
            const moveY = (mouseY - 0.5) * (index === 0 ? 40 : 20);
            
            shape.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });
    
    createFloatingDots();
}

function animateShape(shape, index) {
    let x = 0;
    let y = 0;
    let xDir = Math.random() > 0.5 ? 1 : -1;
    let yDir = Math.random() > 0.5 ? 1 : -1;
    const speed = 0.2 + Math.random() * 0.3;
    
    function move() {
        x += xDir * speed;
        y += yDir * speed;
        
        if (Math.abs(x) > 20) xDir *= -1;
        if (Math.abs(y) > 20) yDir *= -1;
        
        shape.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(move);
    }
    
    move();
}

function createFloatingDots() {
    const background = document.querySelector('.app-background');
    if (!background) return;
    
    for (let i = 0; i < 20; i++) {
        const dot = document.createElement('div');
        dot.className = 'floating-dot';
        dot.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: ${Math.random() > 0.5 ? 'rgba(67, 97, 238, 0.3)' : 'rgba(114, 9, 183, 0.3)'};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 5}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
        `;
        background.appendChild(dot);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% {
                transform: translate(0, 0);
                opacity: 0.3;
            }
            50% {
                transform: translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px);
                opacity: 0.1;
            }
        }
    `;
    document.head.appendChild(style);
}