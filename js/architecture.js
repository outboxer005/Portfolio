/* One isolated, lazy WebGL scene. HTML controls and the static diagram work without it. */
(function () {
  'use strict';
  const container = document.getElementById('architecture');
  if (!container) return;
  const stage = document.getElementById('architectureStage');
  const buttons = [...container.querySelectorAll('[data-node]')];
  const detail = document.getElementById('nodeDetail');
  const roles = {
    agents: ['COMPUTER A', 'Collect local signals, not guesses.', 'Python psutil agents collect CPU, memory, disk, network, process and host telemetry. The collection interval is configurable; retries are bounded. The current public telemetry agent uses linear retry delays.'],
    hosts: ['COMPUTER B', 'A shared protocol across computers.', 'Each monitored computer runs an agent that reports to the central FastAPI controller. Agent requests use X-Agent-Key when API-key authentication is configured. These animated computers are illustrative, not real connected hosts.'],
    controller: ['CONTROLLER', 'One controller, a shared operational picture.', 'The central FastAPI service aggregates telemetry and exposes device status, metrics and incident updates through REST APIs and WebSockets. JWT authenticates users; a configured API key authenticates agents.'],
    database: ['PERSISTENCE', 'Keep the context alongside the signal.', 'PostgreSQL stores devices, metrics, alerts, incidents and analysis. SQLAlchemy models and Alembic migrations manage persistence. Historical incident resolutions can be retrieved alongside runbooks.'],
    incidents: ['INCIDENT ENGINE', 'Repeated signals become one investigation.', 'Repeated-breach filtering avoids reacting to isolated spikes. Deduplication, severity escalation and correlation maintain incident workflows rather than a flood of unrelated alerts.'],
    rag: ['ASYNC RAG', 'Explain an incident without delaying ingestion.', 'Background analysis retrieves runbooks and historical incident resolutions, then grounds optional LLM analysis in that context. LLM work stays outside the telemetry ingestion response path.'],
    zapfix: ['ZAPFIX / INTEGRATION DIRECTION', 'Close the loop with execution feedback.', 'The owner-described ZapFix desktop/terminal integration supports remote commands with execution status and feedback. This integration is not evidenced in the linked public source. Cyan paths illustrate that direction; no commands are executed here.']
  };
  let selected = 'controller';
  let sceneApi = null;
  function select(button) {
    selected = button.dataset.node;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const [label, title, text] = roles[selected];
    const index = document.createElement('span'); index.className = 'detail-index'; index.textContent = `SELECTED / ${label}`;
    const heading = document.createElement('h4'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    detail.replaceChildren(index, heading, paragraph);
    sceneApi?.draw();
  }
  const click = event => { const button = event.target.closest('[data-node]'); if (button) select(button); };
  const keydown = event => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (i + (['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next].focus(); select(buttons[next]);
  };
  container.addEventListener('click', click);
  container.addEventListener('keydown', keydown);
  let visible = false, failed = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const moving = () => visible && !document.hidden && !reduce.matches && document.documentElement.dataset.motion !== 'paused';
  const sync = () => {
    if (visible && !sceneApi && !failed && typeof THREE !== 'undefined') {
      try { sceneApi = createScene(); }
      catch { failed = true; container.classList.remove('webgl-ready'); }
    }
    sceneApi?.sync();
  };
  const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {rootMargin: '120px'});
  io.observe(container);
  window.addEventListener('portfolio:motion', sync);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);

  function createScene() {
    const canvas = document.getElementById('architectureCanvas');
    const renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: false, powerPreference: 'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 720 ? 1.25 : 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    camera.position.set(0, 0, 15);
    const group = new THREE.Group(); scene.add(group);
    const objects = [], lines = [], packets = [];
    const geometries = new Set(), materials = new Set();
    const amber = new THREE.Color(), cyan = new THREE.Color('#67a6b5');
    let frame = 0, phase = 0, lastTime = 0, width = 1, height = 1, disposed = false;
    const geom = g => { geometries.add(g); return g; };
    const mat = m => { materials.add(m); return m; };
    buttons.forEach(button => {
      const box = new THREE.BoxGeometry(.65, .42, .5);
      geom(box);
      const fill = new THREE.Mesh(box, mat(new THREE.MeshBasicMaterial({color: 0xffb020, transparent: true, opacity: .12})));
      const edges = new THREE.LineSegments(geom(new THREE.EdgesGeometry(box)), mat(new THREE.LineBasicMaterial({color: 0xffb020, transparent:true, opacity:.5})));
      fill.add(edges); group.add(fill); objects.push({button, fill, edges});
    });
    const paths = [[0,2],[1,2],[2,3],[2,4],[4,5],[2,6],[6,0]];
    paths.forEach(([a,b], index) => {
      const geometry = geom(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]));
      const line = new THREE.Line(geometry, mat(new THREE.LineBasicMaterial({color: index > 4 ? cyan : 0xffb020, transparent:true, opacity:.3})));
      group.add(line); lines.push({line,a,b});
      const packet = new THREE.Mesh(geom(new THREE.SphereGeometry(.035,6,4)), mat(new THREE.MeshBasicMaterial({color: index > 4 ? cyan : 0xffb020})));
      group.add(packet); packets.push({mesh:packet,a,b,offset:index / paths.length});
    });
    function resize() {
      if (disposed) return;
      width = stage.clientWidth; height = stage.clientHeight;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      const extentY = Math.tan(THREE.MathUtils.degToRad(19)) * 15;
      const stageRect = stage.getBoundingClientRect();
      objects.forEach(({button,fill}) => {
        const r = button.getBoundingClientRect();
        fill.position.set(((r.left + r.width/2 - stageRect.left)/width * 2 - 1) * extentY * camera.aspect, (1 - (r.top + r.height/2 - stageRect.top)/height * 2) * extentY + 1.15, -.3);
        fill.rotation.set(.45, .6, 0);
      });
      lines.forEach(({line,a,b}) => { line.geometry.setFromPoints([objects[a].fill.position, objects[b].fill.position]); });
      draw();
    }
    function draw() {
      if (disposed || !visible || document.hidden) return;
      const light = document.documentElement.dataset.theme === 'light';
      amber.set(light ? '#885400' : '#ffb020');
      objects.forEach(({button,fill,edges}) => {
        fill.material.color.copy(amber); edges.material.color.copy(amber);
        fill.material.opacity = button.dataset.node === selected ? .32 : .09;
        edges.material.opacity = button.dataset.node === selected ? .95 : .4;
      });
      lines.forEach(({line},index) => line.material.color.copy(index > 4 ? cyan : amber));
      packets.forEach(({mesh,a,b,offset},index) => {
        mesh.position.lerpVectors(objects[a].fill.position, objects[b].fill.position, (phase * .18 + offset) % 1);
        mesh.material.color.copy(index > 4 ? cyan : amber);
      });
      renderer.render(scene,camera);
    }
    function tick(time) {
      frame = 0;
      if (!moving() || disposed) return;
      phase += lastTime ? Math.min((time - lastTime)/1000,.05) : 0; lastTime = time;
      draw(); frame = requestAnimationFrame(tick);
    }
    function syncScene() {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      draw(); if (moving() && !disposed) frame = requestAnimationFrame(tick);
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage);
    const themeObserver = new MutationObserver(draw); themeObserver.observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
    const lost = event => {
      event.preventDefault(); dispose(); failed = true; sceneApi = null; container.classList.remove('webgl-ready');
    };
    canvas.addEventListener('webglcontextlost',lost);
    function dispose() {
      if (disposed) return;
      disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); themeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost',lost);
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); renderer.dispose();
    }
    container.classList.add('webgl-ready'); resize();
    return {draw,sync:syncScene,dispose};
  }
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    io.disconnect(); sceneApi?.dispose(); container.removeEventListener('click',click); container.removeEventListener('keydown',keydown);
    window.removeEventListener('portfolio:motion',sync); document.removeEventListener('visibilitychange',sync); reduce.removeEventListener('change',sync);
  });
})();
