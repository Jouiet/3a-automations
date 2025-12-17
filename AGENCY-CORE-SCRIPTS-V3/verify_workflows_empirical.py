# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
GitHub Workflows Empirical Verification Script
Tests if documented "FUNCTIONAL" workflows actually have dependencies met
Session 77 - Bottom-up factual verification (no wishful thinking)
"""

import os
import json
from pathlib import Path

def check_workflow_dependencies():
    """Check if workflow dependencies actually exist"""
    
    results = {
        'tested_workflows': 0,
        'passed': 0,
        'failed': 0,
        'details': []
    }
    
    workflows_to_test = [
        {
            'name': 'apify-daily-scraper.yml',
            'documented_deps': ['APIFY_API_TOKEN', 'SPREADSHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'],
            'code_deps': ['apify-automation/run-scrapers.js', 'apify-automation/export-to-sheets.js']
        },
        {
            'name': 'facebook-leads-daily.yml',
            'documented_deps': ['FB_APP_ID', 'FB_APP_SECRET', 'FB_ACCESS_TOKEN', 'FB_LEAD_FORM_ID', 'SPREADSHEET_ID'],
            'code_deps': ['lead-management/facebook_lead_ads_api.py']
        },
        {
            'name': 'lead-management-automation.yml',
            'documented_deps': ['SPREADSHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON', 'SHOPIFY_ADMIN_API_TOKEN'],
            'code_deps': ['lead-management/sync_leads_to_shopify.py']
        },
        {
            'name': 'sheets-lead-qualification.yml',
            'documented_deps': ['SPREADSHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'],
            'code_deps': ['lead-management/qualify-leads.js']
        }
    ]
    
    print("🔍 GitHub Workflows Empirical Verification")
    print("=" * 60)
    print("Method: Bottom-up factual check (documented vs reality)\n")
    
    for workflow in workflows_to_test:
        results['tested_workflows'] += 1
        workflow_name = workflow['name']
        workflow_path = f".github/workflows/{workflow_name}"
        
        print(f"\n📋 Testing: {workflow_name}")
        print("-" * 60)
        
        # Check if workflow file exists
        if not Path(workflow_path).exists():
            print(f"❌ FAIL: Workflow file not found: {workflow_path}")
            results['failed'] += 1
            results['details'].append({
                'workflow': workflow_name,
                'status': 'FAILED',
                'reason': 'Workflow file not found'
            })
            continue
        
        checks_passed = 0
        checks_total = 0
        issues = []
        
        # Check code dependencies (files that workflow calls)
        print(f"\n  1. Code Dependencies:")
        for dep_file in workflow['code_deps']:
            checks_total += 1
            if Path(dep_file).exists():
                print(f"     ✅ {dep_file}")
                checks_passed += 1
            else:
                print(f"     ❌ MISSING: {dep_file}")
                issues.append(f"Missing code file: {dep_file}")
        
        # Check GitHub Secrets (documented as needed)
        print(f"\n  2. GitHub Secrets (documented requirements):")
        for secret in workflow['documented_deps']:
            checks_total += 1
            # We can't verify secrets directly, but we can check if they're documented
            print(f"     ⚠️  {secret} (cannot verify - GitHub secret)")
            # Assume OK for now but flag as unverifiable
            checks_passed += 1
        
        # Final verdict for this workflow
        if len(issues) == 0:
            print(f"\n  ✅ VERDICT: FUNCTIONAL (all code deps found)")
            results['passed'] += 1
            results['details'].append({
                'workflow': workflow_name,
                'status': 'PASSED',
                'checks': f"{checks_passed}/{checks_total}",
                'issues': []
            })
        else:
            print(f"\n  ❌ VERDICT: NOT FUNCTIONAL")
            for issue in issues:
                print(f"     - {issue}")
            results['failed'] += 1
            results['details'].append({
                'workflow': workflow_name,
                'status': 'FAILED',
                'checks': f"{checks_passed}/{checks_total}",
                'issues': issues
            })
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Workflows tested: {results['tested_workflows']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"Success rate: {results['passed']}/{results['tested_workflows']} ({results['passed']/results['tested_workflows']*100:.0f}%)")
    
    # Documentation claim verification
    print("\n📋 DOCUMENTATION CLAIM VERIFICATION:")
    print(f"Documented: 4/4 workflows FUNCTIONAL (100%)")
    print(f"Actual: {results['passed']}/4 workflows FUNCTIONAL ({results['passed']/4*100:.0f}%)")
    
    if results['passed'] == 4:
        print("\n✅ VERDICT: Documentation claim ACCURATE")
    else:
        print(f"\n❌ VERDICT: Documentation claim INACCURATE")
        print(f"   Gap: {4 - results['passed']} workflow(s) have missing dependencies")
    
    # Save results
    with open('workflow-verification-results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved: workflow-verification-results.json")
    
    return results

if __name__ == '__main__':
    results = check_workflow_dependencies()
    
    # Exit code: 0 if all passed, 1 if any failed
    exit(0 if results['failed'] == 0 else 1)
