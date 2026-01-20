import os
import re

def refactor_page(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    parts = file_path.split(os.sep)
    rel_depth = len(parts) - 2
    path_prefix = '../' * rel_depth

    # 1. Styles
    content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)
    critical_link = f'<link rel="stylesheet" href="{path_prefix}css/critical.css">'
    if critical_link not in content:
        if 'styles.min.css' in content:
             content = re.sub(r'(<link rel="stylesheet" href="[^"]*styles\.min\.css.*?>)', rf'{critical_link}\n  \1', content)
        else:
             content = content.replace('</head>', f'  {critical_link}\n</head>')

    # 2. Scripts
    analytics_script = f'<script src="{path_prefix}js/analytics-init.js"></script>'
    if 'analytics-init.js' not in content:
        content = re.sub(r'<!-- Google Tag Manager .*? -->\s*<script>.*?</script>', analytics_script, content, flags=re.DOTALL)
    
    ui_init = f'<script src="{path_prefix}js/ui-init.js"></script>'
    telemetry = f'<script src="{path_prefix}js/telemetry.js"></script>'
    content = re.sub(r'<script>\s*\(function\s*\(\)\s*\{\s*var\s*loaded\s*=\s*false;\s*function\s*loadVoiceWidget.*?</script>', ui_init, content, flags=re.DOTALL)
    
    if ui_init not in content and '</body>' in content:
        footer_scripts = f'  <script src="{path_prefix}config.js?v=26.1"></script>\n  {ui_init}\n  {telemetry}\n'
        content = content.replace('</body>', f'{footer_scripts}</body>')

    # 3. Aggressive Strip
    tags_to_strip = ['div', 'span', 'p', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'a', 'td', 'th', 'tr', 'header', 'footer', 'nav', 'article', 'svg', 'section']
    for tag in tags_to_strip:
        # Before stripping, map common patterns to classes
        # Padding 4rem 0 and background pulse
        content = content.replace(f'<{tag} style="padding: 4rem 0; background: rgba(79, 186, 241, 0.03);"', f'<{tag} class="section-padded section-dark"')
        content = content.replace(f'<{tag} style="padding: 4rem 0;"', f'<{tag} class="section-padded"')
        
        content = re.sub(rf'<{tag}(\s+[^>]*?)\s+style="[^"]*"', rf'<{tag}\1', content)
        content = re.sub(rf'<{tag}(\s+[^>]*?)\s+style=\'[^\']*\'', rf'<{tag}\1', content)
        content = re.sub(rf'<{tag}\s+style="[^"]*"', rf'<{tag}', content)
        content = re.sub(rf'<{tag}\s+style=\'[^\']*\'', rf'<{tag}', content)

    # 4. SVG Stops (Convert style="stop-color:..." to stop-color="...")
    content = re.sub(r'<stop\s+([^>]*?)style="stop-color:([^;"]+);?"', r'<stop \1stop-color="\2"', content)
    content = re.sub(r'<stop\s+([^>]*?)style=\'stop-color:([^;\']+);?\'', r'<stop \1stop-color="\2"', content)

    # 5. CSP
    csp_meta = """  <meta http-equiv="Content-Security-Policy"
    content="default-src 'self' https:; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://ipapi.co https://script.google.com https://www.google-analytics.com; frame-src 'self' https://www.googletagmanager.com;">"""
    if 'Content-Security-Policy' not in content:
        content = content.replace('<head>', f'<head>\n{csp_meta}')
    else:
        content = re.sub(r'<meta http-equiv="Content-Security-Policy".*?>', csp_meta, content, flags=re.DOTALL)

    content = re.sub(r'\s+>', '>', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

targets = []
for root, dirs, files in os.walk('landing-page-hostinger'):
    if any(x in root for x in ['blog', 'legal']): continue
    for f in files:
        if f.endswith('.html'):
            targets.append(os.path.join(root, f))

for t in targets:
    print(f"Refactoring {t}...")
    refactor_page(t)
