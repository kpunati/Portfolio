// api/labor-skills.js — Labor Market Skills Heatmap endpoint
//
// Source priority:
//   1. USAJOBS (only when USAJOBS_API_KEY + USAJOBS_USER_AGENT env vars are set)
//   2. Remotive + The Muse, fetched in parallel and merged (both no-auth)
//   3. Curated static fallback (always present)
//
// Remotive alone is too thin (their active inventory is small); pairing it
// with one page of The Muse gives a substantive sample without authentication.
// Caches the aggregate in module memory for 10 minutes and sets CDN cache headers.

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6500;
const FRESH_WINDOW_DAYS = 14;
const RECENT_WINDOW_DAYS = 7;
const MAX_POSTINGS_OUT = 18;
const MAX_COOCCURRENCE_PAIRS = 14;
const MAX_RISING_SIGNALS = 5;

let cachedPayload = null; // { expiresAt, payload }

/* ─── Skill dictionary ────────────────────────────────────────────────
   Canonical name -> array of source-text patterns.
   Patterns are joined with `|` at compile time into a single regex per skill.
   Word boundaries are added where useful. Order does not matter — each posting
   is tested independently against every skill.
*/
const SKILL_DEFINITIONS = [
  // Data
  ['SQL',                    [/\bSQL\b/i, /\bT-?SQL\b/i, /\bPL\/SQL\b/i]],
  ['Python',                 [/\bPython\b/i]],
  ['Excel',                  [/\bExcel\b/i]],
  ['Power BI',               [/\bPower\s*BI\b/i]],
  ['Tableau',                [/\bTableau\b/i]],
  ['Looker',                 [/\bLooker\b/i]],
  ['Snowflake',              [/\bSnowflake\b/i]],
  ['BigQuery',               [/\bBig\s*Query\b/i]],
  ['dbt',                    [/\bdbt\b/]],
  ['Airflow',                [/\b(?:Apache\s+)?Airflow\b/i]],
  ['Spark',                  [/\b(?:Apache\s+)?Spark\b/i]],
  ['Pandas',                 [/\bpandas\b/i]],
  ['PostgreSQL',             [/\bPostgreSQL\b/i, /\bPostgres\b/i]],
  ['MongoDB',                [/\bMongo\s*DB\b/i]],
  ['Databricks',             [/\bDatabricks\b/i]],

  // AI / ML
  ['Machine Learning',       [/\bMachine\s+Learning\b/i]],
  ['NLP',                    [/\bNLP\b/, /\bNatural\s+Language\s+Processing\b/i]],
  ['LLM',                    [/\bLLMs?\b/, /\bLarge\s+Language\s+Models?\b/i]],
  ['Generative AI',          [/\bGenerative\s+AI\b/i, /\bGen\s*AI\b/i]],
  ['RAG',                    [/\bRAG\b/, /\bretrieval[-\s]augmented\b/i]],
  ['OpenAI',                 [/\bOpenAI\b/i]],
  ['LangChain',              [/\bLangChain\b/i]],
  ['scikit-learn',           [/\bscikit[-\s]?learn\b/i]],
  ['TensorFlow',             [/\bTensorFlow\b/i]],
  ['PyTorch',                [/\bPyTorch\b/i]],
  ['Prompt Engineering',     [/\bPrompt\s+Engineering\b/i]],
  ['Deep Learning',          [/\bDeep\s+Learning\b/i]],

  // Cloud / Engineering
  ['AWS',                    [/\bAWS\b/]],
  ['Azure',                  [/\bAzure\b/i]],
  ['GCP',                    [/\bGCP\b/, /\bGoogle\s+Cloud\b/i]],
  ['Docker',                 [/\bDocker\b/i]],
  ['Kubernetes',             [/\bKubernetes\b/i, /\bk8s\b/i]],
  ['Terraform',              [/\bTerraform\b/i]],
  ['REST APIs',              [/\bREST\s+APIs?\b/i, /\bRESTful\b/i]],
  ['FastAPI',                [/\bFastAPI\b/i]],
  ['Node.js',                [/\bNode\.?js\b/i]],
  ['React',                  [/\bReact(?:\.js)?\b/]],
  ['TypeScript',             [/\bTypeScript\b/i]],
  ['CI/CD',                  [/\bCI\/CD\b/]],

  // Analytics / Business
  ['Forecasting',            [/\bForecasting\b/i]],
  ['A/B Testing',            [/\bA\/?B\s+Test(?:ing)?\b/i]],
  ['KPI',                    [/\bKPIs?\b/]],
  ['Dashboarding',           [/\bDashboard(?:ing|s)?\b/i]],
  ['ETL',                    [/\bETL\b/]],
  ['Data Modeling',          [/\bData\s+Modeling\b/i, /\bDimensional\s+Modeling\b/i]],
  ['Financial Analysis',     [/\bFinancial\s+Analysis\b/i, /\bFP&A\b/i]],
  ['Stakeholder Management', [/\bStakeholder\s+Management\b/i]],

  // Security / Automation
  ['SIEM',                   [/\bSIEM\b/]],
  ['Splunk',                 [/\bSplunk\b/i]],
  ['Vulnerability Mgmt',     [/\bVulnerability\s+Management\b/i]],
  ['Workflow Automation',    [/\bWorkflow\s+Automation\b/i, /\bProcess\s+Automation\b/i, /\bRPA\b/]],
  ['Power Automate',         [/\bPower\s+Automate\b/i]],
  ['Zapier',                 [/\bZapier\b/i]],
];

