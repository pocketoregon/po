#!/bin/bash
set -e

cd "$(git rev-parse --show-toplevel)"
FILE="signin.html"

python3 - "$FILE" << 'PYEOF'
import sys

filepath = sys.argv[1]
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

OLD_CSS = """        /* ── ANIMATED BACKGROUND ── */
        .bg-canvas {
            position: fixed;
            inset: 0;
            z-index: -1;
            background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000 100%);
        }

        .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.4;
            animation: move 20s infinite alternate ease-in-out;
        }

        .orb-1 {
            width: 400px; height: 400px;
            background: rgba(249, 115, 22, 0.3); /* Orange */
            top: -100px; left: -100px;
        }

        .orb-2 {
            width: 500px; height: 500px;
            background: rgba(124, 58, 237, 0.2); /* Purple */
            bottom: -150px; right: -150px;
            animation-delay: -5s;
        }

        .orb-3 {
            width: 300px; height: 300px;
            background: rgba(37, 99, 235, 0.2); /* Blue */
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            animation: move-center 25s infinite alternate ease-in-out;
        }

        @keyframes move {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, 50px) scale(1.1); }
        }

        @keyframes move-center {
            0% { transform: translate(-50%, -50%) translate(-30px, -30px); }
            100% { transform: translate(-50%, -50%) translate(30px, 30px); }
        }"""

NEW_CSS = """        /* ── DOT GRID BACKGROUND ── */
        #dot-canvas {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        }"""

OLD_BODY = "        body {\n            font-family: 'Inter', sans-serif;\n            background-color: #000;\n            color: #fff;"
NEW_BODY = "        body {\n            font-family: 'Inter', sans-serif;\n            background-color: #ffffff;\n            color: #1f1e24;"

OLD_HTML = """    <div class="bg-canvas">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
    </div>"""
NEW_HTML = """    <canvas id="dot-canvas"></canvas>"""

OLD_SCRIPT = """    <script>
        const WORKER_URL = 'https://po.pocketoregon.workers.dev';
        const GOOGLE_CLIENT_ID = '930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com';"""

NEW_SCRIPT = """    <script>
        (function() {
            const canvas = document.getElementById('dot-canvas');
            const ctx = canvas.getContext('2d');
            const GAP = 18;
            const DOT_R_IDLE = 1.2;
            const DOT_R_ACTIVE = 2.8;
            const CURSOR_RADIUS = 50;
            const LERP = 0.18;
            let mouse = { x: -9999, y: -9999 };
            let dots = [];
            let animId;
            function buildDots() {
                dots = [];
                const offsetX = (canvas.width % GAP) / 2;
                const offsetY = (canvas.height % GAP) / 2;
                const cols = Math.ceil(canvas.width / GAP) + 1;
                const rows = Math.ceil(canvas.height / GAP) + 1;
                for (let r = 0; r < rows; r++)
                    for (let c = 0; c < cols; c++)
                        dots.push({ x: offsetX + c * GAP, y: offsetY + r * GAP, r: DOT_R_IDLE });
            }
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                buildDots();
            }
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (const d of dots) {
                    const dx = d.x - mouse.x;
                    const dy = d.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const hit = dist <= CURSOR_RADIUS;
                    const target = hit ? DOT_R_ACTIVE : DOT_R_IDLE;
                    d.r += (target - d.r) * LERP;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                    ctx.fillStyle = hit ? '#f97316' : '#d1d5db';
                    ctx.fill();
                }
                animId = requestAnimationFrame(draw);
            }
            window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
            window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
            window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); draw(); });
            resize();
            draw();
        })();

        const WORKER_URL = 'https://po.pocketoregon.workers.dev';
        const GOOGLE_CLIENT_ID = '930005975840-u809k2ldaa6cug4jm82tafb5vahoou4h.apps.googleusercontent.com';"""

changes = 0
for old, new in [(OLD_CSS, NEW_CSS), (OLD_BODY, NEW_BODY), (OLD_HTML, NEW_HTML), (OLD_SCRIPT, NEW_SCRIPT)]:
    if old in content:
        content = content.replace(old, new, 1)
        changes += 1
        print(f"✅ Step {changes} applied")
    else:
        print(f"⚠️  Step {changes+1} pattern not found — skipping")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"\n✅ Done — {changes} changes applied")
PYEOF

git add signin.html
git commit -m "feat(signin): dot grid bg — grey dots grow + turn orange on hover"
git push
echo "✅ Deployed!"
