import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
  @Prop({ required: true, unique: true, trim: true })
  invoiceNumber!: string;

  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  customerEmail!: string;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ default: '' })
  pdfUrl!: string;

  @Prop({ default: '' })
  pdfBase64!: string;

  @Prop({ default: '' })
  pdfFileName!: string;

  @Prop({ default: false })
  emailedToCustomer!: boolean;

  @Prop({
    type: String,
    enum: ['pending', 'sent', 'failed', 'skipped'],
    default: 'pending',
  })
  emailStatus!: 'pending' | 'sent' | 'failed' | 'skipped';

  @Prop({ default: '' })
  emailError!: string;

  @Prop({ default: null })
  emailedAt!: Date | null;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
