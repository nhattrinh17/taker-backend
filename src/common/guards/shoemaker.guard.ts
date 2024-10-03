import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ShoemakersAuthGuard extends AuthGuard('shoemakers-jwt') {}
