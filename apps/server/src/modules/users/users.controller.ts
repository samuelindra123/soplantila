import { Controller, Post, Delete, Get, Param, UseGuards, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  @Post(':userId/follow')
  async followUser(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.usersService.followUser(user.sub, targetUserId);
    return {
      message: 'User followed successfully',
    };
  }

  @Delete(':userId/follow')
  async unfollowUser(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.usersService.unfollowUser(user.sub, targetUserId);
    return {
      message: 'User unfollowed successfully',
    };
  }

  @Get(':userId/followers')
  async getUserFollowers(@Param('userId') userId: string) {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  async getUserFollowing(@Param('userId') userId: string) {
    return this.usersService.getFollowing(userId);
  }

  @Get(':userId/posts')
  async getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.postsService.getUserPosts(
      userId,
      user.sub,
      pageNum,
      limitNum,
    );

    return {
      message: 'Posts fetched successfully',
      data: result,
    };
  }

  @Get('notifications')
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.usersService.getNotifications(
      user.sub,
      pageNum,
      limitNum,
    );

    return {
      message: 'Notifications fetched successfully',
      data: result,
    };
  }

  @Get('notifications/unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.usersService.getUnreadCount(user.sub);
    return {
      message: 'Unread count fetched successfully',
      data: { count },
    };
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      return {
        message: 'User not found',
        data: null,
      };
    }

    return {
      message: 'User fetched successfully',
      data: user,
    };
  }

  @Post('notifications/:notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.usersService.markNotificationAsRead(notificationId, user.sub);
    return {
      message: 'Notification marked as read',
    };
  }

  @Post('notifications/read-all')
  async markAllNotificationsAsRead(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.markAllNotificationsAsRead(user.sub);
    return {
      message: 'All notifications marked as read',
    };
  }
}
