import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Content tidak boleh kosong' })
  @MaxLength(5000, { message: 'Content maksimal 5000 karakter' })
  content: string;
}
