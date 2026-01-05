import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity/post.entity';
import { CreatePostDto } from './dto/create-post.dto/create-post.dto';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: Repository<Post>;


  const POST_ID = '550e8400-e29b-41d4-a716-446655440000';
  const AUTHOR_ID = '123e4567-e89b-12d3-a456-426614174000';
  const ANOTHER_AUTHOR_ID = '456e7890-e12b-34d5-a789-556677889900';

  const mockPost: Partial<Post> = {
    id: POST_ID,
    authorId: AUTHOR_ID,
    content: 'Test post content',
    likesCount: 10,
    commentsCount: 5,
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  const mockCreatePostDto: CreatePostDto = {
    content: 'This is a new post content',
   
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postsRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  describe('create', () => {
    it('should successfully create a post', async () => {
      const createdPost = { ...mockPost, content: mockCreatePostDto.content };
      
      jest.spyOn(postsRepository, 'create').mockReturnValue(createdPost as Post);
      jest.spyOn(postsRepository, 'save').mockResolvedValue(createdPost as Post);


      const result = await service.create(mockCreatePostDto, AUTHOR_ID);

      expect(postsRepository.create).toHaveBeenCalledWith({
        ...mockCreatePostDto,
        authorId: AUTHOR_ID,
      });
      expect(postsRepository.save).toHaveBeenCalledWith(createdPost);
      expect(result).toEqual(createdPost);
    });

    it('should log when creating a post', async () => {
     
      jest.spyOn(postsRepository, 'create').mockReturnValue(mockPost as Post);
      jest.spyOn(postsRepository, 'save').mockResolvedValue(mockPost as Post);
      const loggerSpy = jest.spyOn(service['logger'], 'log');


      await service.create(mockCreatePostDto, AUTHOR_ID);


      expect(loggerSpy).toHaveBeenCalledWith(`Creating post for author ${AUTHOR_ID}`);
    });
  });

  describe('findOne', () => {
    it('should return a post when found', async () => {

      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost as Post);


      const result = await service.findOne(POST_ID);

   
      expect(postsRepository.findOne).toHaveBeenCalledWith({ where: { id: POST_ID } });
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException when post not found', async () => {
   
      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(null);


      await expect(service.findOne(POST_ID))
        .rejects.toThrow(NotFoundException);
      await expect(service.findOne(POST_ID))
        .rejects.toThrow(`Post with ID ${POST_ID} not found`);
    });

    it('should log when post is not found', async () => {

      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(null);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');


      await expect(service.findOne(POST_ID)).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith(`Post with ID ${POST_ID} not found`);
    });
  });

  describe('incrementCounter', () => {
    it('should increment likesCount', async () => {
 
      const field = 'likesCount';
      jest.spyOn(postsRepository, 'increment').mockResolvedValue({ affected: 1 } as any);

      await service.incrementCounter(POST_ID, field);

      expect(postsRepository.increment).toHaveBeenCalledWith(
        { id: POST_ID },
        field,
        1
      );
    });

    it('should increment commentsCount', async () => {
 
      const field = 'commentsCount';
      jest.spyOn(postsRepository, 'increment').mockResolvedValue({ affected: 1 } as any);

      await service.incrementCounter(POST_ID, field);

 
      expect(postsRepository.increment).toHaveBeenCalledWith(
        { id: POST_ID },
        field,
        1
      );
    });

   
  });

  describe('decrementCounter', () => {
    it('should decrement likesCount', async () => {
  
      const field = 'likesCount';
      jest.spyOn(postsRepository, 'decrement').mockResolvedValue({ affected: 1 } as any);

  
      await service.decrementCounter(POST_ID, field);

   
      expect(postsRepository.decrement).toHaveBeenCalledWith(
        { id: POST_ID },
        field,
        1
      );
    });

    it('should decrement commentsCount', async () => {

      const field = 'commentsCount';
      jest.spyOn(postsRepository, 'decrement').mockResolvedValue({ affected: 1 } as any);

      await service.decrementCounter(POST_ID, field);

 
      expect(postsRepository.decrement).toHaveBeenCalledWith(
        { id: POST_ID },
        field,
        1
      );
    });


  });

  describe('getPostWithCounters', () => {
    it('should return post with selected counters', async () => {
 
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPost),
      };
      
      jest.spyOn(postsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);


      const result = await service.getPostWithCounters(POST_ID);

   
      expect(postsRepository.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.id = :id', { id: POST_ID });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'post.id',
        'post.content',
        'post.authorId',
        'post.likesCount',
        'post.commentsCount',
        'post.createdAt',
        'post.updatedAt',
      ]);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException when post not found with counters', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      
      jest.spyOn(postsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await expect(service.getPostWithCounters(POST_ID))
        .rejects.toThrow(NotFoundException);
      
      expect(loggerSpy).toHaveBeenCalledWith(
        `Post with ID ${POST_ID} not found when getting with counters`
      );
    });
  });

  describe('exists', () => {
    it('should return true when post exists', async () => {
   
      jest.spyOn(postsRepository, 'count').mockResolvedValue(1);


      const result = await service.exists(POST_ID);

  
      expect(postsRepository.count).toHaveBeenCalledWith({ where: { id: POST_ID } });
      expect(result).toBe(true);
    });

    it('should return false when post does not exist', async () => {
 
      jest.spyOn(postsRepository, 'count').mockResolvedValue(0);

  
      const result = await service.exists(POST_ID);


      expect(postsRepository.count).toHaveBeenCalledWith({ where: { id: POST_ID } });
      expect(result).toBe(false);
    });

    it('should log existence check', async () => {
 
      jest.spyOn(postsRepository, 'count').mockResolvedValue(1);
      const loggerSpy = jest.spyOn(service['logger'], 'debug');


      await service.exists(POST_ID);

      
      expect(loggerSpy).toHaveBeenCalledWith(`Checking if post ${POST_ID} exists`);
      expect(loggerSpy).toHaveBeenCalledWith(`Post ${POST_ID} exists: true`);
    });
  });

  describe('logging', () => {
    it('should log debug message when finding post', async () => {

      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost as Post);
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.findOne(POST_ID);

      expect(loggerSpy).toHaveBeenCalledWith(`Looking for post with ID: ${POST_ID}`);
      expect(loggerSpy).toHaveBeenCalledWith(`Post found: ${POST_ID} by author ${AUTHOR_ID}`);
    });

    it('should log when incrementing counter', async () => {
      const field = 'likesCount';
      jest.spyOn(postsRepository, 'increment').mockResolvedValue({ affected: 1 } as any);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.incrementCounter(POST_ID, field);

  
      expect(loggerSpy).toHaveBeenCalledWith(`Incrementing ${field} for post ${POST_ID}`);
    });

    it('should log when decrementing counter', async () => {

      const field = 'likesCount';
      jest.spyOn(postsRepository, 'decrement').mockResolvedValue({ affected: 1 } as any);
      const loggerSpy = jest.spyOn(service['logger'], 'log');

  
      await service.decrementCounter(POST_ID, field);


      expect(loggerSpy).toHaveBeenCalledWith(`Decrementing ${field} for post ${POST_ID}`);
    });
  });
});