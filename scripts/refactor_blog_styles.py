import os
import re

def refactor_blog_post(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove internal style block
    content = re.sub(r'  <!-- Critical CSS -->\s*<style>.*?</style>', '', content, flags=re.DOTALL)

    # 2. Add external CSS link
    is_en = 'en/blog' in file_path
    rel_path = '../../css/ultra-blog.css' if is_en else '../css/ultra-blog.css'
    
    if rel_path not in content:
        content = content.replace('<link rel="stylesheet" href="/styles.min.css?v=27.0">', 
                                  f'<link rel="stylesheet" href="/styles.min.css?v=27.0">\n  <link rel="stylesheet" href="{rel_path}">')

    # 3. GTM Iframe
    content = content.replace('style="display:none;visibility:hidden"', 'class="gtm-iframe"')
    content = content.replace("style='display:none;visibility:hidden'", 'class="gtm-iframe"')

    # 4. Layout
    content = re.sub(r'<article style="[^"]+"', '<article class="article-container"', content)
    content = re.sub(r'<div class="container" style="[^"]+"', '<div class="container article-max-width"', content)

    # 5. Breadcrumb
    content = re.sub(r'<nav style="[^"]+" role="navigation">', '<nav class="article-breadcrumb" role="navigation">', content)
    content = content.replace('style="color:var(--text-secondary);text-decoration:none"', '')
    content = content.replace("style='color:var(--text-secondary);text-decoration:none'", '')
    content = content.replace('style="color:var(--text-secondary);margin:0 0.5rem"', 'class="separator"')
    content = content.replace("style='color:var(--text-secondary);margin:0 0.5rem'", 'class="separator"')
    content = content.replace('style="color:var(--primary)"', 'class="current"')
    content = content.replace("style='color:var(--primary)'", 'class="current"')

    # 6. Header
    content = re.sub(r'<header style="[^"]+">', '<header class="article-header">', content)
    # Simplify meta highlights
    content = content.replace('style="color:var(--primary)"', 'class="meta-highlight"')

    # 7. Content Block
    content = re.sub(r'<div class="article-content" style="[^"]+">', '<div class="article-content">', content)
    content = re.sub(r'<div class="article-content" style=\'[^\']+\'>', '<div class="article-content">', content)

    # 8. Tip/CTA/Author/Back
    content = re.sub(r'<div style="background:rgba\(79,186,241,0.1\).*?">', '<div class="article-tip">', content)
    content = re.sub(r'<div style=\'background:rgba\(79,186,241,0.1\).*?\'>', '<div class="article-tip">', content)
    
    content = re.sub(r'<div style="background:linear-gradient\(135deg,rgba\(79,186,241,0.15\).*?">', '<div class="article-cta">', content)
    content = re.sub(r'<div style="background:linear-gradient\(135deg,rgba\(139,92,246,0.15\).*?">', '<div class="article-cta">', content)
    
    content = re.sub(r'<div style="margin-top:3rem;padding:2rem;background:rgba\(255,255,255,0.03\).*?">', '<div class="article-author-box">', content)
    content = re.sub(r'<div class="article-author-box" style="[^"]+">', '<div class="article-author-box">', content)
    
    content = re.sub(r'<div style="width:80px;height:80px;background:linear-gradient.*?">', '<div class="author-avatar">', content)
    
    content = re.sub(r'<div style="margin-top:2rem;padding-top:2rem;border-top:1px solid rgba\(255,255,255,0.1\);text-align:center">', '<div class="back-to-blog">', content)

    # 9. Global Strip for remaining tags inside content/layout
    tags_to_strip = ['h1', 'h2', 'h3', 'h4', 'p', 'li', 'td', 'th', 'tr', 'div', 'span', 'time', 'a', 'footer', 'table']
    for tag in tags_to_strip:
        content = re.sub(rf'<{tag}\s+style="[^"]+"', f'<{tag}', content)
        content = re.sub(rf'<{tag}\s+style=\'[^\']+\'', f'<{tag}', content)

    # Clean double spaces
    content = re.sub(rf'\s+>', '>', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

blog_files = [
    'landing-page-hostinger/blog/assistant-vocal-ia-pme-2026.html',
    'landing-page-hostinger/blog/automatisation-ecommerce-2026.html',
    'landing-page-hostinger/blog/comment-automatiser-votre-service-client-avec-l-ia.html',
    'landing-page-hostinger/blog/marketing-automation-pour-startups-2026-guide-complet.html',
    'landing-page-hostinger/en/blog/ecommerce-automation-2026.html',
    'landing-page-hostinger/en/blog/how-to-automate-customer-service-with-ai-effectively.html',
    'landing-page-hostinger/en/blog/voice-ai-assistant-sme-2026.html'
]

for f in blog_files:
    print(f"Refactoring {f}...")
    refactor_blog_post(f)
