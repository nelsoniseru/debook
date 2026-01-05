import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto/create-post.dto';
import { MockAuthGuard } from '../common/guards/mock-auth.guard';

@Controller('posts')
@UseGuards(MockAuthGuard)

export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.postsService.create(createPostDto, userId);
  }

    @Get('/hello')
  async get() {
    return "hello";
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.postsService.getPostWithCounters(id);
  }
}