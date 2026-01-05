import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationStatus, NotificationType } from './entities/notification/notification.entity';
import { InteractionEvent } from '../kafka/kafka-consumer.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepository: Repository<Notification>;

  const NOTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
  const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
  const ACTOR_ID = '456e7890-e12b-34d5-a789-556677889900';
  const POST_ID = '789e0123-e45b-67d8-a901-667788990011';
  const INTERACTION_ID = '012e3456-e78b-90d1-a234-778899001122';

  const mockNotification: Partial<Notification> = {
    id: NOTIFICATION_ID,
    userId: USER_ID,
    actorId: ACTOR_ID,
    postId: POST_ID,
    type: NotificationType.COMMENT,
    message: 'User commented on your post: "Great post!"',
    metadata: {
      interactionId: INTERACTION_ID,
      content: 'Great post!',
    },
    status: NotificationStatus.SENT,
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  const mockLikeEvent: InteractionEvent = {
    id: INTERACTION_ID,
    ownerId: USER_ID,
    actorId: ACTOR_ID,
    postId: POST_ID,
    type: 'like',
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  const mockCommentEvent: InteractionEvent = {
    id: INTERACTION_ID,
    ownerId: USER_ID,
    actorId: ACTOR_ID,
    postId: POST_ID,
    type: 'comment',
    content: 'This is a great post with a lot of interesting content that exceeds fifty characters for testing',
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
  });

  describe('createNotification', () => {
    it('should create a notification for a like event', async () => {
      const expectedNotification = {
        ...mockNotification,
        type: NotificationType.LIKE,
        message: 'User liked your post',
        status: NotificationStatus.PENDING,
        metadata: {
          interactionId: INTERACTION_ID,
          content: undefined,
        },
      };

      jest.spyOn(notificationsRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(expectedNotification as Notification);

      const result = await service.createNotification(mockLikeEvent);

    expect(notificationsRepository.create).toHaveBeenCalledWith({
        userId: USER_ID,
        actorId: ACTOR_ID,
        postId: POST_ID,
        type: NotificationType.LIKE,
        message: 'User liked your post',
        metadata: {
          interactionId: INTERACTION_ID,
          content: undefined,
        },
        status: NotificationStatus.PENDING,
      });
      expect(result).toEqual(expectedNotification);
    });

    it('should create a notification for a comment event with truncated content', async () => {
     
      const expectedNotification = {
        ...mockNotification,
        message: 'User commented on your post: "This is a great post with a lot of interesting con..."',
        status: NotificationStatus.PENDING,
        metadata: {
          interactionId: INTERACTION_ID,
          content: mockCommentEvent.content,
        },
      };

      jest.spyOn(notificationsRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(expectedNotification as Notification);


      const result = await service.createNotification(mockCommentEvent);

      expect(notificationsRepository.create).toHaveBeenCalledWith({
        userId: USER_ID,
        actorId: ACTOR_ID,
        postId: POST_ID,
        type: NotificationType.COMMENT,
        message: 'User commented on your post: "This is a great post with a lot of interesting con..."',
        metadata: {
          interactionId: INTERACTION_ID,
          content: mockCommentEvent.content,
        },
        status: NotificationStatus.PENDING,
      });
      expect(result).toEqual(expectedNotification);
    });

    it('should create a notification for a comment event with short content', async () => {
    
      const shortCommentEvent: InteractionEvent = {
        ...mockCommentEvent,
        content: 'Short comment',
      };

      const expectedNotification = {
        ...mockNotification,
        message: 'User commented on your post: "Short comment"',
        metadata: {
          interactionId: INTERACTION_ID,
          content: 'Short comment',
        },
      };

      jest.spyOn(notificationsRepository, 'create').mockReturnValue(expectedNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(expectedNotification as Notification);

     
      const result = await service.createNotification(shortCommentEvent);

  
      expect(result.message).toBe('User commented on your post: "Short comment"');
    });

    it('should log when creating notification', async () => {
  
      jest.spyOn(notificationsRepository, 'create').mockReturnValue(mockNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(mockNotification as Notification);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

   
      await service.createNotification(mockLikeEvent);

     
      expect(loggerSpy).toHaveBeenCalledWith(
        `Creating notification for user ${USER_ID} from actor ${ACTOR_ID} type ${mockLikeEvent.type}`
      );
    });
  });

  describe('generateNotificationMessage', () => {
    it('should generate message for like event', () => {
  
      const message = (service as any).generateNotificationMessage(mockLikeEvent);

  
      expect(message).toBe('User liked your post');
    });

    it('should generate message for comment event with content', () => {
   
      const message = (service as any).generateNotificationMessage(mockCommentEvent);

 
      expect(message).toBe('User commented on your post: "This is a great post with a lot of interesting con..."');
    });

    it('should generate message for comment event without content', () => {
      const commentEventWithoutContent: InteractionEvent = {
        ...mockCommentEvent,
        content: undefined,
      };

      const message = (service as any).generateNotificationMessage(commentEventWithoutContent);

    
      expect(message).toBe('User commented on your post');
    });

    it('should handle comment content exactly 50 characters', () => {
     
      const exactLengthContent = 'A'.repeat(50);
      const commentEvent: InteractionEvent = {
        ...mockCommentEvent,
        content: exactLengthContent,
      };

     
      const message = (service as any).generateNotificationMessage(commentEvent);

    
      expect(message).toBe(`User commented on your post: "${exactLengthContent}"`);
      expect(message).not.toContain('...');
    });

    it('should handle comment content less than 50 characters', () => {
  
      const shortContent = 'Short comment';
      const commentEvent: InteractionEvent = {
        ...mockCommentEvent,
        content: shortContent,
      };

      const message = (service as any).generateNotificationMessage(commentEvent);

      expect(message).toBe(`User commented on your post: "${shortContent}"`);
      expect(message).not.toContain('...');
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for a user with pagination', async () => {
      
      const mockNotifications = [mockNotification, { ...mockNotification, id: 'another-id' }];
      jest.spyOn(notificationsRepository, 'find').mockResolvedValue(mockNotifications as Notification[]);


      const result = await service.getNotifications(USER_ID, 20, 0);

      expect(notificationsRepository.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should use default limit and offset when not provided', async () => {
      
      jest.spyOn(notificationsRepository, 'find').mockResolvedValue([mockNotification] as Notification[]);

  
      await service.getNotifications(USER_ID);


      expect(notificationsRepository.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
    });

    it('should log when getting notifications', async () => {
   
      jest.spyOn(notificationsRepository, 'find').mockResolvedValue([mockNotification] as Notification[]);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.getNotifications(USER_ID, 10, 5);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Getting notifications for user ${USER_ID} limit 10 offset 5`
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
 
      const unreadNotification = {
        ...mockNotification,
        status: NotificationStatus.SENT,
      };

      const readNotification = {
        ...unreadNotification,
        status: NotificationStatus.READ,
      };

      jest.spyOn(notificationsRepository, 'findOne').mockResolvedValue(unreadNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(readNotification as Notification);

 
      const result = await service.markAsRead(NOTIFICATION_ID, USER_ID);


      expect(notificationsRepository.findOne).toHaveBeenCalledWith({
        where: { id: NOTIFICATION_ID, userId: USER_ID },
      });
      expect(notificationsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationStatus.READ })
      );
      expect(result.status).toBe(NotificationStatus.READ);
    });

    it('should throw error when notification not found', async () => {
    
      jest.spyOn(notificationsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.markAsRead(NOTIFICATION_ID, USER_ID))
        .rejects.toThrow('Notification not found');
    });

    it('should log when marking notification as read', async () => {
      jest.spyOn(notificationsRepository, 'findOne').mockResolvedValue(mockNotification as Notification);
      jest.spyOn(notificationsRepository, 'save').mockResolvedValue(mockNotification as Notification);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.markAsRead(NOTIFICATION_ID, USER_ID);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Marking notification ${NOTIFICATION_ID} as read for user ${USER_ID}`
      );
    });

    it('should log warning when notification not found', async () => {
      jest.spyOn(notificationsRepository, 'findOne').mockResolvedValue(null);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await expect(service.markAsRead(NOTIFICATION_ID, USER_ID)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith(
        `Notification ${NOTIFICATION_ID} not found for user ${USER_ID}`
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const unreadCount = 5;
      jest.spyOn(notificationsRepository, 'count').mockResolvedValue(unreadCount);

      const result = await service.getUnreadCount(USER_ID);

      expect(notificationsRepository.count).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          status: NotificationStatus.SENT,
        },
      });
      expect(result).toBe(unreadCount);
    });

    it('should return 0 when no unread notifications', async () => {
      jest.spyOn(notificationsRepository, 'count').mockResolvedValue(0);

      const result = await service.getUnreadCount(USER_ID);

      expect(result).toBe(0);
    });

    it('should log when getting unread count', async () => {
      jest.spyOn(notificationsRepository, 'count').mockResolvedValue(3);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.getUnreadCount(USER_ID);

      expect(loggerSpy).toHaveBeenCalledWith(`Getting unread count for user ${USER_ID}`);
    });
  });

  describe('logging', () => {
    it('should log debug messages', async () => {
      jest.spyOn(notificationsRepository, 'find').mockResolvedValue([mockNotification] as Notification[]);
      jest.spyOn(notificationsRepository, 'count').mockResolvedValue(2);
      const debugLoggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.getNotifications(USER_ID);
      await service.getUnreadCount(USER_ID);

    
      expect(debugLoggerSpy).toHaveBeenCalledWith(
        `Found 1 notifications for user ${USER_ID}`
      );
      expect(debugLoggerSpy).toHaveBeenCalledWith(
        `User ${USER_ID} has 2 unread notifications`
      );
    });
  });
});