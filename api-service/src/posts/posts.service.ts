import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity/post.entity';
import { CreatePostDto } from './dto/create-post.dto/create-post.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    this.logger.log(`Creating post for author ${authorId}`);
    this.logger.debug(`Post content: ${createPostDto.content?.substring(0, 100)}${createPostDto.content && createPostDto.content.length > 100 ? '...' : ''}`);
    
    const post = this.postsRepository.create({
      ...createPostDto,
      authorId,
    });
    
    const savedPost = await this.postsRepository.save(post);
    this.logger.log(`Post created with ID: ${savedPost.id} for author ${authorId}`);
    
    return savedPost;
  }

  async findOne(id: string): Promise<Post> {
    this.logger.debug(`Looking for post with ID: ${id}`);
    
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      this.logger.warn(`Post with ID ${id} not found`);
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    
    this.logger.debug(`Post found: ${id} by author ${post.authorId}`);
    return post;
  }

  async incrementCounter(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount'): Promise<void> {
    this.logger.log(`Incrementing ${field} for post ${postId}`);
    
    await this.postsRepository.increment({ id: postId }, field, 1);
    
    this.logger.debug(`Successfully incremented ${field} for post ${postId}`);
  }

  async decrementCounter(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount'): Promise<void> {
    this.logger.log(`Decrementing ${field} for post ${postId}`);
    
    await this.postsRepository.decrement({ id: postId }, field, 1);
    
    this.logger.debug(`Successfully decremented ${field} for post ${postId}`);
  }

  async getPostWithCounters(id: string): Promise<Post> {
    this.logger.debug(`Getting post ${id} with counters`);
    
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.id = :id', { id })
      .select([
        'post.id',
        'post.content',
        'post.authorId',
        'post.likesCount',
        'post.commentsCount',
        'post.createdAt',
        'post.updatedAt',
      ])
      .getOne();

    if (!post) {
      this.logger.warn(`Post with ID ${id} not found when getting with counters`);
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    this.logger.debug(`Post ${id} counters - likes: ${post.likesCount}, comments: ${post.commentsCount}`);
    return post;
  }

  async exists(id: string): Promise<boolean> {
    this.logger.debug(`Checking if post ${id} exists`);
    
    const count = await this.postsRepository.count({ where: { id } });
    const exists = count > 0;
    
    this.logger.debug(`Post ${id} exists: ${exists}`);
    return exists;
  }
}