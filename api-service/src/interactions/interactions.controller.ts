import { 
  Controller, 
  Post, 
  Delete, 
  Param, 
  Headers, 
  Body,
  UseGuards,
  HttpCode,
  Request,
  HttpStatus,
  Get,
  Query
} from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';
import { CreateCommentDto } from './dto/create-interaction.dto/comment.dto';
import { InteractionType } from './entities/interaction.entity/interaction.entity';

@Controller('posts/:postId')
@UseGuards(MockAuthGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('/like')
  @HttpCode(HttpStatus.CREATED)
  async likePost(
    @Param('postId') postId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.interactionsService.likePost(postId, userId);
  }

  @Delete('like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlikePost(
    @Param('postId') postId: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.interactionsService.unlikePost(postId, userId);
  }

  @Post('comment')
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Headers('x-user-id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.interactionsService.commentOnPost(
      postId,
      userId,
      createCommentDto.content,
    );
  }


  @Get('interactions')
  @HttpCode(HttpStatus.OK)
  async getPostInteractions(
    @Param('postId') postId: string,
    @Query('type') type?: InteractionType,
  ) {
    return this.interactionsService.getPostInteractions(postId, type);
  }


}