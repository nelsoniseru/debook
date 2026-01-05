import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification/notification.entity'
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service'

@Module({
  imports:[
         TypeOrmModule.forFeature([Notification]), 
          ],
  providers: [NotificationsService,KafkaConsumerService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
