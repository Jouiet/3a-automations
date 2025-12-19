# © 2025 MyDealz. All rights reserved.
# See LICENSE file for details.

#!/usr/bin/env python3
"""
Batch Test Script for Blog Automation
PROFESSIONAL-GRADE TESTING - Zero Bullshit, Only Facts

Purpose: Generate 15-20 articles systematically to validate REAL success rate
Output: Detailed metrics report with brutal honesty
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path

# Test topics based on catalog analysis
TEST_TOPICS = [
    # High-confidence topics (8+ products verified)
    {'topic': 'mug', 'expected_products': 16, 'confidence': 'HIGH'},
    {'topic': 'light', 'expected_products': 16, 'confidence': 'HIGH'},
    {'topic': 'backpack', 'expected_products': 13, 'confidence': 'HIGH'},
    {'topic': 'cup', 'expected_products': 12, 'confidence': 'HIGH'},
    {'topic': 'bag', 'expected_products': 11, 'confidence': 'HIGH'},
    {'topic': 'travel', 'expected_products': 9, 'confidence': 'HIGH'},
    {'topic': 'lamp', 'expected_products': 8, 'confidence': 'HIGH'},

    # Medium-confidence topics (6-7 products - borderline)
    {'topic': 'case', 'expected_products': 7, 'confidence': 'MEDIUM'},
    {'topic': 'desk', 'expected_products': 6, 'confidence': 'MEDIUM'},

    # Product type based topics
    {'topic': 'office', 'expected_products': 11, 'confidence': 'HIGH'},  # Office Supplies category
    {'topic': 'electronics', 'expected_products': 13, 'confidence': 'HIGH'},  # Electronics category

    # Compound topics (might work)
    {'topic': 'coffee mug', 'expected_products': '?', 'confidence': 'LOW'},
    {'topic': 'water bottle', 'expected_products': '?', 'confidence': 'LOW'},
    {'topic': 'laptop bag', 'expected_products': '?', 'confidence': 'LOW'},
    {'topic': 'desk lamp', 'expected_products': '?', 'confidence': 'LOW'},
]


class BatchTester:
    """Professional-grade batch testing with factual reporting"""

    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.results = []
        self.start_time = None
        self.report_file = Path(f'/tmp/batch_test_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md')

    def run_single_test(self, topic: str, expected_products: int, confidence: str) -> dict:
        """Run single article generation and return factual results"""
        print(f"\n{'='*80}")
        print(f"Testing: {topic} (Expected: {expected_products} products, Confidence: {confidence})")
        print('='*80)

        test_start = time.time()
        result = {
            'topic': topic,
            'expected_products': expected_products,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
            'success': False,
            'validation_passed': False,
            'error': None,
            'metrics': {}
        }

        try:
            # Run automation script
            cmd = [
                'python3',
                str(self.project_root / 'scripts' / 'fully_automated_article_workflow.py'),
                '--topic', topic,
                '--dry-run'
            ]

            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 min timeout
            )

            output = process.stdout + process.stderr

            # Parse output for metrics
            metrics = self._parse_output(output)
            result['metrics'] = metrics

            # Check if workflow succeeded
            if process.returncode == 0:
                result['success'] = True

                # Check validation status
                if '100% compliant' in output:
                    result['validation_passed'] = True
                elif 'failed validation' in output:
                    result['validation_passed'] = False
                    result['error'] = 'Validation failed'

            else:
                result['success'] = False
                result['error'] = self._extract_error(output)

        except subprocess.TimeoutExpired:
            result['error'] = 'Timeout (>5 min)'
        except Exception as e:
            result['error'] = str(e)

        result['duration'] = time.time() - test_start

        # Print immediate result
        status = '✅ PASS' if result['validation_passed'] else '❌ FAIL'
        print(f"\nResult: {status}")
        if result['metrics']:
            print(f"  - Length: {result['metrics'].get('length', 'N/A')} chars")
            print(f"  - Images: {result['metrics'].get('images', 'N/A')}")
            print(f"  - Products: {result['metrics'].get('products', 'N/A')}")
        if result['error']:
            print(f"  - Error: {result['error']}")

        return result

    def _parse_output(self, output: str) -> dict:
        """Extract metrics from script output"""
        metrics = {}

        # Extract length
        if 'Length:' in output:
            for line in output.split('\n'):
                if 'Length:' in line:
                    try:
                        length_str = line.split('Length:')[1].split('characters')[0].strip()
                        metrics['length'] = int(length_str.replace(',', ''))
                    except:
                        pass

        # Extract images
        if 'Images:' in output:
            for line in output.split('\n'):
                if 'Images:' in line and 'Product links:' not in line:
                    try:
                        images_str = line.split('Images:')[1].strip()
                        metrics['images'] = int(images_str)
                    except:
                        pass

        # Extract product links
        if 'Product links:' in output:
            for line in output.split('\n'):
                if 'Product links:' in line:
                    try:
                        products_str = line.split('Product links:')[1].strip()
                        metrics['products'] = int(products_str)
                    except:
                        pass

        return metrics

    def _extract_error(self, output: str) -> str:
        """Extract error message from output"""
        if 'ValueError:' in output:
            for line in output.split('\n'):
                if 'ValueError:' in line:
                    return line.split('ValueError:')[1].strip()
        if 'ERROR' in output:
            for line in output.split('\n'):
                if 'ERROR' in line:
                    return line.strip()
        return 'Unknown error'

    def run_batch(self, topics: list):
        """Run batch test on all topics"""
        self.start_time = time.time()

        print("\n" + "="*80)
        print("BATCH TEST - PROFESSIONAL-GRADE VALIDATION")
        print("="*80)
        print(f"Topics to test: {len(topics)}")
        print(f"Started: {datetime.now().isoformat()}")
        print("="*80 + "\n")

        for i, topic_data in enumerate(topics, 1):
            print(f"\n[{i}/{len(topics)}]", end=" ")
            result = self.run_single_test(
                topic_data['topic'],
                topic_data['expected_products'],
                topic_data['confidence']
            )
            self.results.append(result)

            # Brief pause between tests
            time.sleep(2)

    def generate_report(self):
        """Generate detailed factual report"""
        total_time = time.time() - self.start_time

        # Calculate statistics
        total_tests = len(self.results)
        successful_runs = sum(1 for r in self.results if r['success'])
        validation_passed = sum(1 for r in self.results if r['validation_passed'])

        # Categorize by confidence
        high_conf = [r for r in self.results if r['confidence'] == 'HIGH']
        medium_conf = [r for r in self.results if r['confidence'] == 'MEDIUM']
        low_conf = [r for r in self.results if r['confidence'] == 'LOW']

        high_pass = sum(1 for r in high_conf if r['validation_passed'])
        medium_pass = sum(1 for r in medium_conf if r['validation_passed'])
        low_pass = sum(1 for r in low_conf if r['validation_passed'])

        # Generate report
        report = []
        report.append("# BATCH TEST REPORT - BRUTAL HONESTY")
        report.append(f"**Generated:** {datetime.now().isoformat()}")
        report.append(f"**Total Duration:** {total_time/60:.1f} minutes")
        report.append("")
        report.append("---")
        report.append("")
        report.append("## 🎯 EXECUTIVE SUMMARY (NO BULLSHIT)")
        report.append("")
        report.append(f"**Total Tests:** {total_tests}")
        report.append(f"**Successful Runs:** {successful_runs}/{total_tests} ({successful_runs/total_tests*100:.1f}%)")
        report.append(f"**Validation Passed:** {validation_passed}/{total_tests} ({validation_passed/total_tests*100:.1f}%)")
        report.append("")
        report.append(f"**REAL SUCCESS RATE:** {validation_passed/total_tests*100:.1f}% (not projected, MEASURED)")
        report.append("")
        report.append("### Success Rate by Confidence Level")
        report.append("")
        report.append(f"- **HIGH Confidence Topics:** {high_pass}/{len(high_conf)} = {high_pass/len(high_conf)*100:.1f}% (8+ products)")
        report.append(f"- **MEDIUM Confidence Topics:** {medium_pass}/{len(medium_conf)} = {medium_pass/len(medium_conf)*100:.1f}% (6-7 products)")
        report.append(f"- **LOW Confidence Topics:** {low_pass}/{len(low_conf)} = {low_pass/len(low_conf)*100:.1f}% (unknown products)")
        report.append("")
        report.append("---")
        report.append("")
        report.append("## 📊 DETAILED RESULTS (EVERY TEST)")
        report.append("")

        for i, result in enumerate(self.results, 1):
            status_emoji = "✅" if result['validation_passed'] else "❌"
            report.append(f"### Test {i}: {result['topic']} {status_emoji}")
            report.append("")
            report.append(f"- **Expected Products:** {result['expected_products']}")
            report.append(f"- **Confidence:** {result['confidence']}")
            report.append(f"- **Workflow Success:** {'✅ Yes' if result['success'] else '❌ No'}")
            report.append(f"- **Validation Passed:** {'✅ Yes' if result['validation_passed'] else '❌ No'}")
            report.append(f"- **Duration:** {result['duration']:.1f} seconds")

            if result['metrics']:
                report.append(f"- **Metrics:**")
                report.append(f"  - Length: {result['metrics'].get('length', 'N/A')} characters")
                report.append(f"  - Images: {result['metrics'].get('images', 'N/A')}")
                report.append(f"  - Product Links: {result['metrics'].get('products', 'N/A')}")

            if result['error']:
                report.append(f"- **Error:** {result['error']}")

            report.append("")

        report.append("---")
        report.append("")
        report.append("## 🔍 FAILURE ANALYSIS (ROOT CAUSES)")
        report.append("")

        failures = [r for r in self.results if not r['validation_passed']]
        if failures:
            # Group by error type
            error_groups = {}
            for failure in failures:
                error_key = failure['error'] if failure['error'] else 'Unknown'
                if error_key not in error_groups:
                    error_groups[error_key] = []
                error_groups[error_key].append(failure['topic'])

            for error, topics in error_groups.items():
                report.append(f"### Error: {error}")
                report.append(f"**Frequency:** {len(topics)}/{total_tests} tests ({len(topics)/total_tests*100:.1f}%)")
                report.append(f"**Affected Topics:** {', '.join(topics)}")
                report.append("")
        else:
            report.append("🎉 NO FAILURES - 100% SUCCESS RATE")
            report.append("")

        report.append("---")
        report.append("")
        report.append("## 💡 CONCLUSIONS (FACTUAL)")
        report.append("")

        if validation_passed / total_tests >= 0.95:
            report.append(f"✅ **CLAIM VALIDATED:** 95%+ success rate CONFIRMED ({validation_passed/total_tests*100:.1f}%)")
        else:
            report.append(f"❌ **CLAIM REJECTED:** Actual success rate is {validation_passed/total_tests*100:.1f}%, NOT 95%+")

        report.append("")
        report.append("### Recommendations")
        report.append("")

        if high_pass / len(high_conf) >= 0.95:
            report.append("- ✅ HIGH confidence topics (8+ products) meet 95%+ threshold")
            report.append("- 💡 Restrict production use to topics with 8+ matching products")
        else:
            report.append(f"- ⚠️ Even HIGH confidence topics only achieve {high_pass/len(high_conf)*100:.1f}% success")
            report.append("- 🔧 Further improvements needed before production use")

        report.append("")
        report.append("---")
        report.append("")
        report.append("**Test Framework:** Professional-grade batch testing")
        report.append("**Verification Level:** Factual, reproducible, no projections")
        report.append("**Transparency:** 100% - all results disclosed")
        report.append("")
        report.append("🚀 Generated with Claude Code")
        report.append("Co-Authored-By: Claude <noreply@anthropic.com>")

        # Write report
        self.report_file.write_text('\n'.join(report), encoding='utf-8')

        return self.report_file


def main():
    tester = BatchTester()
    tester.run_batch(TEST_TOPICS)
    report_path = tester.generate_report()

    print("\n" + "="*80)
    print("BATCH TEST COMPLETED")
    print("="*80)
    print(f"\n📊 Report generated: {report_path}")
    print("\nTo view report:")
    print(f"cat {report_path}")
    print("\n" + "="*80)


if __name__ == '__main__':
    main()
