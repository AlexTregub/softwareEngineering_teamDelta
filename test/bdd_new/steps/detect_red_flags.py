#!/usr/bin/env python3
"""
RED FLAG Pattern Detection Script
Scans ALL test files for fake results and weak test patterns

This script enforces Testing Methodolo        else:
            print(f"\nTests pass but have weak patterns")
            return TrueStandards by:
- Detecting hardcoded test results
- Finding fake success simulations  
- Identifying weak test patterns
- Reporting methodology violations

Author: Software Engineering Team Delta - David Willman
Version: 1.0.0 - Zero Tolerance for Fake Results
"""

import os
import re
import sys
from pathlib import Path


class RedFlagDetector:
    """Detects RED FLAG patterns in test files"""
    
    def __init__(self):
        self.test_dir = Path(__file__).parent.parent
        self.violations = []
        
        # CRITICAL RED FLAGS - These cause immediate failure
        self.critical_patterns = [
            # Fake test results - NEVER acceptable (but allow 0 for honest failure reporting)
            r"tests_run\s*=\s*[1-9]\d*",  # Any non-zero hardcoded number
            r"tests_passed\s*=\s*[1-9]\d*", 
            r"tests_failed\s*=\s*[1-9]\d*",
            r"results\[.*\]\s*=\s*[1-9]\d*",  # Any non-zero hardcoded number
            
            # Fake success patterns (but exclude comments and pattern definitions)
            r"^\s*[^#]*simulate.*successful.*test.*execution",  # Exclude comments
            r"^\s*[^#]*return\s+True\s*#.*simulate",  # Hardcoded True with simulate comment
            r"tests_run\s*=\s*\d+\s*#.*simulated",  # Commented simulated results
            
            # Placeholder tests (but exclude pattern definitions in quotes)
            r"^\s*[^'\"#]*expect\(true\)\.to\.be\.true",  # Exclude quoted patterns and comments
            r"assert\s+True\s*#.*placeholder",
            r"pass\s*#.*TODO",
        ]
        
        # WARNING RED FLAGS - Weak patterns but not critical
        self.warning_patterns = [
            r"expect\(\w+\)\.to\.equal\(\d+\)",  # Loop counters
            r"expect\(\w+\.length\)\.to\.equal\(\d+\)",  # Array length validation
            r"expect\(\w+\)\.to\.be\.lessThan\(\w+\)",  # Basic math
            r"\.some\(\w+\s*=>\s*\w+\s*[<>]=?\s*\d+\)",  # Language feature testing
        ]
    
    def scan_file(self, file_path):
        """Scan a single file for RED FLAG patterns"""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            file_violations = []
            
            # Check critical patterns
            for pattern in self.critical_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    file_violations.append({
                        'type': 'CRITICAL',
                        'pattern': pattern,
                        'match': match.group(),
                        'line': line_num,
                        'file': file_path
                    })
            
            # Check warning patterns
            for pattern in self.warning_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    file_violations.append({
                        'type': 'WARNING',
                        'pattern': pattern,
                        'match': match.group(),
                        'line': line_num,
                        'file': file_path
                    })
            
            return file_violations
            
        except Exception as e:
            print(f"Could not scan {file_path}: {e}")
            return []
    
    def scan_all_tests(self):
        """Scan all test files for RED FLAG patterns"""
        print("Scanning ALL test files for RED FLAG patterns...")
        print("=" * 60)
        
        # Find all test files
        test_patterns = [
            "**/*.test.js",
            "**/*_test.py", 
            "**/*_steps.py",
            "**/test_*.py",
            "**/run_*.py",
            "**/*spec.js"
        ]
        
        scanned_files = 0
        total_violations = 0
        
        for pattern in test_patterns:
            for file_path in self.test_dir.glob(pattern):
                if file_path.is_file():
                    violations = self.scan_file(file_path)
                    if violations:
                        self.violations.extend(violations)
                        total_violations += len(violations)
                    scanned_files += 1
        
        print(f"Scanned {scanned_files} test files")
        print(f"Found {total_violations} total violations")
        
        return total_violations
    
    def report_violations(self):
        """Report all found violations"""
        if not self.violations:
            print("\nNO RED FLAG PATTERNS FOUND!")
            print("All tests pass methodology compliance")
            return True
        
        print(f"\nFOUND {len(self.violations)} RED FLAG VIOLATIONS:")
        print("=" * 60)
        
        critical_count = 0
        warning_count = 0
        
        # Group by file
        by_file = {}
        for violation in self.violations:
            file_key = str(violation['file'].relative_to(self.test_dir))
            if file_key not in by_file:
                by_file[file_key] = []
            by_file[file_key].append(violation)
        
        for file_path, file_violations in by_file.items():
            print(f"\nFile: {file_path}")
            for violation in file_violations:
                icon = "CRITICAL" if violation['type'] == 'CRITICAL' else "WARNING"
                print(f"  {icon} Line {violation['line']}: {violation['match']}")
                print(f"     Pattern: {violation['pattern']}")
                
                if violation['type'] == 'CRITICAL':
                    critical_count += 1
                else:
                    warning_count += 1
        
        print(f"\nVIOLATION SUMMARY:")
        print(f"Critical: {critical_count} (causes test failure)")
        print(f"Warning: {warning_count} (should be fixed)")
        
        if critical_count > 0:
            print("\nTESTS FAIL - Critical violations found!")
            print("Fake test results and hardcoded success are NEVER acceptable!")
            return False
        else:
            print("\nTests pass but have weak patterns")
            return True
    
    def fix_common_violations(self):
        """Suggest fixes for common violations"""
        print("\nCOMMON FIXES:")
        print("=" * 60)
        
        print("For fake test results:")
        print("   NEVER: tests_passed = 17")
        print("   DO: Parse actual test execution results")
        print("   DO: Set to 0 when tests can't run (be honest)")
        
        print("\nFor simulated success:")
        print("   NEVER: # simulate successful test execution")  
        print("   DO: Execute real tests or fail with clear message")
        
        print("\nFor loop counters:")
        print("   WEAK: expect(counter).to.equal(5)")
        print("   STRONG: Test actual system behavior")
        
        print("\nFor array length:")
        print("   WEAK: expect(array.length).to.be.greaterThan(0)")
        print("   STRONG: Validate array contents and business logic")


def main():
    """Main entry point"""
    # Use ASCII-safe characters for Windows compatibility
    print("RED FLAG PATTERN DETECTOR")
    print("Testing Methodology Standards Enforcement")
    print("Version 1.0.0 - Zero Tolerance for Fake Results\n")
    
    detector = RedFlagDetector()
    
    # Scan all test files
    total_violations = detector.scan_all_tests()
    
    # Report violations
    methodology_compliant = detector.report_violations()
    
    # Suggest fixes
    if not methodology_compliant:
        detector.fix_common_violations()
    
    # Return appropriate exit code
    if total_violations > 0:
        critical_violations = len([v for v in detector.violations if v['type'] == 'CRITICAL'])
        if critical_violations > 0:
            print(f"\nEXIT CODE 1 - {critical_violations} critical violations found")
            return 1
        else:
            print(f"\nEXIT CODE 0 - {total_violations} warnings but no critical violations")
            return 0
    else:
        print("\nEXIT CODE 0 - Perfect methodology compliance!")
        return 0


if __name__ == '__main__':
    sys.exit(main())