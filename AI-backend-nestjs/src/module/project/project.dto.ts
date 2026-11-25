import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Validated body for creating a project (class-validator rules on each field).
export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  // Required name, 1 to 80 characters.
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  // Optional description, up to 500 characters.
  description?: string;
}
