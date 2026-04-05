import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { FeedEventsService } from './feed-events.service';
import { Observable, interval } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';

@Controller('feed-events')
export class FeedEventsController {
  private readonly logger = new Logger(FeedEventsController.name);

  constructor(private readonly feedEventsService: FeedEventsService) {}

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  async streamFeedEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = user.sub;

    this.logger.log(`SSE connection opened for user: ${userId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Subscribe to feed events
    const subscription = this.feedEventsService
      .getEventStream()
      .pipe(
        // Filter events relevant to this user (you can customize this logic)
        filter((event) => {
          // For now, broadcast all new posts to everyone
          // You can add friend/follower filtering here
          return event.type === 'new_post' || event.type === 'delete_post';
        }),
      )
      .subscribe({
        next: (event) => {
          try {
            // Send event to client
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          } catch (error) {
            this.logger.error(`Failed to send event to user ${userId}:`, error);
          }
        },
        error: (error) => {
          this.logger.error(`Event stream error for user ${userId}:`, error);
          res.end();
        },
      });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Cleanup on connection close
    req.on('close', () => {
      this.logger.log(`SSE connection closed for user: ${userId}`);
      clearInterval(heartbeatInterval);
      subscription.unsubscribe();
      res.end();
    });
  }
}
