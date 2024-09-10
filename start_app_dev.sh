#!/bin/bash

source /home/$USER/work/dials/conda_base/etc/profile.d/conda.sh
conda activate /home/$USER/work/dials/conda_base

# Navigate to the directory containing your server script
cd /home/$USER/work/dials_browser_gui/server

# Start the Python server in the background
python server.py &
sleep 2
SERVER_PID=$!

# Navigate to the directory containing your React client
cd /home/$USER/work/dials_browser_gui/client

# Start the React client
npm run dev &
CLIENT_PID=$!
sleep 2
npx electron .

cleanup() {
	echo "Closing client..."
	kill $CLIENT_PID
	echo "Closing server..."
	kill $SERVER_PID
}

trap cleanup EXIT

# Wait for the Python server process to finish
wait $SERVER_PID