const COMPILED_SKILLS = SKILL_DEFINITIONS.map(([name, patterns]) => ({
  name,
  pattern: new RegExp(patterns.map((p) => p.source).join('|'), patterns[0].flags.includes('i') ? 'i' : ''),
}));

/* ─── Role family detection ───────────────────────────────────────────
   First match wins, so order patterns from most specific to most general.
*/
const ROLE_FAMILY_PATTERNS = [
  ['AI Engineer',          /\b(?:AI|ML|Machine\s+Learning)\s+Engineer\b/i],
  ['Data Engineer',        /\bData\s+Engineer\b/i],
  ['BI Developer',         /\b(?:BI|Business\s+Intelligence)\s+(?:Developer|Engineer|Analyst|Specialist)\b/i],
  ['Data Scientist',       /\bData\s+Scientist\b/i],
  ['Data Analyst',         /\bData\s+Analyst\b/i],
  ['Analytics Engineer',   /\bAnalytics\s+Engineer\b/i],
  ['Automation Analyst',   /\bAutomation\s+(?:Analyst|Engineer|Specialist|Developer)\b/i],
  ['Cyber Analyst',        /\b(?:Cyber|Security|SOC)\s+(?:Analyst|Engineer|Specialist)\b/i],
  ['Software Engineer',    /\bSoftware\s+(?:Engineer|Developer)\b/i],
  ['Frontend Engineer',    /\b(?:Frontend|Front[-\s]?End|UI)\s+(?:Engineer|Developer)\b/i, /\b(?:iOS|Android|Mobile)\s+(?:Engineer|Developer)\b/i],
  ['Backend Engineer',     /\b(?:Backend|Back[-\s]?End|API|Platform)\s+(?:Engineer|Developer)\b/i],
  ['Full Stack Engineer',  /\bFull[-\s]?Stack\s+(?:Engineer|Developer)\b/i],
  ['DevOps / Platform',    /\b(?:DevOps|SRE|Site\s+Reliability|Cloud|Infrastructure|Platform)\s+(?:Engineer|Specialist)\b/i],
  ['Product Manager',      /\bProduct\s+Manager\b/i],
];

function detectRoleFamily(title) {
  for (const [name, ...patterns] of ROLE_FAMILY_PATTERNS) {
    if (patterns.some((p) => p.test(title))) return name;
  }
  if (/\banalyst\b/i.test(title)) return 'Analyst (General)';
  if (/\bengineer\b/i.test(title)) return 'Engineer (General)';
  if (/\bdeveloper\b/i.test(title)) return 'Developer (General)';
  return 'Other';
}

