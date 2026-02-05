/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `encryptedPrivateKey` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AgentTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScheduledTaskStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentMemory" DROP CONSTRAINT "AgentMemory_agentId_fkey";

-- DropForeignKey
ALTER TABLE "AgentTask" DROP CONSTRAINT "AgentTask_agentId_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "encryptedPrivateKey" TEXT NOT NULL,
ADD COLUMN     "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "spendingLimit" SET DEFAULT 0.1;

-- AlterTable
ALTER TABLE "AgentMemory" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "AgentTask" ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BlockchainLog" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "gasUsed" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "BlockchainLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "cronExpr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "status" "ScheduledTaskStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainLog_txHash_key" ON "BlockchainLog"("txHash");

-- CreateIndex
CREATE INDEX "BlockchainLog_agentId_idx" ON "BlockchainLog"("agentId");

-- CreateIndex
CREATE INDEX "BlockchainLog_txHash_idx" ON "BlockchainLog"("txHash");

-- CreateIndex
CREATE INDEX "BlockchainLog_timestamp_idx" ON "BlockchainLog"("timestamp");

-- CreateIndex
CREATE INDEX "ScheduledTask_agentId_idx" ON "ScheduledTask"("agentId");

-- CreateIndex
CREATE INDEX "ScheduledTask_isActive_idx" ON "ScheduledTask"("isActive");

-- CreateIndex
CREATE INDEX "ScheduledTask_nextRunAt_idx" ON "ScheduledTask"("nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_walletAddress_key" ON "Agent"("walletAddress");

-- CreateIndex
CREATE INDEX "Agent_userId_idx" ON "Agent"("userId");

-- CreateIndex
CREATE INDEX "Agent_walletAddress_idx" ON "Agent"("walletAddress");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE INDEX "AgentMemory_agentId_idx" ON "AgentMemory"("agentId");

-- CreateIndex
CREATE INDEX "AgentMemory_createdAt_idx" ON "AgentMemory"("createdAt");

-- CreateIndex
CREATE INDEX "AgentTask_agentId_idx" ON "AgentTask"("agentId");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE INDEX "AgentTask_createdAt_idx" ON "AgentTask"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMemory" ADD CONSTRAINT "AgentMemory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
