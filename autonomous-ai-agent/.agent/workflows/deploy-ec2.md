---
description: Deploy backend to EC2 using Docker (image transfer via SCP, no GitHub)
---

# Deploy Backend to EC2 via Docker Hub

## Prerequisites
- AWS EC2 Free Tier instance running (Amazon Linux 2 or Ubuntu)
- Termius connected to EC2 via SSH
- Docker Desktop installed locally on Windows
- Docker Hub account (username: `harsh`)

---

## Step 1: Build & Push Docker Image to Docker Hub

Open PowerShell in your project root:

```powershell
cd d:\Google-Antegirty\Autonomous-Wallet\autonomous-ai-agent

# Login to Docker Hub
docker login

# Build the image with your Docker Hub tag
docker build -t harsh/autonomous-ai-agent:latest .

# Push to Docker Hub
docker push harsh/autonomous-ai-agent:latest
```

---

## Step 2: Transfer Config Files to EC2 via Termius SFTP

Upload these 2 files to your EC2 home directory:

1. `docker-compose.yml`
2. `.env.docker`

---

## Step 3: Install Docker on EC2 (one-time setup)

SSH into EC2 via Termius:

**For Amazon Linux 2:**
```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

**For Ubuntu:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
exit
```

After logging back in, verify:
```bash
docker --version
docker-compose --version
```

---

## Step 4: Setup & Run on EC2

```bash
# Create project directory
mkdir -p ~/ai-agent
mv docker-compose.yml ~/ai-agent/
mv .env.docker ~/ai-agent/.env
cd ~/ai-agent

# Pull image & start
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

You should see:
```
🔥 Server running on http://localhost:4000
🤖 Gemini Model: gemini-2.0-flash
```

---

## Step 5: Open EC2 Security Group Port

AWS Console → EC2 → Security Groups → Edit Inbound Rules:

| Type       | Port | Source    |
|------------|------|----------|
| Custom TCP | 4000 | 0.0.0.0/0 |

---

## Step 6: Test

```
http://<YOUR_EC2_PUBLIC_IP>:4000/health
```

Your backend URL: `http://<YOUR_EC2_PUBLIC_IP>:4000`

---

## Step 7: Deploy Frontend to Vercel

Set env variable: `VITE_API_URL` = `http://<YOUR_EC2_PUBLIC_IP>:4000`

---

## Update Deployment

When you make code changes:

```powershell
# On Windows - rebuild & push
docker build -t harsh/autonomous-ai-agent:latest .
docker push harsh/autonomous-ai-agent:latest
```

```bash
# On EC2 - pull & restart
cd ~/ai-agent
docker-compose pull backend
docker-compose up -d
```

---

## Useful EC2 Commands

```bash
docker-compose logs -f backend    # View logs
docker-compose restart backend    # Restart
docker-compose down               # Stop all
docker-compose down -v            # Stop + delete DB data
```
