import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(req.user.sub, dto);
  }

  @Get('conversation/:otherUserId')
  async getConversation(
    @Request() req,
    @Param('otherUserId') otherUserId: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getConversation(
      req.user.sub,
      otherUserId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('conversations')
  async getConversationList(@Request() req) {
    return this.messagingService.getConversationList(req.user.sub);
  }

  @Post('mark-read/:otherUserId')
  async markAsRead(@Request() req, @Param('otherUserId') otherUserId: string) {
    return this.messagingService.markAsRead(req.user.sub, otherUserId);
  }

  @Get('can-send/:receiverId')
  async canSendMessage(@Request() req, @Param('receiverId') receiverId: string) {
    const canSend = await this.messagingService.canSendMessage(
      req.user.sub,
      receiverId,
    );
    return { canSend };
  }
}
