// src/sections/labor-skills.js — Labor Market Skills Heatmap
//
// Fetches /api/labor-skills and renders five panels:
//   1. Skill demand strip (top 5)
//   2. Co-occurrence heatmap matrix (static SVG; mobile collapses to pair rows)
//   3. Role cluster cards
//   4. Rising signals strip
//   5. Source health row
//
// No persistent animation loop. Static after first render.

const ENDPOINT = '/api/labor-skills';
const SHELL_ID = 'labor-skills-shell';
const HEATMAP_SKILLS_MAX = 8;

let booted = false;

export function initLaborSkills() {
  if (booted) return;
  booted = true;
  const shell = document.getElementById(SHELL_ID);
  if (!shell) return;

  const body = shell.querySelector('[data-ls-body]');
  if (!body) return;

  renderState(body, 'loading');

  fetch(ENDPOINT, { headers: { 'Accept': 'application/json' } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      renderDashboard(shell, body, data);
    })
    .catch((err) => {
      console.error('labor-skills: fetch failed', err);
      renderState(body, 'error');
    });
}

/* ─── State views ─────────────────────────────────────────────────── */

function renderState(body, state) {
  if (state === 'loading') {
    body.innerHTML = `
      <div class="ls-state" role="status" aria-live="polite">
        <div class="ls-spinner" aria-hidden="true"></div>
        <p>Sampling public postings&hellip;</p>
      </div>
    `;
    return;
  }
  if (state === 'error') {
    body.innerHTML = `
      <div class="ls-state ls-state-error" role="status">
        <p>Labor signal feed temporarily unavailable.</p>
        <p class="ls-state-sub">The endpoint will retry on next page load.</p>
      </div>
    `;
    return;
  }
  if (state === 'empty') {
    body.innerHTML = `
      <div class="ls-state" role="status">
        <p>No qualifying postings in the current sample.</p>
      </div>
    `;
  }
}

/* ─── Main render ─────────────────────────────────────────────────── */

function renderDashboard(shell, body, data) {
  if (!data || !data.summary || data.summary.postingCount === 0) {
    renderState(body, 'empty');
    return;
  }

  updateStatusChips(shell, data);

  body.innerHTML = `
    <div class="ls-stat-row">
      ${renderStatCard('Postings sampled', formatNumber(data.summary.postingCount))}
      ${renderStatCard('Top skill', data.summary.topSkill || '—')}
      ${renderStatCard('Top role family', data.summary.topRoleFamily || '—')}
      ${renderStatCard('Remote share', formatPercent(data.summary.remoteShare))}
    </div>

    <div class="ls-grid">
      <section class="ls-panel ls-panel-skills" aria-labelledby="ls-skills-h">
        <header class="ls-panel-head">
          <h3 id="ls-skills-h" class="ls-panel-title">Skill Demand Strip</h3>
          <span class="ls-panel-sub">Top skills by posting frequency</span>
        </header>
        ${renderSkillStrip(data.skills)}
      </section>

      <section class="ls-panel ls-panel-rising" aria-labelledby="ls-rising-h">
        <header class="ls-panel-head">
          <h3 id="ls-rising-h" class="ls-panel-title">Rising Signals</h3>
          <span class="ls-panel-sub">Above-baseline in the last 14 days</span>
        </header>
        ${renderRising(data.risingSignals)}
      </section>

      <section class="ls-panel ls-panel-heatmap" aria-labelledby="ls-heat-h">
        <header class="ls-panel-head">
          <h3 id="ls-heat-h" class="ls-panel-title">Skill Co-occurrence Heatmap</h3>
          <span class="ls-panel-sub">Where skills cluster together in postings</span>
        </header>
        ${renderHeatmap(data.cooccurrence)}
        ${renderHeatmapList(data.cooccurrence)}
      </section>

      <section class="ls-panel ls-panel-clusters" aria-labelledby="ls-clusters-h">
        <header class="ls-panel-head">
          <h3 id="ls-clusters-h" class="ls-panel-title">Role Cluster Cards</h3>
          <span class="ls-panel-sub">Top skills inside each role family</span>
        </header>
        ${renderClusters(data.roleFamilies)}
      </section>
    </div>

    <footer class="ls-foot">
      <span class="ls-foot-meta">${escapeHtml(methodologyBlurb(data))}</span>
    </footer>
  `;

  shell.classList.add('is-ready');
}

/* ─── Status chips (top of shell header) ─────────────────────────── */

