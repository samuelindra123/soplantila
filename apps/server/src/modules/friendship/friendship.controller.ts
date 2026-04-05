import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendshipService } from './friendship.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request')
  async sendFriendRequest(@Request() req, @Body() dto: SendFriendRequestDto) {
    return this.friendshipService.sendFriendRequest(req.user.sub, dto);
  }

  @Patch(':friendshipId/accept')
  async acceptFriendRequest(@Request() req, @Param('friendshipId') friendshipId: string) {
    return this.friendshipService.acceptFriendRequest(req.user.sub, friendshipId);
  }

  @Patch(':friendshipId/reject')
  async rejectFriendRequest(@Request() req, @Param('friendshipId') friendshipId: string) {
    return this.friendshipService.rejectFriendRequest(req.user.sub, friendshipId);
  }

  @Delete(':friendshipId')
  async removeFriend(@Request() req, @Param('friendshipId') friendshipId: string) {
    return this.friendshipService.removeFriend(req.user.sub, friendshipId);
  }

  @Delete(':friendshipId/cancel')
  async cancelFriendRequest(@Request() req, @Param('friendshipId') friendshipId: string) {
    return this.friendshipService.cancelFriendRequest(req.user.sub, friendshipId);
  }

  @Get('status/:targetUserId')
  async getFriendshipStatus(@Request() req, @Param('targetUserId') targetUserId: string) {
    return this.friendshipService.getFriendshipStatus(req.user.sub, targetUserId);
  }

  @Get('friends')
  async getFriends(@Request() req) {
    return this.friendshipService.getFriends(req.user.sub);
  }

  @Get(':userId/friends')
  async getUserFriends(@Param('userId') userId: string) {
    return this.friendshipService.getFriends(userId);
  }

  @Get('pending')
  async getPendingRequests(@Request() req) {
    return this.friendshipService.getPendingRequests(req.user.sub);
  }
}
