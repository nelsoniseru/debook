import { 
  Injectable, 
  ConflictException, 
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interaction, InteractionType } from '../interactions/entities/interaction.entity/interaction.entity';
import { PostsService } from '../posts/posts.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    @InjectRepository(Interaction)
    private readonly interactionsRepository: Repository<Interaction>,
    private readonly postsService: PostsService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async likePost(postId: string, userId: string): Promise<Interaction> {
    this.logger.log(`User ${userId} attempting to like post ${postId}`);
    
    const postExists = await this.postsService.findOne(postId);
    if (!postExists) {
      this.logger.warn(`Post ${postId} not found for like attempt by user ${userId}`);
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const existingInteraction = await this.interactionsRepository.findOne({
      where: { userId, postId, type: InteractionType.LIKE }
    });

    if (existingInteraction) {
      this.logger.warn(`User ${userId} already liked post ${postId}`);
      throw new ConflictException('User has already liked this post');
    }

    this.logger.debug(`Creating like interaction for user ${userId} on post ${postId}`);
    
    const interaction = this.interactionsRepository.create({
      userId,
      postId,
      type: InteractionType.LIKE,
    });

    const savedInteraction = await this.interactionsRepository.save(interaction);
    this.logger.log(`Like created with ID: ${savedInteraction.id}`);

    this.logger.debug(`Incrementing likes count for post ${postId}`);
    await this.postsService.incrementCounter(postId, 'likesCount');
   
    this.logger.debug(`Emitting Kafka event for like interaction ${savedInteraction.id}`);
    if(postExists){
    await this.kafkaProducer.emitInteractionEvent({
      id: savedInteraction.id,     
      ownerId: postExists.authorId ,
      actorId:userId,
      postId,
      type: InteractionType.LIKE,
      createdAt: savedInteraction.createdAt,
    });
    }
    
    this.logger.log(`Like process completed successfully for user ${userId} on post ${postId}`);
    return savedInteraction;
  }


  async unlikePost(postId: string, userId: string): Promise<void> {
    this.logger.log(`User ${userId} attempting to unlike post ${postId}`);
    
    const interaction = await this.interactionsRepository.findOne({
      where: { userId, postId, type: InteractionType.LIKE }
    });

    if (!interaction) {
      this.logger.warn(`Like not found for user ${userId} on post ${postId}`);
      throw new NotFoundException('Like not found');
    }

    this.logger.debug(`Removing like interaction ${interaction.id}`);
    await this.interactionsRepository.remove(interaction);
    
    this.logger.debug(`Decrementing likes count for post ${postId}`);
    await this.postsService.decrementCounter(postId, 'likesCount');
    
    this.logger.log(`Unlike completed successfully for user ${userId} on post ${postId}`);
  }

 async commentOnPost(postId: string, userId: string, content: string): Promise<Interaction> {
  this.logger.log(`User ${userId} attempting to comment on post ${postId}`);
  
  if (!content || content.trim().length === 0) {
    this.logger.warn(`Empty comment content from user ${userId} on post ${postId}`);
    throw new BadRequestException('Comment content is required');
  }

  const post = await this.postsService.findOne(postId);
  if (!post) {
    this.logger.warn(`Post ${postId} not found for comment attempt by user ${userId}`);
    throw new NotFoundException(`Post with ID ${postId} not found`);
  }

  this.logger.debug(`Creating comment interaction for user ${userId} on post ${postId}`);
  
  const interaction = this.interactionsRepository.create({
    userId,
    postId,
    type: InteractionType.COMMENT,
    content: content.trim(),
  });

  const savedInteraction = await this.interactionsRepository.save(interaction);
  this.logger.log(`Comment created with ID: ${savedInteraction.id}, content length: ${content.length}`);

  this.logger.debug(`Incrementing comments count for post ${postId}`);
  await this.postsService.incrementCounter(postId, 'commentsCount');

  this.logger.debug(`Emitting Kafka event for comment interaction ${savedInteraction.id}`);
  await this.kafkaProducer.emitInteractionEvent({
    id: savedInteraction.id,
    ownerId: post.authorId,  
    actorId: userId,           
    postId,
    type: InteractionType.COMMENT,
    content: savedInteraction.content,
    createdAt: savedInteraction.createdAt,
  });

  this.logger.log(`Comment process completed successfully for user ${userId} on post ${postId}`);
  return savedInteraction;
}

  async getPostInteractions(postId: string, type?: InteractionType): Promise<Interaction[]> {
    this.logger.log(`Getting interactions for post ${postId} ${type ? `of type ${type}` : 'all types'}`);
    
    const where: any = { postId };
  
    if (type) {
      where.type = type;
    }

    const interactions = await this.interactionsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });

    this.logger.debug(`Found ${interactions.length} interactions for post ${postId}`);
    
    return interactions;
  }
}