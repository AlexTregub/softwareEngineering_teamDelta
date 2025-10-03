#!/usr/bin/env python3
"""
Test runner for Selenium-based button rendering tests
Handles test execution, reporting, and cleanup
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path

class TestRunner:
    def __init__(self):
        self.server_process = None
        self.base_dir = Path(__file__).parent.parent.parent
        self.test_dir = self.base_dir / "test" / "selenium"
        
    def start_local_server(self):
        """Start the local HTTP server for testing"""
        print("🚀 Starting local server...")
        
        try:
            # Start Python HTTP server
            self.server_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", "8000"],
                cwd=self.base_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Give server time to start
            time.sleep(2)
            
            # Check if server is running
            if self.server_process.poll() is None:
                print("✅ Server started on http://localhost:8000")
                return True
            else:
                print("❌ Failed to start server")
                return False
                
        except Exception as e:
            print(f"❌ Error starting server: {e}")
            return False
    
    def stop_local_server(self):
        """Stop the local HTTP server"""
        if self.server_process:
            print("🛑 Stopping local server...")
            self.server_process.terminate()
            try:
                self.server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server_process.kill()
            print("✅ Server stopped")
    
    def run_button_tests(self):
        """Run the button rendering tests"""
        print("🧪 Running button rendering tests...")
        
        test_script = self.test_dir / "test_button_rendering.py"
        
        try:
            # Set a timeout of 5 minutes for the entire test suite
            result = subprocess.run(
                [sys.executable, str(test_script)],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes
            )
            
            print("📝 Test Output:")
            print(result.stdout)
            
            if result.stderr:
                print("⚠️ Test Errors:")
                print(result.stderr)
            
            return result.returncode == 0
            
        except subprocess.TimeoutExpired:
            print("Tests timed out after 5 minutes - likely stuck loading")
            return False
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return False
    
    def run_all_tests(self):
        """Run all Selenium tests with proper setup and cleanup"""
        print("🎯 Starting Selenium Test Suite")
        print("=" * 50)
        
        success = False
        
        try:
            # Start server
            if not self.start_local_server():
                return False
            
            # Run tests
            success = self.run_button_tests()
            
            print("=" * 50)
            if success:
                print("🎉 All tests completed successfully!")
            else:
                print("❌ Some tests failed")
            
        except KeyboardInterrupt:
            print("\n⏹️ Tests interrupted by user")
            
        finally:
            # Always clean up
            self.stop_local_server()
        
        return success

if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all_tests()
    sys.exit(0 if success else 1)