function updateStatusChips(shell, data) {
  const statusChip = shell.querySelector('[data-ls-status]');
  const updatedChip = shell.querySelector('[data-ls-updated]');
  const countChip = shell.querySelector('[data-ls-count]');

  if (statusChip) {
    statusChip.textContent = labelForStatus(data.status);
    statusChip.dataset.lsStatus = data.status;
  }
  if (updatedChip) {
    updatedChip.textContent = `Updated ${formatRelativeTime(data.generatedAt)}`;
  }
  if (countChip) {
    countChip.textContent = `${formatNumber(data.summary.postingCount)} postings`;
  }
}

function labelForStatus(status) {
  if (status === 'live') return 'Live';
  if (status === 'cached') return 'Cached';
  return 'Fallback';
}

/* ─── Panel renderers ─────────────────────────────────────────────── */

function renderStatCard(label, value) {
  return `
    <div class="ls-stat">
      <span class="ls-stat-val">${escapeHtml(value)}</span>
      <span class="ls-stat-lbl">${escapeHtml(label)}</span>
    </div>
  `;
}

function renderSkillStrip(skills) {
  if (!skills || skills.length === 0) {
    return '<p class="ls-empty">No skills detected in this sample.</p>';
  }
  const top = skills.slice(0, 6);
  const max = top[0].count;
  return `
    <ol class="ls-skill-list">
      ${top.map((s, idx) => {
        const pct = Math.max(8, Math.round((s.count / max) * 100));
        const familyLabel = (s.roleFamilies && s.roleFamilies[0]) || '—';
        return `
          <li class="ls-skill-row">
            <span class="ls-skill-rank">${idx + 1}</span>
            <span class="ls-skill-name">${escapeHtml(s.skill)}</span>
            <span class="ls-skill-bar" aria-hidden="true">
              <span class="ls-skill-bar-fill" style="width:${pct}%"></span>
            </span>
            <span class="ls-skill-count">${s.count}</span>
            <span class="ls-skill-family">${escapeHtml(familyLabel)}</span>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function renderRising(rising) {
  if (!rising || rising.length === 0) {
    return '<p class="ls-empty">No above-baseline movement yet — check back as the sample refreshes.</p>';
  }
  return `
    <ul class="ls-rising-list">
      ${rising.map((r) => `
        <li class="ls-rising-row">
          <span class="ls-rising-arrow" aria-hidden="true">↑</span>
          <span class="ls-rising-skill">${escapeHtml(r.skill)}</span>
          <span class="ls-rising-meta">${formatMultiplier(r.ratio)} fresh share · ${r.freshCount} recent</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderHeatmap(pairs) {
  if (!pairs || pairs.length === 0) {
    return '<p class="ls-empty ls-heatmap-empty">Not enough overlapping skills to build a matrix.</p>';
  }

  // Pick the most-frequent skills across the pair list.
  const tally = new Map();
  for (const p of pairs) {
    tally.set(p.source, (tally.get(p.source) || 0) + p.count);
    tally.set(p.target, (tally.get(p.target) || 0) + p.count);
  }
  const skills = Array.from(tally.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, HEATMAP_SKILLS_MAX)
    .map(([s]) => s);

  if (skills.length < 2) {
    return '<p class="ls-empty ls-heatmap-empty">Not enough overlapping skills to build a matrix.</p>';
  }

  // Build cell lookup
  const cellMap = new Map();
  let maxCount = 0;
  for (const p of pairs) {
    if (!skills.includes(p.source) || !skills.includes(p.target)) continue;
    cellMap.set(`${p.source}|${p.target}`, p);
    cellMap.set(`${p.target}|${p.source}`, p);
    if (p.count > maxCount) maxCount = p.count;
  }

  const n = skills.length;
  const cellSize = 38;
  const labelGutter = 132;
  const padding = 14;
  const width = labelGutter + n * cellSize + padding;
  const height = labelGutter + n * cellSize + padding;

  const cells = [];
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      const x = labelGutter + col * cellSize;
      const y = labelGutter + row * cellSize;
      if (row === col) {
        cells.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" class="ls-heat-cell ls-heat-cell-diag"></rect>`);
        continue;
      }
      const pair = cellMap.get(`${skills[row]}|${skills[col]}`);
      if (!pair) {
        cells.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" class="ls-heat-cell ls-heat-cell-empty"></rect>`);
        continue;
      }
      const intensity = maxCount > 0 ? pair.count / maxCount : 0;
      const opacity = 0.18 + intensity * 0.78;
      const liftLabel = pair.lift >= 1.4 ? ' ls-heat-cell-strong' : '';
      cells.push(`<rect x="${x}" y="${y}" width="${cellSize - 2}" height="${cellSize - 2}" rx="3" class="ls-heat-cell${liftLabel}" style="--cell-opacity:${opacity.toFixed(3)}"><title>${escapeHtml(skills[row])} × ${escapeHtml(skills[col])} — ${pair.count} postings, lift ${pair.lift.toFixed(2)}</title></rect>`);
    }
  }

  const colLabels = skills.map((skill, idx) => {
    const x = labelGutter + idx * cellSize + (cellSize - 2) / 2;
    const y = labelGutter - 8;
    return `<text x="${x}" y="${y}" class="ls-heat-label ls-heat-label-col" transform="rotate(-45 ${x} ${y})">${escapeHtml(skill)}</text>`;
  }).join('');

  const rowLabels = skills.map((skill, idx) => {
    const x = labelGutter - 8;
    const y = labelGutter + idx * cellSize + (cellSize - 2) / 2 + 4;
    return `<text x="${x}" y="${y}" class="ls-heat-label ls-heat-label-row">${escapeHtml(skill)}</text>`;
  }).join('');

  return `
    <div class="ls-heatmap-wrap" role="img" aria-label="Skill co-occurrence heatmap">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="ls-heatmap-svg">
        ${colLabels}
        ${rowLabels}
        ${cells.join('')}
      </svg>
    </div>
  `;
}

