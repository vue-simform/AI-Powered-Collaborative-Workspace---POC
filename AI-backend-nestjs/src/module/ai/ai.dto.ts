import { Priority } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

// DTO (Data Transfer Object) = a class that describes what data we accept. The decorators below are the rules;
// if a request breaks a rule, Nest rejects it with a 400 error. This one is what the client sends us.
export class GenerateTaskDto {
  // Required: the short task title typed by the manager (3-200 characters).
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  // Required: which project the task is for; its documents are used as context.
  @IsString()
  @MinLength(1)
  projectId!: string;

  // Optional extra detail from the manager.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // Optional hints for the AI, e.g. 'focus on security'.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalInstructions?: string;
}

// How well a requirement is backed by the uploaded documents.
export const REQUIREMENT_STATUSES = ['DOCUMENTED', 'PARTIALLY_DOCUMENTED', 'NOT_DOCUMENTED'] as const;
// Turns the list above into a type: one of the three strings only.
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

// One requirement found by the AI: its text, how documented it is, and which document chunks (excerpts) prove it.
export class RequirementDto {
  // The requirement sentence itself.
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  text!: string;

  // Must be one of the three allowed statuses.
  @IsEnum(REQUIREMENT_STATUSES)
  status!: RequirementStatus;

  // Ids (like 'c1') of the excerpts that back this requirement; we later check they are real.
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  sourceChunkIds!: string[];
}

// What we require from Gemini besides the task itself.
export class GeneratedAnalysisDto {
  // List of requirements; @ValidateNested also checks every item against RequirementDto.
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements!: RequirementDto[];

  // Extra ideas from the AI that are NOT confirmed by the documents.
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  suggestions!: string[];

  // A short AI summary of how well the documents cover the task.
  @IsString()
  @MaxLength(500)
  contextAssessment!: string;
}

// Shape we require from Gemini before anything is returned to the frontend.
export class GeneratedTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  // Improved task description written by the AI.
  @IsString()
  @MaxLength(2000)
  description!: string;

  // Must be a valid Priority from the database (LOW, MEDIUM, HIGH, CRITICAL).
  @IsEnum(Priority)
  priority!: Priority;

  // Estimated hours as a whole number.
  @IsInt()
  @Min(1)
  @Max(1000)
  estimatedEffort!: number;

  // Conditions that must be true for the task to count as done.
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  acceptanceCriteria!: string[];

  // Smaller steps the task can be broken into.
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  subtasks!: string[];

  // Technical things the developer should keep in mind.
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  technicalConsiderations!: string[];
}
