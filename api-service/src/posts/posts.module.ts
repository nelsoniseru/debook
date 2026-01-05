import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from '../posts/entities/post.entity/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
    TypeOrmModule.forFeature([Post]),
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService]

})
export class PostsModule {}
