#!/usr/bin/env python3
"""
Integration Test Runner
Runs various integration tests and diagnostic tools for the game system.

Usage: python tests/integration/run_integration_tests.py [--debug] [--tool TOOLNAME]
"""

import sys
import os
import argparse
from datetime import datetime

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_button_debug():
    """Run button structure debug analysis"""
    print("🔍 Running Button Structure Debug...")
    try:
        from button_structure_debug import run_button_structure_debug
        result = run_button_structure_debug()
        return "error" not in result
    except ImportError as e:
        print(f"❌ Could not import button debug tool: {e}")
        return False
    except Exception as e:
        print(f"❌ Button debug failed: {e}")
        return False

def run_all_integration_tests():
    """Run all available integration tests"""
    print("🚀 Starting Integration Test Suite")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tests = [
        ("Button Structure Debug", run_button_debug)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 40)
        
        try:
            success = test_func()
            results[test_name] = "✅ PASS" if success else "❌ FAIL"
        except Exception as e:
            results[test_name] = f"❌ ERROR: {e}"
            print(f"Unexpected error in {test_name}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        print(f"{test_name:.<40} {result}")
    
    passed = sum(1 for r in results.values() if r.startswith("✅"))
    total = len(results)
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All integration tests passed!")
        return True
    else:
        print("⚠️ Some integration tests failed.")
        return False

def main():
    """Main entry point with argument parsing"""
    parser = argparse.ArgumentParser(description='Integration Test Runner')
    parser.add_argument('--debug', action='store_true', 
                       help='Run in debug mode with verbose output')
    parser.add_argument('--tool', choices=['button-debug'], 
                       help='Run specific diagnostic tool')
    
    args = parser.parse_args()
    
    if args.tool == 'button-debug':
        success = run_button_debug()
        sys.exit(0 if success else 1)
    else:
        success = run_all_integration_tests()
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()