import { IsEnum, IsNotEmpty } from 'class-validator';
import { FriendshipStatus } from '@prisma/client';

export class UpdateFriendshipDto {
  @IsNotEmpty()
  @IsEnum(FriendshipStatus)
  status: FriendshipStatus;
}
