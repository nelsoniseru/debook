import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionsService } from './interactions.service';
import { Interaction, InteractionType } from './entities/interaction.entity/interaction.entity';
import { PostsService } from '../posts/posts.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';










import { Post } from '../posts/entities/post.entity/post.entity';


describe('InteractionsService', () => {
  let service: InteractionsService;
  let interactionsRepository: Repository<Interaction>;
  let postsService: PostsService;
  let kafkaProducer: KafkaProducerService;

  const POST_ID = '550e8400-e29b-41d4-a716-446655440000';
  const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
  const AUTHOR_ID = '456e7890-e12b-34d5-a789-556677889900';
  const INTERACTION_ID = '789e0123-e45b-67d8-a901-667788990011';
  const INTERACTION_ID_2 = '012e3456-e78b-90d1-a234-778899001122';

  const mockPostEntity: Partial<Post> = {
    id: POST_ID,
    authorId: AUTHOR_ID,
    content: 'Test post content',
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date('2024-01-14T10:30:00.000Z'),
    updatedAt: new Date('2024-01-14T10:30:00.000Z'),
  };

  const mockInteractionEntity: Partial<Interaction> = {
    id: INTERACTION_ID,
    userId: USER_ID,
    postId: POST_ID,
    type: InteractionType.LIKE,
    content: undefined,
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    post: mockPostEntity as Post, 
  };

  const mockPost = {
    id: POST_ID,
    authorId: AUTHOR_ID,
    content: 'Test post content',
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionsService,
        {
          provide: getRepositoryToken(Interaction),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: PostsService,
          useValue: {
            findOne: jest.fn(),
            incrementCounter: jest.fn(),
            decrementCounter: jest.fn(),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            emitInteractionEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InteractionsService>(InteractionsService);
    interactionsRepository = module.get<Repository<Interaction>>(getRepositoryToken(Interaction));
    postsService = module.get<PostsService>(PostsService);
    kafkaProducer = module.get<KafkaProducerService>(KafkaProducerService);
  });

  describe('likePost', () => {
    it('should successfully like a post', async () => {
    
      const postId = POST_ID;
      const userId = USER_ID;
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(interactionsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(interactionsRepository, 'create').mockReturnValue(mockInteractionEntity as Interaction);
      jest.spyOn(interactionsRepository, 'save').mockResolvedValue(mockInteractionEntity as Interaction);
      jest.spyOn(postsService, 'incrementCounter').mockResolvedValue(undefined);
      jest.spyOn(kafkaProducer, 'emitInteractionEvent').mockResolvedValue(undefined);

      const result = await service.likePost(postId, userId);

      expect(postsService.findOne).toHaveBeenCalledWith(postId);
      expect(interactionsRepository.findOne).toHaveBeenCalledWith({
        where: { userId, postId, type: InteractionType.LIKE }
      });
      expect(interactionsRepository.create).toHaveBeenCalledWith({
        userId,
        postId,
        type: InteractionType.LIKE,
      });
      expect(postsService.incrementCounter).toHaveBeenCalledWith(postId, 'likesCount');
      expect(kafkaProducer.emitInteractionEvent).toHaveBeenCalled();
      expect(result).toEqual(mockInteractionEntity);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      
      const postId = '550e8400-e29b-41d4-a716-446655440001'; 
      const userId = USER_ID;
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(null as any);

    
      await expect(service.likePost(postId, userId))
        .rejects.toThrow(NotFoundException);
      await expect(service.likePost(postId, userId))
        .rejects.toThrow(`Post with ID ${postId} not found`);
    });

    it('should throw ConflictException when user already liked the post', async () => {
   
      const postId = POST_ID;
      const userId = USER_ID;
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(interactionsRepository, 'findOne').mockResolvedValue(mockInteractionEntity as any);

  
      await expect(service.likePost(postId, userId))
        .rejects.toThrow(ConflictException);
      await expect(service.likePost(postId, userId))
        .rejects.toThrow('User has already liked this post');
    });
  });

  describe('unlikePost', () => {
    it('should successfully unlike a post', async () => {
  
      const postId = POST_ID;
      const userId = USER_ID;
      
      jest.spyOn(interactionsRepository, 'findOne').mockResolvedValue(mockInteractionEntity as any);
      jest.spyOn(interactionsRepository, 'remove').mockResolvedValue(undefined as any);
      jest.spyOn(postsService, 'decrementCounter').mockResolvedValue(undefined);

      await service.unlikePost(postId, userId);

     
      expect(interactionsRepository.findOne).toHaveBeenCalledWith({
        where: { userId, postId, type: InteractionType.LIKE }
      });
      expect(interactionsRepository.remove).toHaveBeenCalledWith(mockInteractionEntity);
      expect(postsService.decrementCounter).toHaveBeenCalledWith(postId, 'likesCount');
    });

    it('should throw NotFoundException when like does not exist', async () => {
      
      const postId = POST_ID;
      const userId = USER_ID;
      
      jest.spyOn(interactionsRepository, 'findOne').mockResolvedValue(null);

   
      await expect(service.unlikePost(postId, userId))
        .rejects.toThrow(NotFoundException);
      await expect(service.unlikePost(postId, userId))
        .rejects.toThrow('Like not found');
    });
  });

  describe('commentOnPost', () => {
    it('should successfully comment on a post', async () => {

      const postId = POST_ID;
      const userId = USER_ID;
      const content = 'This is a test comment';
      const mockComment = {
        ...mockInteractionEntity,
        id: INTERACTION_ID_2,
        type: InteractionType.COMMENT,
        content: content.trim(),
      } as Interaction;

      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(interactionsRepository, 'create').mockReturnValue(mockComment);
      jest.spyOn(interactionsRepository, 'save').mockResolvedValue(mockComment);
      jest.spyOn(postsService, 'incrementCounter').mockResolvedValue(undefined);
      jest.spyOn(kafkaProducer, 'emitInteractionEvent').mockResolvedValue(undefined);

  
      const result = await service.commentOnPost(postId, userId, content);

  
      expect(postsService.findOne).toHaveBeenCalledWith(postId);
      expect(interactionsRepository.create).toHaveBeenCalledWith({
        userId,
        postId,
        type: InteractionType.COMMENT,
        content: content.trim(),
      });
      expect(postsService.incrementCounter).toHaveBeenCalledWith(postId, 'commentsCount');
      expect(kafkaProducer.emitInteractionEvent).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });

    it('should throw BadRequestException when content is empty', async () => {

      const postId = POST_ID;
      const userId = USER_ID;
      const content: any = null; 

    
      await expect(service.commentOnPost(postId, userId, content))
        .rejects.toThrow(BadRequestException);
      await expect(service.commentOnPost(postId, userId, content))
        .rejects.toThrow('Comment content is required');
    });

    it('should throw BadRequestException when content is null', async () => {
 
      const postId = POST_ID;
      const userId = USER_ID;
      const content: any = null;

      await expect(service.commentOnPost(postId, userId, content))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when post does not exist', async () => {

      const postId = '550e8400-e29b-41d4-a716-446655440001';
      const userId = USER_ID;
      const content = 'Test comment';
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(null as any);


      await expect(service.commentOnPost(postId, userId, content))
        .rejects.toThrow(NotFoundException);
    });

    it('should trim comment content', async () => {

      const postId = POST_ID;
      const userId = USER_ID;
      const content = '  Test comment with spaces  ';
      const trimmedContent = 'Test comment with spaces';
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(interactionsRepository, 'create').mockImplementation((entity) => ({
        ...entity,
        id: INTERACTION_ID,
        createdAt: new Date(),
        post: mockPostEntity as Post,
      }) as Interaction);
      jest.spyOn(interactionsRepository, 'save').mockResolvedValue({} as any);


      await service.commentOnPost(postId, userId, content);


      expect(interactionsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: trimmedContent
        })
      );
    });
  });

  describe('getPostInteractions', () => {
    it('should get all interactions for a post', async () => {
   
      const postId = POST_ID;
      const mockInteractions = [
        mockInteractionEntity, 
        { 
          ...mockInteractionEntity, 
          id: INTERACTION_ID_2,
          type: InteractionType.COMMENT,
          content: 'Another comment'
        }
      ] as Interaction[];
      
      jest.spyOn(interactionsRepository, 'find').mockResolvedValue(mockInteractions);

    
      const result = await service.getPostInteractions(postId);

   
      expect(interactionsRepository.find).toHaveBeenCalledWith({
        where: { postId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockInteractions);
    });

    it('should get interactions filtered by type', async () => {
    
      const postId = POST_ID;
      const type = InteractionType.LIKE;
      const mockInteractions = [mockInteractionEntity] as Interaction[];
      
      jest.spyOn(interactionsRepository, 'find').mockResolvedValue(mockInteractions);

 
      const result = await service.getPostInteractions(postId, type);

      expect(interactionsRepository.find).toHaveBeenCalledWith({
        where: { postId, type },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([mockInteractionEntity]);
    });

    it('should return empty array when no interactions found', async () => {

      const postId = POST_ID;
      
      jest.spyOn(interactionsRepository, 'find').mockResolvedValue([]);

      const result = await service.getPostInteractions(postId);

      expect(result).toEqual([]);
    });
  });

  describe('logging', () => {
    it('should log when likePost is called', async () => {
    
      const postId = POST_ID;
      const userId = USER_ID;
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost as any);
      jest.spyOn(interactionsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(interactionsRepository, 'save').mockResolvedValue(mockInteractionEntity as any);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.likePost(postId, userId);


      expect(loggerSpy).toHaveBeenCalledWith(
        `User ${userId} attempting to like post ${postId}`
      );
    });

    it('should log warning when post not found', async () => {
   
      const postId = '550e8400-e29b-41d4-a716-446655440001';
      const userId = USER_ID;
      
      jest.spyOn(postsService, 'findOne').mockResolvedValue(null as any);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');


      await expect(service.likePost(postId, userId)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith(
        `Post ${postId} not found for like attempt by user ${userId}`
      );
    });
  });
});