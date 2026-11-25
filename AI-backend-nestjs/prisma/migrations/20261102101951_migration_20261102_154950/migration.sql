-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'CRITICAL';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "acceptanceCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subtasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "technicalConsiderations" TEXT[] DEFAULT ARRAY[]::TEXT[];