/* ─── Text utilities ──────────────────────────────────────────────── */
function stripHtml(input) {
  return String(input || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSkills(haystack) {
  const found = [];
  for (const { name, pattern } of COMPILED_SKILLS) {
    if (pattern.test(haystack)) found.push(name);
  }
  return found;
}

function daysSince(isoDate) {
  if (!isoDate) return Infinity;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/* ─── Source fetchers ─────────────────────────────────────────────── */

async function fetchRemotive() {
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=400', {
      signal,
      headers: { 'User-Agent': 'portfolio-labor-skills/1.0' },
    });
    if (!res.ok) throw new Error(`Remotive returned ${res.status}`);
    const data = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    return jobs.map((j) => {
      const description = stripHtml(j.description);
      const title = String(j.title || '').trim();
      const tagsText = Array.isArray(j.tags) ? j.tags.join(' ') : '';
      const haystack = `${title} ${tagsText} ${description}`;
      return {
        id: `remotive-${j.id}`,
        source: 'remotive',
        title,
        organization: String(j.company_name || '').trim(),
        location: String(j.candidate_required_location || 'Remote').trim(),
        isRemote: true,
        postedAt: j.publication_date || null,
        roleFamily: detectRoleFamily(title),
        description: description.slice(0, 500),
        detectedSkills: extractSkills(haystack),
        url: j.url || null,
      };
    });
  } finally {
    clear();
  }
}

