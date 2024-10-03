import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminsAuthGuard extends AuthGuard('admins-jwt') {}
