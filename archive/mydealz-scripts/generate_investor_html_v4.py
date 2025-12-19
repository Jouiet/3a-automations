# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
GENERATE INVESTOR-GRADE HTML V4.3 - DEPENDENCIES & COMPLEXITY
==============================================================
Based on V3.2 Inventory (477 scripts, 100% coverage)

THREE SEGMENTATION SYSTEMS:
1. Phase 0-4 (5-Phase Business Funnel)
2. Flywheel Stages (11-Category Granular)
3. Agency Value (4-Category Reusability)

FOUR STRATEGIC FLOWCHARTS (Mermaid.js):
1. Business Funnel (Phase 0→4)
2. Flywheel × Phase Mapping
3. Agency Reusability Flow
4. API Integration Map

NEW IN V4.3:
- Dependencies visualization (imports, local deps)
- Complexity/Maintainability metrics
- Last modified tracking

Session 105 - DEPENDENCIES COMBLÉES
"""

import json
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Load V3.1 inventory
INVENTORY_PATH = Path("/Users/mac/Desktop/MyDealz/docs/inventory/scripts_inventory_v3_COMPLETE.json")
OUTPUT_PATH = Path("/Users/mac/Desktop/MyDealz/docs/technical/automation-workflows-diagrams.html")

def load_inventory():
    with open(INVENTORY_PATH, 'r') as f:
        return json.load(f)

def generate_html():
    data = load_inventory()

    # Extract stats
    total_scripts = data['metadata']['total_scripts']
    total_loc = data['metadata']['total_loc']
    total_functions = data['metadata']['total_functions']

    stats = data['statistics']
    by_flywheel = stats['by_flywheel_stage']
    by_phase = stats.get('by_phase', {})
    by_agency = stats['by_agency_value']
    by_api = stats['by_api']
    by_ext = stats['by_extension']
    by_maintainability = stats.get('by_maintainability', {})

    # NEW V3.2 data
    metadata = data['metadata']
    total_external_imports = metadata.get('total_external_imports', 0)
    total_local_imports = metadata.get('total_local_imports', 0)
    scripts_with_local_deps = metadata.get('scripts_with_local_deps', 0)
    dependency_graph = data.get('dependency_graph', {})

    # Calculate reusability
    reusable = by_agency.get('CORE', 0) + by_agency.get('UTILITY', 0)
    reusability_pct = reusable / total_scripts * 100 if total_scripts > 0 else 0

    # Flywheel definitions
    flywheel_defs = data['flywheel_definitions']
    phase_defs = data.get('phase_definitions', {})

    # Count flywheel health
    core_stages = ['STAGE_1_ACQUIRE', 'STAGE_2_QUALIFY', 'STAGE_3_NURTURE', 'STAGE_4_CONVERT',
                   'STAGE_5_FULFILL', 'STAGE_6_RETAIN', 'STAGE_7_REFER']
    stages_ok = sum(1 for s in core_stages if by_flywheel.get(s, 0) >= 2)

    # Build cross-tabulation matrix
    cross = defaultdict(lambda: defaultdict(int))
    phase_agency = defaultdict(lambda: defaultdict(int))
    phase_api = defaultdict(lambda: defaultdict(int))

    for script in data['scripts']:
        cross[script['flywheel_stage']][script['agency_value']] += 1
        phase_agency[script.get('phase', 'UNKNOWN')][script['agency_value']] += 1
        for api in script.get('apis_used', []):
            phase_api[script.get('phase', 'UNKNOWN')][api] += 1

    # Phase data for flowcharts
    p0 = by_phase.get('PHASE_0_INFRASTRUCTURE', 0)
    p1 = by_phase.get('PHASE_1_ACQUISITION', 0)
    p2 = by_phase.get('PHASE_2_CONVERSION', 0)
    p3 = by_phase.get('PHASE_3_RETENTION', 0)
    p4 = by_phase.get('PHASE_4_ADVOCACY', 0)

    # Generate HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyDealz Investor-Grade Documentation - Triple Segmentation V4.2</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>mermaid.initialize({{startOnLoad:true, theme:'default', flowchart:{{curve:'basis'}}}});</script>

    <style>
        :root {{
            --primary: #040462;
            --secondary: #D4AF37;
            --success: #4CAF50;
            --warning: #FF9800;
            --error: #F44336;
            --info: #2196F3;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #212121;
            background: #FAFAFA;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; padding: 20px; }}
        header {{
            background: linear-gradient(135deg, var(--primary) 0%, #0a0a8c 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        header h1 {{ font-size: 2.5rem; margin-bottom: 10px; }}
        header .subtitle {{ color: var(--secondary); font-size: 1.2rem; }}
        header .version {{
            display: inline-block;
            background: var(--success);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-top: 10px;
        }}
        nav {{
            background: white;
            padding: 15px;
            border-bottom: 3px solid var(--secondary);
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        nav ul {{ list-style: none; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }}
        nav a {{
            color: var(--primary);
            text-decoration: none;
            padding: 8px 14px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.85rem;
            transition: all 0.3s;
        }}
        nav a:hover {{ background: var(--secondary); color: white; }}
        section {{
            background: white;
            margin: 30px 0;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
        }}
        section h2 {{
            background: var(--primary);
            color: white;
            padding: 20px 30px;
            font-size: 1.4rem;
        }}
        section h2 span {{ color: var(--secondary); }}
        .section-content {{ padding: 30px; }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #f5f5f5 0%, white 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid var(--secondary);
        }}
        .stat-card .value {{ font-size: 2rem; font-weight: 700; color: var(--primary); }}
        .stat-card .label {{ color: #757575; font-size: 0.8rem; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.85rem; }}
        th {{ background: var(--primary); color: white; padding: 12px 10px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #e0e0e0; }}
        tr:hover {{ background: #f5f5f5; }}
        .mermaid {{
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            overflow-x: auto;
        }}
        .flowchart-title {{
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--secondary);
        }}
        .flowchart-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
        }}
        .flowchart-card {{
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 25px;
        }}
        footer {{
            background: var(--primary);
            color: white;
            padding: 30px;
            text-align: center;
            margin-top: 50px;
        }}
        footer a {{ color: var(--secondary); }}
        .badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 600;
        }}
        .progress-bar {{
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
        }}
        .progress-fill {{ height: 100%; transition: width 0.5s; }}
    </style>
</head>
<body>
    <header>
        <h1>MyDealz Automation Architecture</h1>
        <p class="subtitle">
            {total_scripts} Scripts |
            {total_loc:,} Lines of Code |
            {total_functions:,} Functions
        </p>
        <span class="version">V4.3 DEPENDENCIES & COMPLEXITY</span>
    </header>

    <nav>
        <ul>
            <li><a href="#dashboard">📊 Dashboard</a></li>
            <li><a href="#flowcharts">📈 Flowcharts</a></li>
            <li><a href="#phase-funnel">🎯 Phase 0-4</a></li>
            <li><a href="#flywheel-stages">🔄 Flywheel 11</a></li>
            <li><a href="#agency-value">💼 Agency</a></li>
            <li><a href="#api-matrix">🔌 APIs</a></li>
        </ul>
    </nav>

    <div class="container">
        <!-- DASHBOARD -->
        <section id="dashboard">
            <h2><span>01</span> Executive Dashboard</h2>
            <div class="section-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="value">{total_scripts}</div>
                        <div class="label">Total Scripts</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{total_loc:,}</div>
                        <div class="label">Lines of Code</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{total_functions:,}</div>
                        <div class="label">Functions</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{reusability_pct:.0f}%</div>
                        <div class="label">Reusability</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{stages_ok}/7</div>
                        <div class="label">Flywheel Health</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">5/5</div>
                        <div class="label">Phases Covered</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FLOWCHARTS SECTION -->
        <section id="flowcharts">
            <h2><span>02</span> Strategic Flowcharts</h2>
            <div class="section-content">
                <div class="flowchart-grid">

                    <!-- FLOWCHART 1: Business Funnel -->
                    <div class="flowchart-card">
                        <div class="flowchart-title">📊 #1 Business Funnel (Phase 0→4)</div>
                        <div class="mermaid">
flowchart TD
    P0["🏗️ Phase 0: Infrastructure<br/><b>{p0} scripts</b> (63.3%)"]
    P1["📣 Phase 1: Acquisition<br/><b>{p1} scripts</b> (20.1%)"]
    P2["💰 Phase 2: Conversion<br/><b>{p2} scripts</b> (9.6%)"]
    P3["🔄 Phase 3: Retention<br/><b>{p3} scripts</b> (5.5%)"]
    P4["⭐ Phase 4: Advocacy<br/><b>{p4} scripts</b> (1.5%)"]

    P0 -->|"supports all"| P1
    P1 -->|"leads flow to"| P2
    P2 -->|"customers to"| P3
    P3 -->|"advocates to"| P4
    P4 -.->|"referrals back"| P1

    style P0 fill:#9E9E9E,color:#fff
    style P1 fill:#4CAF50,color:#fff
    style P2 fill:#9C27B0,color:#fff
    style P3 fill:#00BCD4,color:#fff
    style P4 fill:#FF5722,color:#fff
                        </div>
                    </div>

                    <!-- FLOWCHART 2: Flywheel × Phase Mapping -->
                    <div class="flowchart-card">
                        <div class="flowchart-title">🔄 #2 Flywheel → Phase Mapping</div>
                        <div class="mermaid">
flowchart LR
    subgraph INFRA["Phase 0: Infrastructure (302)"]
        SI["SUPPORT_INFRA<br/>155"]
        SA["SUPPORT_ANALYTICS<br/>147"]
    end

    subgraph ACQ["Phase 1: Acquisition (96)"]
        S1["ACQUIRE<br/>14"]
        S2["QUALIFY<br/>3"]
        SS["SEO<br/>75"]
        SV["VIDEO<br/>4"]
    end

    subgraph CONV["Phase 2: Conversion (46)"]
        S3["NURTURE<br/>9"]
        S4["CONVERT<br/>37"]
    end

    subgraph RET["Phase 3: Retention (26)"]
        S5["FULFILL<br/>22"]
        S6["RETAIN<br/>4"]
    end

    subgraph ADV["Phase 4: Advocacy (7)"]
        S7["REFER<br/>7"]
    end

    INFRA --> ACQ
    ACQ --> CONV
    CONV --> RET
    RET --> ADV

    style INFRA fill:#f5f5f5,stroke:#9E9E9E
    style ACQ fill:#e8f5e9,stroke:#4CAF50
    style CONV fill:#f3e5f5,stroke:#9C27B0
    style RET fill:#e0f7fa,stroke:#00BCD4
    style ADV fill:#fbe9e7,stroke:#FF5722
                        </div>
                    </div>

                    <!-- FLOWCHART 3: Agency Reusability -->
                    <div class="flowchart-card">
                        <div class="flowchart-title">💼 #3 Agency Reusability by Phase</div>
                        <div class="mermaid">
flowchart TD
    subgraph P0["Phase 0: Infrastructure"]
        P0U["UTILITY: 252"]
        P0C["CLIENT: 33"]
        P0R["CORE: 15"]
    end

    subgraph P1["Phase 1: Acquisition"]
        P1U["UTILITY: 59"]
        P1R["CORE: 28"]
        P1C["CLIENT: 9"]
    end

    subgraph P2["Phase 2: Conversion"]
        P2C["CLIENT: 24"]
        P2U["UTILITY: 13"]
        P2R["CORE: 9"]
    end

    subgraph P3["Phase 3: Retention"]
        P3U["UTILITY: 14"]
        P3C["CLIENT: 6"]
        P3R["CORE: 6"]
    end

    subgraph P4["Phase 4: Advocacy"]
        P4R["CORE: 5"]
        P4U["UTILITY: 1"]
        P4C["CLIENT: 1"]
    end

    P0 --> P1 --> P2 --> P3 --> P4

    style P0U fill:#2196F3,color:#fff
    style P0C fill:#FF9800,color:#fff
    style P0R fill:#4CAF50,color:#fff
    style P1U fill:#2196F3,color:#fff
    style P1R fill:#4CAF50,color:#fff
    style P1C fill:#FF9800,color:#fff
    style P2C fill:#FF9800,color:#fff
    style P2U fill:#2196F3,color:#fff
    style P2R fill:#4CAF50,color:#fff
    style P3U fill:#2196F3,color:#fff
    style P3C fill:#FF9800,color:#fff
    style P3R fill:#4CAF50,color:#fff
    style P4R fill:#4CAF50,color:#fff
    style P4U fill:#2196F3,color:#fff
    style P4C fill:#FF9800,color:#fff
                        </div>
                    </div>

                    <!-- FLOWCHART 4: API Integration Map -->
                    <div class="flowchart-card">
                        <div class="flowchart-title">🔌 #4 API Integration Map</div>
                        <div class="mermaid">
flowchart TD
    SHOP["🛒 SHOPIFY<br/>REST: 409 | GraphQL: 127"]
    AI["🤖 ANTHROPIC AI<br/>37 scripts"]
    SOCIAL["📱 SOCIAL<br/>TikTok: 20 | FB: 15"]
    GOOGLE["📊 GOOGLE<br/>Sheets: 11 | GA4: 10"]
    OTHER["🔧 OTHER<br/>Apify: 15 | Omnisend: 12"]

    SHOP --> P0["Phase 0<br/>266+65"]
    SHOP --> P1["Phase 1<br/>74+38"]
    SHOP --> P2["Phase 2<br/>39+13"]
    SHOP --> P3["Phase 3<br/>24+9"]
    SHOP --> P4["Phase 4<br/>6+2"]

    AI --> P0
    GOOGLE --> P1
    SOCIAL --> P3
    OTHER --> P1

    style SHOP fill:#96bf48,color:#fff
    style AI fill:#cc785c,color:#fff
    style SOCIAL fill:#1da1f2,color:#fff
    style GOOGLE fill:#4285f4,color:#fff
    style OTHER fill:#666,color:#fff
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- PHASE 0-4 DETAILS -->
        <section id="phase-funnel">
            <h2><span>03</span> Phase 0-4 Business Funnel Details</h2>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Phase</th>
                            <th>Name</th>
                            <th>Scripts</th>
                            <th>%</th>
                            <th>Flywheel Stages Included</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="background: #9E9E9E; color: white; font-weight: bold;">0</td>
                            <td>Infrastructure</td>
                            <td><strong>{p0}</strong></td>
                            <td>63.3%</td>
                            <td>SUPPORT_INFRASTRUCTURE (155) + SUPPORT_ANALYTICS (147)</td>
                        </tr>
                        <tr>
                            <td style="background: #4CAF50; color: white; font-weight: bold;">1</td>
                            <td>Acquisition</td>
                            <td><strong>{p1}</strong></td>
                            <td>20.1%</td>
                            <td>ACQUIRE (14) + QUALIFY (3) + SEO (75) + VIDEO (4)</td>
                        </tr>
                        <tr>
                            <td style="background: #9C27B0; color: white; font-weight: bold;">2</td>
                            <td>Conversion</td>
                            <td><strong>{p2}</strong></td>
                            <td>9.6%</td>
                            <td>NURTURE (9) + CONVERT (37)</td>
                        </tr>
                        <tr>
                            <td style="background: #00BCD4; color: white; font-weight: bold;">3</td>
                            <td>Retention</td>
                            <td><strong>{p3}</strong></td>
                            <td>5.5%</td>
                            <td>FULFILL (22) + RETAIN (4)</td>
                        </tr>
                        <tr>
                            <td style="background: #FF5722; color: white; font-weight: bold;">4</td>
                            <td>Advocacy</td>
                            <td><strong>{p4}</strong></td>
                            <td>1.5%</td>
                            <td>REFER (7)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- FLYWHEEL 11 DETAILS -->
        <section id="flywheel-stages">
            <h2><span>04</span> Flywheel 11-Category Granular View</h2>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Stage</th>
                            <th>Description</th>
                            <th>Scripts</th>
                            <th>%</th>
                            <th>Maps to Phase</th>
                        </tr>
                    </thead>
                    <tbody>
'''

    # Sort flywheel stages by order
    sorted_stages = sorted(flywheel_defs.items(), key=lambda x: x[1].get('order', 99))

    phase_map = {
        'STAGE_1_ACQUIRE': '1 (Acquisition)',
        'STAGE_2_QUALIFY': '1 (Acquisition)',
        'STAGE_3_NURTURE': '2 (Conversion)',
        'STAGE_4_CONVERT': '2 (Conversion)',
        'STAGE_5_FULFILL': '3 (Retention)',
        'STAGE_6_RETAIN': '3 (Retention)',
        'STAGE_7_REFER': '4 (Advocacy)',
        'SUPPORT_SEO': '1 (Acquisition)',
        'SUPPORT_ANALYTICS': '0 (Infrastructure)',
        'SUPPORT_INFRASTRUCTURE': '0 (Infrastructure)',
        'SUPPORT_VIDEO_MARKETING': '1 (Acquisition)',
    }

    for stage_key, stage_data in sorted_stages:
        count = by_flywheel.get(stage_key, 0)
        pct = count / total_scripts * 100 if total_scripts > 0 else 0
        color = stage_data.get('color', '#999')
        phase = phase_map.get(stage_key, '?')

        html += f'''
                        <tr>
                            <td>{stage_data.get('order', '-')}</td>
                            <td style="background: {color}; color: white; font-weight: 600;">{stage_data.get('name', stage_key)}</td>
                            <td>{stage_data.get('description', '')}</td>
                            <td><strong>{count}</strong></td>
                            <td>{pct:.1f}%</td>
                            <td>Phase {phase}</td>
                        </tr>
'''

    html += '''
                    </tbody>
                </table>
            </div>
        </section>
'''

    # Agency Value section
    html += f'''
        <section id="agency-value">
            <h2><span>05</span> Agency Value Segmentation</h2>
            <div class="section-content">
                <p style="margin-bottom: 20px; font-size: 1.1rem;">
                    <strong>Reusability Score:</strong> {reusable}/{total_scripts} =
                    <span style="color: var(--success); font-weight: 700; font-size: 1.3rem;">{reusability_pct:.1f}%</span>
                </p>
                <table>
                    <thead>
                        <tr><th>Category</th><th>Description</th><th>Scripts</th><th>%</th></tr>
                    </thead>
                    <tbody>
'''

    agency_colors = {'CORE': '#4CAF50', 'UTILITY': '#2196F3', 'CLIENT_SPECIFIC': '#FF9800', 'DEPRECATED': '#9E9E9E'}
    agency_descs = {
        'CORE': 'High-value, reusable across ANY e-commerce client',
        'UTILITY': 'Helper scripts, broadly applicable',
        'CLIENT_SPECIFIC': 'MyDealz-specific, limited reuse',
        'DEPRECATED': 'Old/superseded scripts'
    }

    for value, count in sorted(by_agency.items(), key=lambda x: -x[1]):
        pct = count / total_scripts * 100 if total_scripts > 0 else 0
        color = agency_colors.get(value, '#999')
        desc = agency_descs.get(value, '')

        html += f'''
                        <tr>
                            <td style="background: {color}; color: white; font-weight: 600;">{value}</td>
                            <td>{desc}</td>
                            <td><strong>{count}</strong></td>
                            <td>{pct:.1f}%</td>
                        </tr>
'''

    html += '''
                    </tbody>
                </table>
            </div>
        </section>
'''

    # API Matrix
    html += '''
        <section id="api-matrix">
            <h2><span>06</span> API Integration Matrix</h2>
            <div class="section-content">
                <table>
                    <thead>
                        <tr><th>API</th><th>Scripts</th><th>Coverage</th></tr>
                    </thead>
                    <tbody>
'''

    for api, count in sorted(by_api.items(), key=lambda x: -x[1]):
        pct = count / total_scripts * 100 if total_scripts > 0 else 0
        html += f'''
                        <tr>
                            <td><strong>{api}</strong></td>
                            <td>{count}</td>
                            <td>
                                <div class="progress-bar" style="width: 200px;">
                                    <div class="progress-fill" style="width: {pct}%; background: linear-gradient(90deg, var(--secondary), var(--primary));"></div>
                                </div>
                                {pct:.1f}%
                            </td>
                        </tr>
'''

    html += '''
                    </tbody>
                </table>
            </div>
        </section>
'''

    # NEW: Dependencies & Complexity Section
    html += f'''
        <section id="dependencies">
            <h2><span>07</span> Dependencies & Complexity (NEW in V3.2)</h2>
            <div class="section-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="value">{total_external_imports}</div>
                        <div class="label">External Imports</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{total_local_imports}</div>
                        <div class="label">Local Imports</div>
                    </div>
                    <div class="stat-card">
                        <div class="value">{scripts_with_local_deps}</div>
                        <div class="label">Scripts with Local Deps</div>
                    </div>
                </div>
'''

    # Maintainability breakdown
    if by_maintainability:
        html += '''
                <h3 style="margin: 20px 0 10px;">Maintainability Index (Python scripts)</h3>
                <table>
                    <thead>
                        <tr><th>Level</th><th>Count</th><th>Description</th></tr>
                    </thead>
                    <tbody>
'''
        maint_desc = {
            'high': '< 100 LOC - Easy to maintain',
            'medium': '100-300 LOC - Moderate complexity',
            'low': '> 300 LOC - Consider refactoring'
        }
        for level in ['high', 'medium', 'low']:
            count = by_maintainability.get(level, 0)
            color = {'high': '#4CAF50', 'medium': '#FF9800', 'low': '#F44336'}.get(level, '#999')
            html += f'''
                        <tr>
                            <td style="background: {color}; color: white; font-weight: 600;">{level.upper()}</td>
                            <td><strong>{count}</strong></td>
                            <td>{maint_desc.get(level, '')}</td>
                        </tr>
'''
        html += '''
                    </tbody>
                </table>
'''

    # Local dependency graph
    scripts_with_deps = [s for s in data['scripts'] if s.get('imports', {}).get('local', [])]
    if scripts_with_deps:
        html += f'''
                <h3 style="margin: 20px 0 10px;">Scripts with Local Dependencies ({len(scripts_with_deps)})</h3>
                <div class="mermaid">
flowchart LR
'''
        for s in scripts_with_deps:
            script_name = s['filename'].replace('.', '_').replace('-', '_')
            local_deps = s.get('imports', {}).get('local', [])
            for dep in local_deps:
                dep_name = dep.replace('./', '').replace('.', '_').replace('-', '_').replace('/', '_')
                html += f'    {script_name}["{s["filename"]}"] --> {dep_name}["{dep}"]\n'
        html += '''
                </div>
'''

    html += '''
            </div>
        </section>
'''

    # Footer
    html += f'''
    </div>

    <footer>
        <p><strong>MyDealz Automation Architecture</strong></p>
        <p style="margin: 15px 0;">V4.3 - Dependencies & Complexity Analysis</p>
        <p style="font-size: 0.9rem;">
            {total_scripts} Scripts | {total_loc:,} LOC | {total_functions:,} Functions |
            {total_external_imports} External Imports | {scripts_with_local_deps} Local Deps |
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
        </p>
        <p style="margin-top: 15px; font-size: 0.85rem; color: var(--secondary);">
            © 2025 MyDealz. All rights reserved.
        </p>
    </footer>
</body>
</html>
'''

    # Save HTML
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)

    print("=" * 60)
    print("GENERATING INVESTOR HTML V4.3 - DEPENDENCIES EDITION")
    print("=" * 60)
    print(f"\nHTML saved: {OUTPUT_PATH}")
    print(f"Size: {len(html):,} bytes")
    print(f"\nNEW IN V4.3:")
    print(f"  - External Imports: {total_external_imports}")
    print(f"  - Local Imports: {total_local_imports}")
    print(f"  - Scripts with Local Deps: {scripts_with_local_deps}")
    print(f"  - Maintainability tracked: {sum(by_maintainability.values())} Python scripts")
    print("\nDone!")

if __name__ == "__main__":
    generate_html()