async function fetchTheMuse() {
  // The Muse public API: https://www.themuse.com/developers/api/v2
  // Each page returns 20 results. We pull a few pages in parallel for substance.
  const pageNumbers = [0, 1, 2];
  const requests = pageNumbers.map(async (page) => {
    const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`https://www.themuse.com/api/public/jobs?page=${page}`, {
        signal,
        headers: { 'User-Agent': 'portfolio-labor-skills/1.0' },
      });
      if (!res.ok) throw new Error(`The Muse returned ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.results) ? data.results : [];
    } finally {
      clear();
    }
  });
  const pages = await Promise.allSettled(requests);
  const items = pages.flatMap((p) => (p.status === 'fulfilled' ? p.value : []));
  return items.map((job) => {
    const title = String(job.name || '').trim();
    const description = stripHtml(job.contents || '');
    const categoryText = Array.isArray(job.categories) ? job.categories.map((c) => c.name).join(' ') : '';
    const tagsText = Array.isArray(job.tags) ? job.tags.map((t) => t.name).join(' ') : '';
    const haystack = `${title} ${categoryText} ${tagsText} ${description}`;
    const locations = Array.isArray(job.locations) ? job.locations.map((l) => l.name) : [];
    const location = locations.join(', ') || 'Unspecified';
    return {
      id: `themuse-${job.id}`,
      source: 'themuse',
      title,
      organization: String(job.company?.name || '').trim(),
      location,
      isRemote: /flexible|remote/i.test(location),
      postedAt: job.publication_date || null,
      roleFamily: detectRoleFamily(title),
      description: description.slice(0, 500),
      detectedSkills: extractSkills(haystack),
      url: job.refs?.landing_page || null,
    };
  });
}

async function fetchUSAJOBS(apiKey, userAgent) {
  // USAJOBS docs: https://developer.usajobs.gov/api-reference/get-api-search
  // Returns federal postings — primarily used when an API key is available.
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const url = new URL('https://data.usajobs.gov/api/search');
    url.searchParams.set('Keyword', 'data OR analyst OR engineer OR analytics OR automation');
    url.searchParams.set('ResultsPerPage', '250');
    url.searchParams.set('Fields', 'min');
    const res = await fetch(url, {
      signal,
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': userAgent,
        'Authorization-Key': apiKey,
      },
    });
    if (!res.ok) throw new Error(`USAJOBS returned ${res.status}`);
    const data = await res.json();
    const items = data?.SearchResult?.SearchResultItems || [];
    return items.map((wrapper) => {
      const job = wrapper?.MatchedObjectDescriptor || {};
      const title = String(job.PositionTitle || '').trim();
      const description = stripHtml(
        (job.UserArea?.Details?.JobSummary || job.QualificationSummary || '').toString(),
      );
      const haystack = `${title} ${description}`;
      const location = Array.isArray(job.PositionLocationDisplay)
        ? job.PositionLocationDisplay.join(', ')
        : (job.PositionLocationDisplay || job.PositionLocation?.[0]?.LocationName || '');
      return {
        id: `usajobs-${job.PositionID || wrapper.MatchedObjectId}`,
        source: 'usajobs',
        title,
        organization: String(job.OrganizationName || '').trim(),
        location: String(location).trim(),
        isRemote: /telework|remote/i.test(JSON.stringify(job.PositionRemuneration || job.UserArea || '')),
        postedAt: job.PublicationStartDate || null,
        roleFamily: detectRoleFamily(title),
        description: description.slice(0, 500),
        detectedSkills: extractSkills(haystack),
        url: job.PositionURI || null,
      };
    });
  } finally {
    clear();
  }
}

/* ─── Curated fallback dataset ───────────────────────────────────────
   Used when both USAJOBS and Remotive fail. Designed to exercise every
   panel so the dashboard renders meaningfully even with zero upstream data.
*/
const FALLBACK_POSTINGS = (() => {
  const today = new Date();
  const daysAgo = (n) => new Date(today.getTime() - n * 86400000).toISOString();
  const seed = [
    ['Senior Data Analyst',     'Lyric Atlas',     'Remote',         'Power BI, SQL, Python, dashboards, KPI reporting, A/B testing, stakeholder management'],
    ['Data Engineer',           'Hexavault',       'Austin, TX',     'Snowflake, dbt, Airflow, Python, AWS, ETL, data modeling, Spark'],
    ['AI Engineer',             'Resonant Labs',   'Remote',         'LLM, RAG, OpenAI, LangChain, Python, PyTorch, prompt engineering, generative AI'],
    ['BI Developer',            'Mercato Group',   'Charlotte, NC',  'Power BI, SQL, Tableau, data modeling, dashboarding, ETL, financial analysis'],
    ['Automation Analyst',      'Northbeam Ops',   'Remote',         'Power Automate, Zapier, workflow automation, Python, RPA, KPI'],
    ['Cyber Analyst',           'Vellum Security', 'Washington, DC', 'SIEM, Splunk, vulnerability management, Python, automation'],
    ['Data Scientist',          'Atlas Health',    'Remote',         'Python, machine learning, scikit-learn, A/B testing, forecasting, SQL, deep learning'],
    ['Senior BI Analyst',       'Halcyon Retail',  'Remote',         'Power BI, SQL, Tableau, KPI, dashboarding, financial analysis, forecasting'],
    ['Analytics Engineer',      'Tide Commerce',   'Remote',         'dbt, Snowflake, SQL, BigQuery, data modeling, Python, ETL'],
    ['ML Engineer',             'Cinder Robotics', 'San Jose, CA',   'PyTorch, TensorFlow, machine learning, Python, AWS, Docker, Kubernetes, MLOps'],
    ['Data Analyst',            'Petal & Pine',    'Remote',         'SQL, Excel, Power BI, KPI, dashboards, Python, A/B testing'],
    ['Senior Data Engineer',    'Vanta Logistics', 'Chicago, IL',    'Spark, Airflow, AWS, Python, SQL, Snowflake, ETL, Kubernetes, Terraform'],
    ['AI/ML Engineer',          'Spectra AI',      'Remote',         'LLM, RAG, OpenAI, LangChain, PyTorch, prompt engineering, Python, FastAPI, AWS'],
    ['Senior Security Engineer','Lattice Defense', 'Remote',         'SIEM, Splunk, vulnerability management, Python, AWS, automation, CI/CD'],
    ['Automation Engineer',     'Plinth Industries','Remote',        'Workflow automation, Power Automate, Zapier, Python, REST APIs, dashboards'],
    ['Data Analyst (Marketing)','Olive Branch',    'Remote',         'SQL, Excel, Tableau, A/B testing, KPI, Python, forecasting'],
    ['Financial Data Analyst',  'Beacon Capital',  'New York, NY',   'Excel, SQL, Power BI, financial analysis, FP&A, forecasting, KPI'],
    ['Senior Analytics Engineer','Driftwood Data', 'Remote',         'dbt, Snowflake, SQL, Looker, BigQuery, data modeling, Python'],
    ['Junior Data Analyst',     'Cedar Health',    'Remote',         'SQL, Excel, Tableau, KPI, dashboarding, stakeholder management'],
    ['Lead Data Engineer',      'Solstice Media',  'Remote',         'Databricks, Spark, Snowflake, dbt, Airflow, AWS, Python, SQL'],
    ['Generative AI Engineer',  'Argent AI',       'Remote',         'LLM, RAG, OpenAI, LangChain, prompt engineering, Python, Generative AI, FastAPI'],
    ['NLP Engineer',            'Quartz Linguistics','Remote',       'NLP, Python, PyTorch, TensorFlow, machine learning, deep learning, LLM'],
    ['BI Analyst',              'Marlow & Co.',    'Remote',         'Power BI, SQL, KPI, dashboarding, A/B testing, financial analysis'],
    ['Senior Data Analyst',     'Stratos Travel',  'Remote',         'SQL, Python, Power BI, A/B testing, KPI, forecasting, dashboards'],
    ['MLOps Engineer',          'Foundry Compute', 'Remote',         'Kubernetes, Docker, AWS, Terraform, CI/CD, Python, PyTorch, machine learning'],
    ['SOC Analyst',             'Citadel Cyber',   'Remote',         'SIEM, Splunk, vulnerability management, automation, Python'],
    ['Senior AI Engineer',      'Lumen Insights',  'Remote',         'LLM, RAG, OpenAI, LangChain, Python, prompt engineering, FastAPI, AWS, Generative AI'],
    ['Data Engineer (Cloud)',   'Pivot North',     'Remote',         'GCP, BigQuery, dbt, Python, Airflow, ETL, SQL, data modeling'],
    ['Business Intelligence Developer','Harbor Group','Remote',      'Power BI, SQL, Tableau, ETL, data modeling, dashboarding, KPI'],
    ['AI Product Engineer',     'Glassroot AI',    'Remote',         'LLM, OpenAI, LangChain, RAG, TypeScript, React, Node.js, prompt engineering'],
  ];
  return seed.map(([title, org, location, blurb], idx) => {
    const haystack = `${title} ${blurb}`;
    return {
      id: `fallback-${idx + 1}`,
      source: 'fallback',
      title,
      organization: org,
      location,
      isRemote: /remote/i.test(location),
      postedAt: daysAgo(idx % 18),
      roleFamily: detectRoleFamily(title),
      description: blurb,
      detectedSkills: extractSkills(haystack),
      url: null,
    };
  });
})();

/* ─── Aggregation ─────────────────────────────────────────────────── */

function buildAggregate(postings, sourceStatus) {
  const total = postings.length;
  if (total === 0) {
    return {
      summary: { postingCount: 0, topSkill: null, topRoleFamily: null, remoteShare: 0 },
      skills: [],
      cooccurrence: [],
      roleFamilies: [],
      risingSignals: [],
      postings: [],
    };
  }

  /* Top skills */
  const skillCount = new Map();
  const skillFamilyHits = new Map(); // skill -> Map(family -> count)
  for (const p of postings) {
    const seen = new Set();
    for (const skill of p.detectedSkills) {
      if (seen.has(skill)) continue;
      seen.add(skill);
      skillCount.set(skill, (skillCount.get(skill) || 0) + 1);
      if (!skillFamilyHits.has(skill)) skillFamilyHits.set(skill, new Map());
      const fam = skillFamilyHits.get(skill);
      fam.set(p.roleFamily, (fam.get(p.roleFamily) || 0) + 1);
    }
  }

  const skills = Array.from(skillCount.entries())
    .map(([skill, count]) => {
      const families = Array.from(skillFamilyHits.get(skill).entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      return {
        skill,
        count,
        share: +(count / total).toFixed(3),
        roleFamilies: families,
      };
    })
    .sort((a, b) => b.count - a.count);

  /* Co-occurrence + lift */
  const pairCount = new Map();
  const skillsByPosting = postings.map((p) => Array.from(new Set(p.detectedSkills)).sort());
  for (const list of skillsByPosting) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const key = `${list[i]}|${list[j]}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }
  const cooccurrence = Array.from(pairCount.entries())
    .map(([key, count]) => {
      const [a, b] = key.split('|');
      const ac = skillCount.get(a) || 0;
      const bc = skillCount.get(b) || 0;
      const expected = (ac * bc) / total;
      const lift = expected > 0 ? count / expected : 0;
      return { source: a, target: b, count, lift: +lift.toFixed(2) };
    })
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => (b.count - a.count) || (b.lift - a.lift))
    .slice(0, MAX_COOCCURRENCE_PAIRS);

  /* Role families */
  const familyBuckets = new Map();
  for (const p of postings) {
    if (!familyBuckets.has(p.roleFamily)) familyBuckets.set(p.roleFamily, []);
    familyBuckets.get(p.roleFamily).push(p);
  }
  const GENERIC_FAMILIES = new Set(['Other', 'Analyst (General)', 'Engineer (General)', 'Developer (General)']);
  const roleFamilies = Array.from(familyBuckets.entries())
    .filter(([name]) => !GENERIC_FAMILIES.has(name))
    .map(([name, bucket]) => {
      const localCount = new Map();
      for (const p of bucket) {
        const seen = new Set();
        for (const s of p.detectedSkills) {
          if (seen.has(s)) continue;
          seen.add(s);
          localCount.set(s, (localCount.get(s) || 0) + 1);
        }
      }
      const topSkills = Array.from(localCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, count]) => ({ skill, count }));
      return {
        name,
        count: bucket.length,
        share: +(bucket.length / total).toFixed(3),
        topSkills,
      };
    })
    .sort((a, b) => b.count - a.count);

  /* Rising signals — skills whose share among fresh postings exceeds the overall share */
  const freshPostings = postings.filter((p) => daysSince(p.postedAt) <= FRESH_WINDOW_DAYS);
  const recentPostings = postings.filter((p) => daysSince(p.postedAt) <= RECENT_WINDOW_DAYS);
  const freshTotal = freshPostings.length || 1;
  const freshSkillCount = new Map();
  for (const p of freshPostings) {
    const seen = new Set();
    for (const s of p.detectedSkills) {
      if (seen.has(s)) continue;
      seen.add(s);
      freshSkillCount.set(s, (freshSkillCount.get(s) || 0) + 1);
    }
  }
  const topThree = new Set(skills.slice(0, 3).map((s) => s.skill));
  const risingSignals = Array.from(freshSkillCount.entries())
    .filter(([, c]) => c >= 3)
    .map(([skill, freshCount]) => {
      const overallShare = (skillCount.get(skill) || 0) / total;
      const freshShare = freshCount / freshTotal;
      const ratio = overallShare > 0 ? freshShare / overallShare : 1;
      return { skill, freshCount, freshShare: +freshShare.toFixed(3), ratio: +ratio.toFixed(2) };
    })
    .filter((entry) => !topThree.has(entry.skill) && entry.ratio >= 1.1)
    .sort((a, b) => b.ratio - a.ratio || b.freshCount - a.freshCount)
    .slice(0, MAX_RISING_SIGNALS);

  /* Summary */
  const remoteCount = postings.filter((p) => p.isRemote).length;
  const summary = {
    postingCount: total,
    topSkill: skills[0]?.skill || null,
    topRoleFamily: roleFamilies[0]?.name || null,
    remoteShare: +(remoteCount / total).toFixed(3),
    freshShare: +(freshPostings.length / total).toFixed(3),
    recentCount: recentPostings.length,
    skillsDetected: skills.length,
  };

  /* Trim postings for the wire — keep newest first */
  const postingsOut = [...postings]
    .sort((a, b) => Date.parse(b.postedAt || 0) - Date.parse(a.postedAt || 0))
    .slice(0, MAX_POSTINGS_OUT)
    .map((p) => ({
      id: p.id,
      source: p.source,
      title: p.title,
      organization: p.organization,
      location: p.location,
      isRemote: p.isRemote,
      postedAt: p.postedAt,
      roleFamily: p.roleFamily,
      detectedSkills: p.detectedSkills.slice(0, 6),
      url: p.url,
    }));

  return {
    summary,
    skills: skills.slice(0, 20),
    cooccurrence,
    roleFamilies: roleFamilies.slice(0, 8),
    risingSignals,
    postings: postingsOut,
  };
}

