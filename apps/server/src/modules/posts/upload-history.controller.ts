import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UploadHistoryService } from './upload-history.service';

@Controller('upload-history')
@UseGuards(JwtAuthGuard)
export class UploadHistoryController {
  constructor(private readonly uploadHistoryService: UploadHistoryService) {}

  @Get()
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    console.log('[UploadHistoryController] Fetching history:', { 
      userId: user.sub, 
      page: pageNum, 
      limit: limitNum 
    });

    const result = await this.uploadHistoryService.getUserHistory(
      user.sub,
      pageNum,
      limitNum,
    );

    console.log('[UploadHistoryController] History fetched:', { 
      count: result.items.length, 
      total: result.pagination.total 
    });

    return {
      message: 'Upload history fetched successfully.',
      data: result.items,
      pagination: result.pagination,
    };
  }

  @Get(':id')
  async getHistoryById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') historyId: string,
  ) {
    const history = await this.uploadHistoryService.getHistory(historyId);

    if (!history || history.userId !== user.sub) {
      return {
        message: 'History not found.',
        data: null,
      };
    }

    return {
      message: 'History fetched successfully.',
      data: history,
    };
  }

  @Delete(':id')
  async deleteHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') historyId: string,
  ) {
    try {
      await this.uploadHistoryService.deleteHistory(historyId, user.sub);

      return {
        message: 'History deleted successfully.',
      };
    } catch (error) {
      return {
        message: error.message || 'Failed to delete history.',
      };
    }
  }

  @Delete()
  async clearOldCompleted(@CurrentUser() user: AuthenticatedUser) {
    const deletedCount = await this.uploadHistoryService.clearOldCompleted(user.sub);

    return {
      message: `Cleared ${deletedCount} old completed uploads.`,
      data: { deletedCount },
    };
  }
}
