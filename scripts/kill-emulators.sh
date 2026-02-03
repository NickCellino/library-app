#!/bin/bash
# Kill any stale Firebase emulator processes (Java processes on emulator ports)

# Kill processes on emulator ports
for port in 8080 9099 5001 9199 4000; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (pid: $pid)"
    kill $pid 2>/dev/null
  fi
done

# Also kill any lingering firebase emulator java processes
pkill -f "firebase-tools.*emulator" 2>/dev/null
pkill -f "cloud-firestore-emulator" 2>/dev/null

exit 0
