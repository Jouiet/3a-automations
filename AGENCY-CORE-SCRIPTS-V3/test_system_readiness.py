#!/usr/bin/env python3
"""
TEST SYSTEM READINESS - Lead Management System
Vérifie si toutes les dépendances sont installées et configurées

Session 28 - Nov 25, 2025
"""

import sys
import os

def test_imports():
    """Test if all required packages can be imported"""
    print("=" * 80)
    print("🧪 TESTING SYSTEM READINESS - LEAD MANAGEMENT")
    print("=" * 80)
    print()

    results = {}
    packages = [
        ('facebook_business', 'Facebook Business SDK'),
        ('dotenv', 'python-dotenv'),
        ('pandas', 'Pandas'),
        ('requests', 'Requests'),
        ('googleapiclient', 'Google API Client'),
        ('google.auth', 'Google Auth'),
        ('openpyxl', 'OpenPyXL'),
        ('typeform', 'Typeform SDK'),
    ]

    print("1️⃣ TESTING PACKAGE IMPORTS")
    print("-" * 80)

    for package, name in packages:
        try:
            __import__(package)
            print(f"✅ {name:<30} INSTALLED")
            results[name] = True
        except ImportError as e:
            print(f"❌ {name:<30} MISSING")
            results[name] = False

    print()

    # Test built-in modules
    print("2️⃣ TESTING BUILT-IN MODULES")
    print("-" * 80)

    builtin_modules = [
        ('json', 'JSON'),
        ('datetime', 'Datetime'),
        ('csv', 'CSV'),
        ('os', 'OS'),
        ('sys', 'Sys'),
    ]

    for module, name in builtin_modules:
        try:
            __import__(module)
            print(f"✅ {name:<30} OK")
        except ImportError:
            print(f"❌ {name:<30} ERROR")

    print()

    # Test Python version
    print("3️⃣ PYTHON VERSION")
    print("-" * 80)
    print(f"Version: {sys.version}")
    print(f"Executable: {sys.executable}")
    print()

    # Check .env.example exists
    print("4️⃣ CONFIGURATION FILES")
    print("-" * 80)

    files_to_check = [
        '.env.example',
        'requirements.txt',
        'facebook_lead_ads_api.py',
        'sync_typeform_to_sheet.py',
        'import_leads_to_sheet.py',
        'imports/README.md',
        'imports/templates/partnership-template.csv',
        'imports/templates/investors-template.csv',
    ]

    for filename in files_to_check:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print(f"✅ {filename:<50} ({size} bytes)")
        else:
            print(f"❌ {filename:<50} MISSING")

    print()

    # Summary
    print("=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)

    installed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"Packages Installed: {installed}/{total}")

    if installed == total:
        print("✅ SYSTEM READY - All dependencies installed")
        return True
    else:
        print(f"⚠️ SYSTEM NOT READY - {total - installed} packages missing")
        missing = [name for name, status in results.items() if not status]
        print(f"Missing packages: {', '.join(missing)}")
        print()
        print("To install missing packages:")
        print("  pip3 install -r requirements.txt")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
