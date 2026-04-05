import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @ValidateIf((o) => o.messageType === MessageType.TEXT)
  @IsNotEmpty()
  @IsString()
  content?: string;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
