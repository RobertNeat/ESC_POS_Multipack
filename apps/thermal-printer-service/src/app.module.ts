import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FontsModule } from './fonts/fonts.module';
import { PrinterModule } from './printer/printer.module';

@Module({
  imports: [PrinterModule, FontsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
