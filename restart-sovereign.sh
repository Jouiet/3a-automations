#!/bin/bash
# 3A Automation - Surgical Restart Strategy
# Ensures system updates don't kill the IDE (Antigravity/Gemini)

echo "🚀 Starting Surgical Restart Strategy..."

# 1. Identify and kill project-specific processes
echo "Killing existing project-specific Node processes..."
# We filter by common paths to avoid pkill -f (which kills everything)
PIDS=$(ps aux | grep -E "server.js|autonomy-daemon.cjs|doe-dispatcher.cjs|at-risk-customer-flow.cjs" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "No matching processes found."
else
    for pid in $PIDS; do
        echo "Killing PID: $pid"
        kill -9 $pid
    done
fi

echo "✅ System cleared."

# 2. Restart core services
echo "Restarting Core Services..."

# Autonomy Daemon (L5 Heartbeat)
nohup node ./automations/agency/core/autonomy-daemon.cjs --dry-run > ./logs/daemon.log 2>&1 &
echo "Started Autonomy Daemon (PID: $!)"

# A2A Server
nohup node ./automations/a2a/server.js > ./logs/a2a.log 2>&1 &
echo "Started A2A Server (PID: $!)"

echo "✨ Surgical Restart Complete. System is now LIVE & SOVEREIGN."
