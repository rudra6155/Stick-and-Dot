import subprocess
import os
import sys
import time
import ctypes
import contextlib

# Windows Power Management flags to prevent system sleep
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

@contextlib.contextmanager
def prevent_sleep():
    """Context manager to prevent Windows system sleep during long-running tasks."""
    try:
        print("Enabling sleep prevention (system and display will stay awake)...")
        # Prevent system sleep by calling Windows kernel API
        ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
        )
        yield
    except Exception as e:
        print(f"Warning: Could not enable sleep prevention: {e}")
        yield
    finally:
        print("Restoring default sleep settings...")
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)

def main():
    os.makedirs('logs', exist_ok=True)
    
    # Use system python as it has the required dependencies installed
    python_exe = 'python'
        
    print(f"Using python executable: {python_exe}")
    
    # Define tasks to run concurrently (using -u for unbuffered output)
    tasks = {
        "traditional_fetcher": [python_exe, "-u", "traditional_fetcher.py"],
        "historical_fetcher": [python_exe, "-u", "historical_fetcher.py", "--skip-setup"],
        "coingecko_fetcher": [python_exe, "-u", "coingecko_fetcher.py"],
        "etf_fetcher": [python_exe, "-u", "etf_fetcher.py"]
    }
    
    processes = {}
    log_files = {}
    
    try:
        with prevent_sleep():
            # Start processes concurrently
            for name, cmd in tasks.items():
                log_path = f"logs/{name}.log"
                print(f"Starting {name} background process (logging to {log_path})...")
                log_file = open(log_path, "w", encoding="utf-8")
                log_files[name] = log_file
                
                p = subprocess.Popen(
                    cmd,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    text=True
                )
                processes[name] = p
                
            print("\nAll fetchers successfully launched. Monitoring progress...")
            
            # Monitor processes
            while processes:
                time.sleep(10)
                finished = []
                for name, p in processes.items():
                    exit_code = p.poll()
                    if exit_code is not None:
                        print(f"Process '{name}' finished with exit code {exit_code}.")
                        finished.append(name)
                        log_files[name].close()
                        
                for name in finished:
                    del processes[name]
                    
                if processes:
                    print(f"Still running: {', '.join(processes.keys())}")
                    
            print("\nAll fetchers completed. Running export_to_json.py...")
            export_log_path = "logs/export_to_json.log"
            export_log = open(export_log_path, "w", encoding="utf-8")
            p_export = subprocess.Popen(
                [python_exe, "export_to_json.py"],
                stdout=export_log,
                stderr=subprocess.STDOUT,
                text=True
            )
            p_export.wait()
            export_log.close()
            
            # Print results of the export
            print("Export completed. Summary:")
            try:
                with open(export_log_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    for line in lines[-10:]:
                        print("  " + line.strip())
            except Exception as e:
                print(f"  Could not read export log: {e}")
                
            print("\nDone!")
    finally:
        # Clean up any orphaned child processes on exit/interrupt
        for name, p in list(processes.items()):
            if p.poll() is None:
                print(f"Terminating background process '{name}'...")
                try:
                    p.terminate()
                    p.wait(timeout=2)
                except Exception:
                    try:
                        p.kill()
                    except Exception:
                        pass
        for f in log_files.values():
            try:
                f.close()
            except Exception:
                pass

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted. Cleaning up...")
        sys.exit(1)
