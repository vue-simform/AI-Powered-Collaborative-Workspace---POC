import { Priority, TaskStatus } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

// Validated body for creating a task. Decorators are class-validator rules; '?' fields are optional.
export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  // Required title, 1 to 120 characters.
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  // Optional longer text, up to 1000 characters.
  description?: string;

  @IsEnum(Priority)
  // Must be one of the Priority enum values from the database schema.
  priority!: Priority;

  @IsInt()
  @Min(1)
  @Max(1000)
  // Whole number from 1 to 1000 (the unit is defined by the app, e.g. hours).
  estimatedEffort!: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  // Optional starting status; must be a valid TaskStatus.
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  // Optional id of the user the task is assigned to (the service checks that user exists).
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  // Optional list (max 15) of short strings describing when the task counts as done.
  acceptanceCriteria?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  // Optional list (max 15) of smaller steps; each at most 300 characters.
  subtasks?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  // Optional list (max 15) of technical notes; each at most 300 characters.
  technicalConsiderations?: string[];
}

// Body for changing a task's status: just the new status.
export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