function renderHeatmapList(pairs) {
  if (!pairs || pairs.length === 0) return '';
  const top = pairs.slice(0, 8);
  return `
    <ul class="ls-pair-list" aria-label="Top skill pairings (mobile view)">
      ${top.map((p) => `
        <li class="ls-pair-row">
          <span class="ls-pair-skills">${escapeHtml(p.source)} <span class="ls-pair-x">×</span> ${escapeHtml(p.target)}</span>
          <span class="ls-pair-meta">${p.count} postings · lift ${p.lift.toFixed(2)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderClusters(families) {
  if (!families || families.length === 0) {
    return '<p class="ls-empty">No role families identified.</p>';
  }
  const targetFamilies = ['Data Analyst', 'AI Engineer', 'Data Engineer', 'BI Developer', 'Data Scientist', 'Automation Analyst', 'Cyber Analyst', 'Analytics Engineer'];
  const ordered = [
    ...families.filter((f) => targetFamilies.includes(f.name)),
    ...families.filter((f) => !targetFamilies.includes(f.name)),
  ].slice(0, 6);

  return `
    <ul class="ls-cluster-grid">
      ${ordered.map((fam) => `
        <li class="ls-cluster-card">
          <div class="ls-cluster-head">
            <span class="ls-cluster-name">${escapeHtml(fam.name)}</span>
            <span class="ls-cluster-count">${fam.count}</span>
          </div>
          <ul class="ls-cluster-skills">
            ${fam.topSkills.slice(0, 4).map((s) => `
              <li class="ls-cluster-skill"><span class="ls-cluster-skill-name">${escapeHtml(s.skill)}</span><span class="ls-cluster-skill-count">${s.count}</span></li>
            `).join('')}
          </ul>
        </li>
      `).join('')}
    </ul>
  `;
}

/* ─── Formatters ──────────────────────────────────────────────────── */

function methodologyBlurb(data) {
  const sources = data.sourceStatus
    .map((s) => `${s.id}: ${s.status}${s.itemCount ? ` (${s.itemCount})` : ''}`)
    .join(' · ');
  return `Sampled public postings · curated skill dictionary · ${sources}`;
}

function formatNumber(value) {
  if (typeof value !== 'number') return String(value || '—');
  return value.toLocaleString();
}

function formatPercent(value) {
  if (typeof value !== 'number') return '—';
  return `${Math.round(value * 100)}%`;
}

function formatMultiplier(value) {
  if (typeof value !== 'number') return '—';
  return `${value.toFixed(1)}×`;
}

function formatRelativeTime(iso) {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const delta = Math.max(0, (Date.now() - t) / 1000);
  if (delta < 60) return 'just now';
  if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.round(delta / 3600)}h ago`;
  return `${Math.round(delta / 86400)}d ago`;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
