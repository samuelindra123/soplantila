import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class TypingIndicatorDto {
  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsBoolean()
  isTyping: boolean;
}
