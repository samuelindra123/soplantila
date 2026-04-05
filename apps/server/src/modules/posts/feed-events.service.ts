import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface FeedEvent {
  type: 'new_post' | 'delete_post' | 'update_post';
  postId: string;
  userId: string;
  data?: any;
  timestamp: number;
}

@Injectable()
export class FeedEventsService {
  private readonly logger = new Logger(FeedEventsService.name);
  private readonly eventSubject = new Subject<FeedEvent>();

  /**
   * Get observable stream for SSE
   */
  getEventStream() {
    return this.eventSubject.asObservable();
  }

  /**
   * Broadcast new post event to all connected clients
   */
  broadcastNewPost(postId: string, userId: string, postData: any) {
    const event: FeedEvent = {
      type: 'new_post',
      postId,
      userId,
      data: postData,
      timestamp: Date.now(),
    };

    this.logger.log(`Broadcasting new post: ${postId} from user: ${userId}`);
    this.eventSubject.next(event);
  }

  /**
   * Broadcast post deletion
   */
  broadcastDeletePost(postId: string, userId: string) {
    const event: FeedEvent = {
      type: 'delete_post',
      postId,
      userId,
      timestamp: Date.now(),
    };

    this.logger.log(`Broadcasting post deletion: ${postId}`);
    this.eventSubject.next(event);
  }

  /**
   * Broadcast post update
   */
  broadcastUpdatePost(postId: string, userId: string, postData: any) {
    const event: FeedEvent = {
      type: 'update_post',
      postId,
      userId,
      data: postData,
      timestamp: Date.now(),
    };

    this.logger.log(`Broadcasting post update: ${postId}`);
    this.eventSubject.next(event);
  }
}
