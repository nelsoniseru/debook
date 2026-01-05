import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';

@Controller('notifications')
@UseGuards(MockAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Headers('x-user-id') userId: string,

  ) {
    return this.notificationsService.getNotifications(userId, limit, offset);
  }

  @Get('unread/count')
  async getUnreadCount(
        @Headers('x-user-id') userId: string,
  ) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseUUIDPipe) notificationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }
}