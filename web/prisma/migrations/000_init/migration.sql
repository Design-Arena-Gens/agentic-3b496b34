-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sourceMessageId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "remindAt" TIMESTAMP(3),
    "earlyRemindAt" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_chatId_status_dueAt_idx" ON "Task"("chatId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_chatId_remindAt_idx" ON "Task"("chatId", "remindAt");

-- CreateIndex
CREATE INDEX "Task_chatId_earlyRemindAt_idx" ON "Task"("chatId", "earlyRemindAt");

