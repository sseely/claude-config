#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
    python scripts/with_server.py --server "npm start" --port 3000 -- python test.py

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- python test.py
"""

import subprocess
import socket
import time
import sys
import argparse

def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('localhost', port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def _parse_args():
    """Parse and validate CLI arguments."""
    parser = argparse.ArgumentParser(description='Run command with one or more servers')
    parser.add_argument('--server', action='append', dest='servers', required=True, help='Server command (can be repeated)')
    parser.add_argument('--port', action='append', dest='ports', type=int, required=True, help='Port for each server (must match --server count)')
    parser.add_argument('--timeout', type=int, default=30, help='Timeout in seconds per server (default: 30)')
    parser.add_argument('command', nargs=argparse.REMAINDER, help='Command to run after server(s) ready')

    args = parser.parse_args()

    # Remove the '--' separator if present
    if args.command and args.command[0] == '--':
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run")
        sys.exit(1)

    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match")
        sys.exit(1)

    return args


def _start_servers(servers, timeout):
    """Start each server and wait for it to become ready.

    Returns the list of Popen processes, in start order.
    """
    server_processes = []
    for i, server in enumerate(servers):
        print(f"Starting server {i+1}/{len(servers)}: {server['cmd']}")

        # Use shell=True to support commands with cd and &&. Output
        # inherits the terminal instead of buffering unread.
        process = subprocess.Popen(server['cmd'], shell=True)
        server_processes.append(process)

        print(f"Waiting for server on port {server['port']}...")
        if not is_server_ready(server['port'], timeout=timeout):
            raise RuntimeError(
                f"Server failed to start on port {server['port']} within "
                f"{timeout}s (command: {server['cmd']!r})"
            )

        print(f"Server ready on port {server['port']}")

    print(f"\nAll {len(server_processes)} server(s) ready")
    return server_processes


def _stop_servers(server_processes):
    """Terminate (or kill) every started server process."""
    print(f"\nStopping {len(server_processes)} server(s)...")
    for i, process in enumerate(server_processes):
        try:
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        print(f"Server {i+1} stopped")
    print("All servers stopped")


def main():
    args = _parse_args()
    servers = [{'cmd': cmd, 'port': port} for cmd, port in zip(args.servers, args.ports)]

    server_processes = []
    try:
        server_processes = _start_servers(servers, args.timeout)

        print(f"Running: {' '.join(args.command)}\n")
        result = subprocess.run(args.command)
        sys.exit(result.returncode)
    finally:
        _stop_servers(server_processes)


if __name__ == '__main__':
    main()
