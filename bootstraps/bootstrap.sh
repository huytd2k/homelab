#!/bin/bash

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Check if k3s is installed
if ! command -v k3s &>/dev/null; then
  echo "k3s is not installed. Please install k3s before running this script."
  exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &>/dev/null; then
  echo "kubectl is not installed. Please install kubectl before running this script."
  exit 1
fi

# Check if k3s config exists
K3S_CONFIG="/etc/rancher/k3s/k3s.yaml"
if [ ! -f "$K3S_CONFIG" ]; then
  echo "k3s config not found at $K3S_CONFIG. Please ensure k3s is correctly configured."
  exit 1
fi

# Variables
RUNNER_VERSION="2.305.0"  # Replace with the latest runner version
RUNNER_USER="github-runner"
RUNNER_DIR="/home/$RUNNER_USER/actions-runner"

# Prompt for GitHub repository URL
read -p "Enter your GitHub repository URL (e.g., https://github.com/huytd2k/homelab): " REPO_URL
if [ -z "$REPO_URL" ]; then
  echo "Repository URL is required. Exiting."
  exit 1
fi

# Prompt for GitHub runner token
read -s -p "Enter your GitHub runner token: " RUNNER_TOKEN
echo ""
if [ -z "$RUNNER_TOKEN" ]; then
  echo "Runner token is required. Exiting."
  exit 1
fi

# Create a new Linux user for the runner
echo "Creating user $RUNNER_USER..."
if id "$RUNNER_USER" &>/dev/null; then
  echo "User $RUNNER_USER already exists"
else
  useradd --create-home --shell /bin/bash $RUNNER_USER
  echo "User $RUNNER_USER created"
fi

# Download GitHub Actions runner
echo "Downloading GitHub Actions runner..."
mkdir -p $RUNNER_DIR
chown $RUNNER_USER:$RUNNER_USER $RUNNER_DIR
su - $RUNNER_USER -c "
  cd $RUNNER_DIR &&
  curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v$RUNNER_VERSION/actions-runner-linux-x64-$RUNNER_VERSION.tar.gz &&
  tar xzf actions-runner.tar.gz &&
  rm actions-runner.tar.gz
"

# Configure the runner
echo "Configuring the GitHub Actions runner..."
su - $RUNNER_USER -c "
  cd $RUNNER_DIR &&
  ./config.sh --url $REPO_URL --token $RUNNER_TOKEN --unattended --replace --name $(hostname)
"

# Grant kubectl access to the runner user
echo "Granting kubectl access to $RUNNER_USER..."
mkdir -p /home/$RUNNER_USER/.kube
cp "$K3S_CONFIG" /home/$RUNNER_USER/.kube/config
chown -R $RUNNER_USER:$RUNNER_USER /home/$RUNNER_USER/.kube
chmod 600 /home/$RUNNER_USER/.kube/config

# Start the runner
echo "Starting the GitHub Actions runner..."
su - $RUNNER_USER -c "
  cd $RUNNER_DIR &&
  ./run.sh
"

echo "GitHub Actions runner setup complete. It's now active and has kubectl access."
