import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// DTO = describes and validates the request body. The decorators below are class-validator rules; bad input gets a
// 400.
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  // Display name: text, 2 to 80 characters.
  name!: string;

  @IsEmail()
  // Must look like a valid email address.
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'password must contain a letter and a number' })
  // Password: 8-72 chars (72 is bcrypt's limit) and it needs at least one letter and one number.
  password!: string;
}

// Body of the login request. Only checks the shape, not password strength (the account already exists).
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
