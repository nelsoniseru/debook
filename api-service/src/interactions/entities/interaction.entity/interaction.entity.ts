import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  ManyToOne,
  Index,
  Unique
} from 'typeorm';
import { Post } from '../../../posts/entities/post.entity/post.entity';

export enum InteractionType {
  LIKE = 'like',
  COMMENT = 'comment',
}

@Entity('interactions')
@Unique(['userId', 'postId', 'type'])
@Index(['postId', 'type'])
@Index(['userId', 'postId'])
export class Interaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  postId: string;

  @Column({ 
    type: 'enum',
    enum: InteractionType,
    default: InteractionType.LIKE
  })
  type: InteractionType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => Post, post => post.interactions, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}