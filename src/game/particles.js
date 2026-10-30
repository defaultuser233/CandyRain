import { COLORS } from './config.js';

const MAX_PARTICLES = 240;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function createParticles() {
  const particles = [];

  function add(p) {
    particles.push(p);
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  function emitCandy(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(70, 230);
      const life = rand(0.35, 0.65);
      add({
        kind: 'spark',
        shape: Math.random() < 0.55 ? 'star' : 'dot',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        gravity: 420,
        life,
        maxLife: life,
        size: rand(2, 3.6),
        color: Math.random() < 0.25 ? COLORS.white : color,
        rotation: Math.random() * Math.PI,
      });
    }
  }

  function emitBomb(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(30, 110);
      const life = rand(0.5, 0.9);
      add({
        kind: 'smoke',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life,
        maxLife: life,
        size: rand(8, 18),
      });
    }
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(120, 340);
      const life = rand(0.25, 0.55);
      add({
        kind: 'spark',
        shape: 'dot',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        gravity: 500,
        life,
        maxLife: life,
        size: rand(2, 4.4),
        color: Math.random() < 0.4 ? COLORS.orangeBright : COLORS.red,
        rotation: 0,
      });
    }
    add({
      kind: 'ring',
      x,
      y,
      life: 0.4,
      maxLife: 0.4,
      radius: 10,
      color: COLORS.red,
    });
  }

  function emitText(x, y, text, color = COLORS.white) {
    add({
      kind: 'text',
      x,
      y,
      vy: -78,
      life: 0.85,
      maxLife: 0.85,
      text,
      color,
    });
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;

      if (p.kind === 'text') {
        p.y += p.vy * dt;
        p.vy *= 1 - dt * 1.6;
      } else if (p.kind === 'ring') {
        p.radius += 260 * dt;
      } else if (p.kind === 'smoke') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - dt * 1.2;
        p.vy *= 1 - dt * 1.2;
        p.size += 14 * dt;
      } else {
        p.vy += (p.gravity || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += dt * 6;
      }

      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawStar(ctx, radius) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function draw(ctx) {
    ctx.save();
    for (const p of particles) {
      const progress = Math.max(0, p.life / p.maxLife);

      if (p.kind === 'ring') {
        ctx.globalAlpha = progress * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * progress + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }

      if (p.kind === 'smoke') {
        ctx.globalAlpha = progress * 0.28;
        ctx.fillStyle = '#120B06';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (p.kind === 'text') {
        ctx.globalAlpha = Math.min(1, progress * 2);
        ctx.font = '900 20px "YouYuan", "幼圆", "Comic Sans MS", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(5, 7, 15, 0.8)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        continue;
      }

      ctx.globalAlpha = progress;
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        drawStar(ctx, p.size * 2.4);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function clear() {
    particles.length = 0;
  }

  return {
    emitCandy,
    emitBomb,
    emitText,
    update,
    draw,
    clear,
    get count() {
      return particles.length;
    },
  };
}
