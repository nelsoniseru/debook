import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from './entities/notification/notification.entity';
import { InteractionEvent } from '../kafka/kafka-consumer.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async createNotification(event: InteractionEvent): Promise<Notification> {
    this.logger.log(`Creating notification for user ${event.ownerId} from actor ${event.actorId} type ${event.type}`);
    
    const notification = this.notificationsRepository.create({
      userId: event.ownerId, 
      actorId: event.actorId,
      postId: event.postId,
      type: event.type as NotificationType,
      message: this.generateNotificationMessage(event),
      metadata: {
        interactionId: event.id,
        content: event.content,
      },
      status: NotificationStatus.PENDING,
    });

    const savedNotification = await this.notificationsRepository.save(notification);
    this.logger.debug(`Notification created with ID: ${savedNotification.id}`);
    
    return savedNotification;
  }

  private generateNotificationMessage(event: InteractionEvent): string {
    const actor = 'User'; 
    const action = event.type === 'like' ? 'liked' : 'commented on';
    
    if (event.type === 'comment' && event.content) {
      return `${actor} ${action} your post: "${event.content.substring(0, 50)}${event.content.length > 50 ? '...' : ''}"`;
    }
    
    return `${actor} ${action} your post`;
  }

  async getNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    this.logger.log(`Getting notifications for user ${userId} limit ${limit} offset ${offset}`);
    
    const notifications = await this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    this.logger.debug(`Found ${notifications.length} notifications for user ${userId}`);
    
    return notifications;
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      this.logger.warn(`Notification ${notificationId} not found for user ${userId}`);
      throw new Error('Notification not found');
    }

    this.logger.debug(`Notification found: ${notification.id} with status ${notification.status}`);
    
    notification.status = NotificationStatus.READ;
    const updatedNotification = await this.notificationsRepository.save(notification);
    
    this.logger.log(`Notification ${notificationId} marked as read successfully`);
    
    return updatedNotification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    this.logger.log(`Getting unread count for user ${userId}`);
    
    const count = await this.notificationsRepository.count({
      where: { 
        userId, 
        status: NotificationStatus.SENT 
      },
    });

    this.logger.debug(`User ${userId} has ${count} unread notifications`);
    
    return count;
  }
}