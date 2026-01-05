import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { PostsModule } from '../posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interaction } from './entities/interaction.entity/interaction.entity';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
    imports: [
    TypeOrmModule.forFeature([Interaction]),
    PostsModule,
    KafkaModule,
  ],
  providers: [InteractionsService],
  controllers: [InteractionsController]
})
export class InteractionsModule {}
