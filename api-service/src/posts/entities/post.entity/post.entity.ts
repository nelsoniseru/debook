import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Interaction } from '../../../interactions/entities/interaction.entity/interaction.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  @Index()
  authorId: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Interaction, interaction => interaction.post)
  interactions: Interaction[];
}