/* ─── Response helpers ────────────────────────────────────────────── */
function setCacheHeaders(res) {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  setCacheHeaders(res);
  res.end(JSON.stringify(payload));
}

/* ─── Handler ─────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  const now = Date.now();
  if (cachedPayload && cachedPayload.expiresAt > now) {
    json(res, 200, { ...cachedPayload.payload, status: 'cached' });
    return;
  }

  const sourceStatus = [];
  let postings = null;
  let status = 'fallback';

  const usajobsKey = process.env.USAJOBS_API_KEY;
  const usajobsAgent = process.env.USAJOBS_USER_AGENT;

  if (usajobsKey && usajobsAgent) {
    try {
      const items = await fetchUSAJOBS(usajobsKey, usajobsAgent);
      if (items.length > 0) {
        postings = items;
        status = 'live';
        sourceStatus.push({ id: 'usajobs', status: 'live', itemCount: items.length });
      } else {
        sourceStatus.push({ id: 'usajobs', status: 'empty', itemCount: 0 });
      }
    } catch (err) {
      sourceStatus.push({ id: 'usajobs', status: 'error', itemCount: 0, error: String(err?.message || err) });
    }
  }

  if (!postings) {
    const [remotiveResult, museResult] = await Promise.allSettled([
      fetchRemotive(),
      fetchTheMuse(),
    ]);

    const merged = [];
    if (remotiveResult.status === 'fulfilled') {
      merged.push(...remotiveResult.value);
      sourceStatus.push({ id: 'remotive', status: 'live', itemCount: remotiveResult.value.length });
    } else {
      sourceStatus.push({ id: 'remotive', status: 'error', itemCount: 0, error: String(remotiveResult.reason?.message || remotiveResult.reason) });
    }
    if (museResult.status === 'fulfilled') {
      merged.push(...museResult.value);
      sourceStatus.push({ id: 'themuse', status: 'live', itemCount: museResult.value.length });
    } else {
      sourceStatus.push({ id: 'themuse', status: 'error', itemCount: 0, error: String(museResult.reason?.message || museResult.reason) });
    }

    // Keep only postings with at least one detected skill — this is a skills
    // dashboard, so postings the dictionary can't read are noise.
    const relevant = merged.filter((p) => p.detectedSkills.length > 0);
    if (relevant.length > 0) {
      postings = relevant;
      status = 'live';
    }
  }

  if (!postings) {
    postings = FALLBACK_POSTINGS;
    status = 'fallback';
    sourceStatus.push({ id: 'curated', status: 'fallback', itemCount: postings.length });
  }

  const aggregate = buildAggregate(postings, sourceStatus);
  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    status,
    sourceStatus,
    ...aggregate,
  };

  cachedPayload = { expiresAt: now + CACHE_TTL_MS, payload };
  json(res, 200, payload);
}
