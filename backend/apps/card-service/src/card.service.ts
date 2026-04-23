import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model } from 'mongoose';
import * as net from 'node:net';
import * as tls from 'node:tls';
const PDFDocument = require('pdfkit');
import {
  Delivery,
  DeliveryDocument,
} from '@app/common/database/schemas/delivery.schema';
import {
  Invoice,
  InvoiceDocument,
} from '@app/common/database/schemas/invoice.schema';
import { Order, OrderDocument } from '@app/common/database/schemas/order.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Card, CardDocument } from './schemas/card.schema';
import {
  Product,
  ProductDocument,
} from '../../main-service/src/schemas/product.schema';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Delivery.name)
    private readonly deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  private readonly deliveryStatusOrder = ['processing', 'in-transit', 'delivered'] as const;
  private readonly invoiceSiteName = 'aura-clothing.com';
  private readonly invoiceSupportEmail = 'support@aura-clothing.com';

  private handleServiceError(error: unknown, fallbackMessage: string): never {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] })?.message ?? error.message;

      throw new RpcException({
        statusCode: error.getStatus(),
        message,
      });
    }

    throw new RpcException(
      new InternalServerErrorException(fallbackMessage).getResponse(),
    );
  }

  private sanitizeCard(card: CardDocument) {
    const object = card.toObject();
    return {
      id: object._id.toString(),
      totalItems: object.items.reduce((sum, item) => sum + item.quantity, 0),
      ...object,
    };
  }

  private sanitizeOrder(order: OrderDocument) {
    const object = order.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private sanitizeDelivery(delivery: DeliveryDocument) {
    const object = delivery.toObject();
    return {
      id: object._id.toString(),
      ...object,
    };
  }

  private sanitizeInvoice(invoice: InvoiceDocument) {
    const object = invoice.toObject();
    const { pdfBase64, ...safeInvoice } = object;

    return {
      id: safeInvoice._id.toString(),
      ...safeInvoice,
      hasPdf: Boolean(pdfBase64),
    };
  }

  private buildInvoiceNumber(orderId: string) {
    return `INV-${orderId.slice(-8).toUpperCase()}`;
  }

  private buildInvoiceFileName(orderId: string) {
    return `${this.buildInvoiceNumber(orderId)}.pdf`;
  }

  private formatMoney(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  private formatInvoiceDate(value: Date | string | undefined) {
    const date = value ? new Date(value) : new Date();
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private async loadPrimaryProductVisual(order: OrderDocument) {
    const firstItem = order.items[0];

    if (!firstItem?.productId) {
      return null;
    }

    const product = await this.productModel
      .findById(firstItem.productId)
      .lean()
      .exec();
    const imageUrl =
      typeof product?.imageUrl === 'string' ? product.imageUrl.trim() : '';

    if (!imageUrl) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async buildInvoicePdf(order: OrderDocument, invoiceNumber: string) {
    const createdAt =
      (order as unknown as { createdAt?: Date }).createdAt ?? new Date();
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const discountValue = subtotal - order.totalPrice;
    const primaryImage = await this.loadPrimaryProductVisual(order);

    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 44,
        compress: true,
        info: {
          Title: `${invoiceNumber} - AURA Clothing`,
          Author: 'AURA Clothing',
          Subject: 'Customer invoice',
        },
      });
      const chunks: Buffer[] = [];
      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const contentWidth = right - left;
      const heroY = 126;
      const heroHeight = 176;
      const heroWidth = 178;
      const heroX = right - heroWidth;
      const contentX = left;
      const mainWidth = contentWidth - heroWidth - 24;
      let cursorY = 0;

      doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(0, 0, doc.page.width, 112).fill('#111827');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('AURA', left, 34);
      doc.font('Helvetica').fontSize(11).fillColor('#d1d5db');
      doc.text('Clothing Store', left, 66);
      doc.text(this.invoiceSiteName, left, 82);

      doc.roundedRect(right - 164, 26, 164, 70, 14).fill('#1f2937');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
      doc.text('TAX INVOICE', right - 146, 40);
      doc.fontSize(20).text(invoiceNumber, right - 146, 56, {
        width: 132,
      });
      doc.fillColor('#cbd5e1').font('Helvetica').fontSize(9);
      doc.text(`Generated ${this.formatInvoiceDate(createdAt)}`, right - 146, 82, {
        width: 132,
      });

      doc.roundedRect(heroX, heroY, heroWidth, heroHeight, 18).fill('#f4f4f5');
      if (primaryImage) {
        try {
          doc.image(primaryImage, heroX + 12, heroY + 12, {
            fit: [heroWidth - 24, heroHeight - 24],
            align: 'center',
            valign: 'center',
          });
        } catch {
          doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(16);
          doc.text(order.items[0]?.productName ?? 'AURA Product', heroX + 18, heroY + 56, {
            width: heroWidth - 36,
            align: 'center',
          });
        }
      } else {
        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(16);
        doc.text(order.items[0]?.productName ?? 'AURA Product', heroX + 18, heroY + 52, {
          width: heroWidth - 36,
          align: 'center',
        });
        doc.font('Helvetica').fontSize(10).fillColor('#94a3b8');
        doc.text('Visual preview unavailable', heroX + 18, heroY + 98, {
          width: heroWidth - 36,
          align: 'center',
        });
      }

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
      doc.text('Bill To', contentX, heroY);
      doc.font('Helvetica').fontSize(12).fillColor('#111827');
      doc.text(order.customerEmail, contentX, heroY + 20, { width: mainWidth / 2 - 8 });
      doc.fontSize(10).fillColor('#475569');
      doc.text('Customer account', contentX, heroY + 40, { width: mainWidth / 2 - 8 });

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
      doc.text('Ship To', contentX + mainWidth / 2 + 8, heroY);
      doc.font('Helvetica').fontSize(12).fillColor('#111827');
      doc.text(order.deliveryAddress, contentX + mainWidth / 2 + 8, heroY + 20, {
        width: mainWidth / 2 - 8,
      });

      doc.roundedRect(contentX, heroY + 80, mainWidth, 84, 16).fill('#f8fafc');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
      doc.text('Payment Details', contentX + 18, heroY + 96);
      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      doc.text('Status', contentX + 18, heroY + 118);
      doc.text('Method', contentX + 160, heroY + 118);
      doc.text('Order', contentX + 318, heroY + 118);
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12);
      doc.text(order.paymentConfirmed ? 'Paid' : 'Pending', contentX + 18, heroY + 134);
      doc.text('Secure checkout', contentX + 160, heroY + 134);
      doc.text(order._id.toString(), contentX + 318, heroY + 134, { width: 176 });

      cursorY = heroY + heroHeight + 28;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13);
      doc.text('Order Summary', contentX, cursorY);
      cursorY += 20;

      const columns = {
        item: contentX + 16,
        qty: contentX + 310,
        unit: contentX + 362,
        discount: contentX + 436,
        total: contentX + 506,
      };

      doc.roundedRect(contentX, cursorY, contentWidth, 28, 10).fill('#111827');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('ITEM', columns.item, cursorY + 9);
      doc.text('QTY', columns.qty, cursorY + 9);
      doc.text('UNIT', columns.unit, cursorY + 9);
      doc.text('DISC', columns.discount, cursorY + 9);
      doc.text('TOTAL', columns.total, cursorY + 9);
      cursorY += 28;

      order.items.forEach((item, index) => {
        const rowHeight = 48;
        const fill = index % 2 === 0 ? '#f8fafc' : '#ffffff';
        const lineTotal =
          Math.round(
            item.unitPrice * item.quantity * (1 - item.discountRate / 100) * 100,
          ) / 100;

        doc.rect(contentX, cursorY, contentWidth, rowHeight).fill(fill);
        doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11);
        doc.text(item.productName, columns.item, cursorY + 11, {
          width: 270,
        });
        doc.font('Helvetica').fontSize(9).fillColor('#64748b');
        doc.text(`SKU ${item.productId.slice(-8).toUpperCase()}`, columns.item, cursorY + 28);
        doc.fillColor('#111827').font('Helvetica').fontSize(10);
        doc.text(String(item.quantity), columns.qty, cursorY + 18);
        doc.text(this.formatMoney(item.unitPrice), columns.unit, cursorY + 18);
        doc.text(`${item.discountRate}%`, columns.discount, cursorY + 18);
        doc.font('Helvetica-Bold').text(this.formatMoney(lineTotal), columns.total, cursorY + 18);
        cursorY += rowHeight;
      });

      cursorY += 20;
      const summaryWidth = 210;
      const summaryX = right - summaryWidth;
      doc.roundedRect(summaryX, cursorY, summaryWidth, 112, 16).fill('#f8fafc');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12);
      doc.text('Payment Summary', summaryX + 16, cursorY + 16);
      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      doc.text('Subtotal', summaryX + 16, cursorY + 42);
      doc.text(this.formatMoney(subtotal), summaryX + 116, cursorY + 42, {
        width: 78,
        align: 'right',
      });
      doc.text('Discounts', summaryX + 16, cursorY + 62);
      doc.text(`-${this.formatMoney(discountValue)}`, summaryX + 116, cursorY + 62, {
        width: 78,
        align: 'right',
      });
      doc.moveTo(summaryX + 16, cursorY + 84).lineTo(summaryX + summaryWidth - 16, cursorY + 84).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(13);
      doc.text('Grand Total', summaryX + 16, cursorY + 92);
      doc.text(this.formatMoney(order.totalPrice), summaryX + 108, cursorY + 92, {
        width: 86,
        align: 'right',
      });

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12);
      doc.text('Notes', contentX, cursorY + 8);
      doc.font('Helvetica').fontSize(10).fillColor('#475569');
      doc.text(
        'Thank you for shopping with AURA. Keep this invoice for returns, delivery follow-up, and warranty questions. If you need help, contact our support team with your invoice number.',
        contentX,
        cursorY + 30,
        { width: contentWidth - summaryWidth - 26, lineGap: 4 },
      );

      doc.rect(0, doc.page.height - 62, doc.page.width, 62).fill('#111827');
      doc.fillColor('#d1d5db').font('Helvetica').fontSize(9);
      doc.text(
        `AURA Clothing  •  ${this.invoiceSiteName}  •  ${this.invoiceSupportEmail}`,
        left,
        doc.page.height - 40,
        { width: contentWidth, align: 'center' },
      );
      doc.text(
        'This document confirms payment and delivery details for the order above.',
        left,
        doc.page.height - 26,
        { width: contentWidth, align: 'center' },
      );

      doc.end();
    });
  }

  private wrapBase64(value: string) {
    return value.match(/.{1,76}/g)?.join('\r\n') ?? value;
  }

  private dotStuff(message: string) {
    return message
      .replace(/\r?\n/g, '\r\n')
      .split('\r\n')
      .map((line) => (line.startsWith('.') ? `.${line}` : line))
      .join('\r\n');
  }

  private isEnabled(value: string | undefined) {
    return ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());
  }

  private getInvoiceRecipient(customerEmail: string) {
    return (
      process.env.MAIL_OVERRIDE_TO?.trim() ||
      process.env.MAIL_TO?.trim() ||
      customerEmail
    );
  }

  private composeInvoiceEmail(
    invoice: InvoiceDocument,
    order: OrderDocument,
    to: string,
  ) {
    const boundary = `invoice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fileName = invoice.pdfFileName || this.buildInvoiceFileName(order._id.toString());
    const from = process.env.MAIL_FROM || 'AURA Store <no-reply@aura.local>';
    const subject = `Invoice ${invoice.invoiceNumber}`;
    const textBody = [
      `Thanks for shopping with AURA Clothing.`,
      `Your invoice ${invoice.invoiceNumber} is attached as a PDF.`,
      '',
      `Order ID: ${order._id.toString()}`,
      `Total: ${this.formatMoney(order.totalPrice)}`,
      `Delivery status: ${order.status}`,
      `Website: ${this.invoiceSiteName}`,
      '',
      `Questions? Reply to ${this.invoiceSupportEmail}.`,
    ].join('\r\n');

    return [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      textBody,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${fileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${fileName}"`,
      '',
      this.wrapBase64(invoice.pdfBase64),
      '',
      `--${boundary}--`,
    ].join('\r\n');
  }

  private async sendSmtpMail(to: string, message: string) {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || 1025);
    const secure = this.isEnabled(process.env.SMTP_SECURE) || port === 465;
    const requireTls = this.isEnabled(process.env.SMTP_REQUIRE_TLS) || port === 587;
    const rejectUnauthorized =
      process.env.SMTP_REJECT_UNAUTHORIZED?.toLowerCase() !== 'false';
    const username = process.env.SMTP_USER?.trim();
    const password = process.env.SMTP_PASS?.replace(/\s+/g, '') ?? '';
    const clientName = process.env.SMTP_CLIENT_NAME || 'aura.local';
    const fromAddress =
      process.env.MAIL_FROM_ADDRESS ||
      (process.env.MAIL_FROM?.match(/<([^>]+)>/)?.[1] ?? 'no-reply@aura.local');

    await new Promise<void>((resolve, reject) => {
      let socket: net.Socket | tls.TLSSocket = secure
        ? tls.connect({ host, port, servername: host, rejectUnauthorized })
        : net.createConnection({ host, port });
      let responseBuffer = '';
      let closed = false;
      const cleanup = () => {
        closed = true;
        socket.removeAllListeners();
        socket.end();
      };
      const attachSocketListeners = () => {
        socket.setTimeout(10000);
        socket.on('data', (chunk) => {
          responseBuffer += chunk.toString('utf8');
        });
        socket.once('timeout', () => {
          cleanup();
          reject(new Error('SMTP connection timed out'));
        });
        socket.once('error', (error) => {
          if (!closed) {
            cleanup();
            reject(error);
          }
        });
      };
      const waitForResponse = (expectedCodes: number[]) =>
        new Promise<void>((resolveWait, rejectWait) => {
          const startedAt = Date.now();
          const timer = setInterval(() => {
            const lines = responseBuffer.split(/\r?\n/).filter(Boolean);
            const finalLine = [...lines]
              .reverse()
              .find((line) => /^\d{3} /.test(line));

            if (finalLine) {
              const code = Number(finalLine.slice(0, 3));
              const response = responseBuffer.trim();
              responseBuffer = '';
              clearInterval(timer);

              if (expectedCodes.includes(code)) {
                resolveWait();
              } else {
                rejectWait(new Error(`SMTP ${response}`));
              }
            }

            if (Date.now() - startedAt > 8000) {
              clearInterval(timer);
              rejectWait(new Error('SMTP response timed out'));
            }
          }, 20);
        });
      const writeCommand = async (command: string, expectedCodes: number[]) => {
        socket.write(`${command}\r\n`);
        await waitForResponse(expectedCodes);
      };
      const upgradeToTls = async () => {
        const plainSocket = socket as net.Socket;
        plainSocket.removeAllListeners('data');
        plainSocket.removeAllListeners('timeout');
        plainSocket.removeAllListeners('error');
        responseBuffer = '';

        socket = tls.connect({
          socket: plainSocket,
          servername: host,
          rejectUnauthorized,
        });
        attachSocketListeners();

        await new Promise<void>((resolveTls, rejectTls) => {
          socket.once('secureConnect', resolveTls);
          socket.once('error', rejectTls);
        });
      };
      const authenticate = async () => {
        if (!username || !password) {
          return;
        }

        const token = Buffer.from(`\0${username}\0${password}`).toString('base64');
        await writeCommand(`AUTH PLAIN ${token}`, [235]);
      };

      attachSocketListeners();
      socket.once(secure ? 'secureConnect' : 'connect', async () => {
        try {
          await waitForResponse([220]);
          await writeCommand(`EHLO ${clientName}`, [250]);

          if (requireTls && !secure) {
            await writeCommand('STARTTLS', [220]);
            await upgradeToTls();
            await writeCommand(`EHLO ${clientName}`, [250]);
          }

          await authenticate();
          await writeCommand(`MAIL FROM:<${fromAddress}>`, [250]);
          await writeCommand(`RCPT TO:<${to}>`, [250, 251]);
          await writeCommand('DATA', [354]);
          socket.write(`${this.dotStuff(message)}\r\n.\r\n`);
          await waitForResponse([250]);
          await writeCommand('QUIT', [221]);
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    });
  }

  private async sendInvoiceEmail(
    invoice: InvoiceDocument,
    order: OrderDocument,
    force = false,
  ) {
    if (process.env.SMTP_DISABLED === 'true') {
      invoice.emailStatus = 'skipped';
      invoice.emailError = 'SMTP_DISABLED=true';
      await invoice.save();
      return invoice;
    }

    if (invoice.emailedToCustomer && !force) {
      return invoice;
    }

    if (!force) {
      const latestInvoice = await this.invoiceModel.findById(invoice._id).exec();

      if (!latestInvoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (latestInvoice.emailedToCustomer) {
        return latestInvoice;
      }

      const lockedInvoice = await this.invoiceModel
        .findOneAndUpdate(
          {
            _id: invoice._id,
            emailedToCustomer: false,
            emailStatus: { $ne: 'sending' },
          },
          {
            $set: {
              emailStatus: 'sending',
              emailError: '',
            },
          },
          { new: true },
        )
        .exec();

      if (!lockedInvoice) {
        return (await this.invoiceModel.findById(invoice._id).exec()) ?? invoice;
      }

      invoice = lockedInvoice;
    }

    try {
      const to = this.getInvoiceRecipient(invoice.customerEmail);
      await this.sendSmtpMail(
        to,
        this.composeInvoiceEmail(invoice, order, to),
      );
      invoice.emailedToCustomer = true;
      invoice.emailStatus = 'sent';
      invoice.emailError = '';
      invoice.emailedAt = new Date();
      await invoice.save();
      return invoice;
    } catch (error) {
      invoice.emailedToCustomer = false;
      invoice.emailStatus = 'failed';
      invoice.emailError =
        error instanceof Error ? error.message : 'Invoice email failed';
      await invoice.save();
      return invoice;
    }
  }

  private normalizeItemText(value?: string) {
    return value?.trim() ?? '';
  }

  private assertValidDeliveryTransition(
    currentStatus: string,
    nextStatus: 'processing' | 'in-transit' | 'delivered',
  ) {
    const currentIndex = this.deliveryStatusOrder.findIndex(
      (status) => status === currentStatus,
    );
    const nextIndex = this.deliveryStatusOrder.indexOf(nextStatus);

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Invalid delivery status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private getOrderStatusFromDeliveries(
    deliveries: Array<{ status: 'processing' | 'in-transit' | 'delivered' }>,
  ) {
    if (!deliveries.length) {
      return 'processing';
    }

    if (deliveries.every((delivery) => delivery.status === 'delivered')) {
      return 'delivered';
    }

    if (deliveries.some((delivery) => delivery.status === 'in-transit')) {
      return 'in-transit';
    }

    return 'processing';
  }

  private isSameItem(
    left: { productId: string; selectedSize?: string; selectedColor?: string },
    right: { productId: string; selectedSize?: string; selectedColor?: string },
  ) {
    return (
      left.productId === right.productId &&
      this.normalizeItemText(left.selectedSize) ===
        this.normalizeItemText(right.selectedSize) &&
      this.normalizeItemText(left.selectedColor) ===
        this.normalizeItemText(right.selectedColor)
    );
  }

  private async ensureItemsInStock(
    items: Array<{
      productId: string;
      quantity: number;
      selectedSize?: string;
      selectedColor?: string;
    }>,
  ) {
    const requestedByProduct = new Map<string, number>();

    for (const item of items) {
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const productIds = [...requestedByProduct.keys()];

    if (!productIds.length) {
      return;
    }

    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select('_id stock')
      .lean()
      .exec();

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products were not found');
    }

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product.stock]),
    );

    for (const [productId, requestedQuantity] of requestedByProduct.entries()) {
      const stock = productMap.get(productId);

      if (stock === undefined) {
        throw new NotFoundException(`Product not found: ${productId}`);
      }

      if (requestedQuantity > stock) {
        throw new BadRequestException(
          `Insufficient stock for product ${productId}. Available stock: ${stock}`,
        );
      }
    }
  }

  private async getOrCreateActiveCard(userId: string) {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      throw new BadRequestException('userId is required');
    }

    const existingCard = await this.cardModel
      .findOne({ userId: normalizedUserId, status: 'active' })
      .exec();

    if (existingCard) {
      return existingCard;
    }

    try {
      return await this.cardModel.create({
        userId: normalizedUserId,
        items: [],
        status: 'active',
      });
    } catch (error) {
      const duplicateKeyError = error as { code?: number };

      if (duplicateKeyError?.code === 11000) {
        const activeCard = await this.cardModel
          .findOne({ userId: normalizedUserId, status: 'active' })
          .exec();

        if (activeCard) {
          return activeCard;
        }
      }

      this.handleServiceError(error, 'Active card could not be created');
    }
  }

  private async createInvoiceForOrder(order: OrderDocument, sendEmail = false) {
    const orderId = order._id.toString();
    const invoiceNumber = this.buildInvoiceNumber(orderId);
    const pdfFileName = this.buildInvoiceFileName(orderId);
    const pdfBase64 = (await this.buildInvoicePdf(order, invoiceNumber)).toString(
      'base64',
    );
    const invoice = await this.invoiceModel
      .findOneAndUpdate(
        { orderId },
        {
          $set: {
            totalAmount: order.totalPrice,
            pdfUrl: `/orders/${orderId}/invoice/pdf`,
            pdfBase64,
            pdfFileName,
          },
          $setOnInsert: {
            invoiceNumber,
            orderId,
            customerId: order.customerId,
            customerEmail: order.customerEmail,
            emailedToCustomer: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    if (!invoice) {
      throw new InternalServerErrorException('Invoice could not be generated');
    }

    order.invoiceId = invoice._id.toString();
    await order.save();

    if (!sendEmail) {
      return invoice;
    }

    return this.sendInvoiceEmail(invoice, order);
  }

  // The card service stores only references and shopping preferences.
  // Product details stay in the main service to prevent unnecessary duplication.
  async createCard(payload: CreateCardDto) {
    try {
      await this.ensureItemsInStock(payload.items);
      const card = await this.cardModel.create({
        ...payload,
        status: payload.status ?? 'active',
      });

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be created');
    }
  }

  async findAllCards() {
    try {
      const cards = await this.cardModel.find().sort({ createdAt: -1 }).exec();
      return cards.map((card) => this.sanitizeCard(card));
    } catch (error) {
      this.handleServiceError(error, 'Cards could not be listed');
    }
  }

  async findOneCard(id: string) {
    try {
      const card = await this.cardModel.findById(id).exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be fetched');
    }
  }

  async updateCard(id: string, payload: UpdateCardDto) {
    try {
      const currentCard = await this.cardModel.findById(id).exec();

      if (!currentCard) {
        throw new NotFoundException('Card not found');
      }

      const nextItems = payload.items ?? currentCard.items;
      await this.ensureItemsInStock(nextItems);

      const card = await this.cardModel
        .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
        .exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Card could not be updated');
    }
  }

  async getActiveCart(userId: string) {
    try {
      const card = await this.getOrCreateActiveCard(userId);
      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Active cart could not be fetched');
    }
  }

  async addItemToCart(payload: AddCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedItem = {
        productId: payload.productId,
        quantity: payload.quantity,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const existingItem = currentItems.find((item) =>
        this.isSameItem(item, normalizedItem),
      );

      const nextItems = existingItem
        ? currentItems.map((item) =>
            this.isSameItem(item, normalizedItem)
              ? { ...item, quantity: item.quantity + normalizedItem.quantity }
              : item,
          )
        : [...currentItems, normalizedItem];

      await this.ensureItemsInStock(nextItems);

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Item could not be added to cart');
    }
  }

  async updateCartItem(payload: UpdateCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedTarget = {
        productId: payload.productId,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const itemExists = currentItems.some((item) =>
        this.isSameItem(item, normalizedTarget),
      );

      if (!itemExists) {
        throw new NotFoundException('Cart item not found');
      }

      const nextItems = currentItems.map((item) =>
        this.isSameItem(item, normalizedTarget)
          ? { ...item, quantity: payload.quantity }
          : item,
      );

      await this.ensureItemsInStock(nextItems);

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart item could not be updated');
    }
  }

  async removeCartItem(payload: RemoveCartItemDto) {
    try {
      const card = await this.getOrCreateActiveCard(payload.userId);
      const normalizedTarget = {
        productId: payload.productId,
        selectedSize: this.normalizeItemText(payload.selectedSize),
        selectedColor: this.normalizeItemText(payload.selectedColor),
      };

      const currentItems = card.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSize: this.normalizeItemText(item.selectedSize),
        selectedColor: this.normalizeItemText(item.selectedColor),
      }));

      const nextItems = currentItems.filter(
        (item) => !this.isSameItem(item, normalizedTarget),
      );

      if (nextItems.length === currentItems.length) {
        throw new NotFoundException('Cart item not found');
      }

      card.items = nextItems;
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart item could not be removed');
    }
  }

  async clearCart(userId: string) {
    try {
      const card = await this.getOrCreateActiveCard(userId);
      card.items = [];
      await card.save();

      return this.sanitizeCard(card);
    } catch (error) {
      this.handleServiceError(error, 'Cart could not be cleared');
    }
  }

  async checkout(payload: CheckoutDto) {
    const decrementedStock: Array<{ productId: string; quantity: number }> = [];
    let createdOrder: OrderDocument | null = null;
    let claimedCard: CardDocument | null = null;
    let createdInvoice: InvoiceDocument | null = null;

    try {
      const userId = payload.userId.trim();
      const deliveryAddress = payload.deliveryAddress.trim();

      if (!userId) {
        throw new BadRequestException('userId is required');
      }

      if (!deliveryAddress) {
        throw new BadRequestException('deliveryAddress is required');
      }

      if (payload.paymentConfirmed !== true) {
        throw new BadRequestException('Payment must be confirmed before checkout');
      }

      const card = await this.cardModel
        .findOneAndUpdate(
          { userId, status: 'active', items: { $ne: [] } },
          { status: 'ordered' },
          { new: true, runValidators: true },
        )
        .exec();

      if (!card || !card.items.length) {
        throw new BadRequestException('Active cart is empty');
      }

      claimedCard = card;

      const requestedByProduct = new Map<string, number>();
      for (const item of card.items) {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productIds = [...requestedByProduct.keys()];
      const products = await this.productModel
        .find({ _id: { $in: productIds } })
        .exec();

      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products were not found');
      }

      const productMap = new Map(
        products.map((product) => [product._id.toString(), product]),
      );

      for (const [productId, quantity] of requestedByProduct.entries()) {
        const product = productMap.get(productId);

        if (!product) {
          throw new NotFoundException(`Product not found: ${productId}`);
        }

        if (product.stock < quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}. Available stock: ${product.stock}`,
          );
        }
      }

      for (const [productId, quantity] of requestedByProduct.entries()) {
        const result = await this.productModel
          .updateOne(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
          )
          .exec();

        if (result.modifiedCount !== 1) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}`,
          );
        }

        decrementedStock.push({ productId, quantity });
      }

      const orderItems = card.items.map((item) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          discountRate: product.discountActive ? (product.discountRate ?? 0) : 0,
        };
      });

      const totalPrice = orderItems.reduce((sum, item) => {
        const discountMultiplier = 1 - item.discountRate / 100;
        return sum + item.unitPrice * item.quantity * discountMultiplier;
      }, 0);

      createdOrder = await this.orderModel.create({
        customerId: userId,
        customerEmail: payload.customerEmail,
        items: orderItems,
        deliveryAddress,
        status: 'processing',
        totalPrice: Math.round(totalPrice * 100) / 100,
        paymentConfirmed: true,
      });

      await this.deliveryModel.insertMany(
        orderItems.map((item, index) => ({
          deliveryId: `${createdOrder!._id.toString()}-${index + 1}`,
          orderId: createdOrder!._id.toString(),
          customerId: userId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          totalPrice:
            Math.round(
              item.unitPrice *
                item.quantity *
                (1 - item.discountRate / 100) *
                100,
            ) / 100,
          deliveryAddress,
          status: 'processing',
          completed: false,
        })),
      );

      createdInvoice = await this.createInvoiceForOrder(createdOrder, false);

      return {
        order: this.sanitizeOrder(createdOrder),
        invoice: this.sanitizeInvoice(createdInvoice),
        deliveryStatus: 'processing',
      };
    } catch (error) {
      if (claimedCard && !createdOrder) {
        await this.cardModel
          .updateOne({ _id: claimedCard._id }, { status: 'active' })
          .exec();
      }

      await Promise.all(
        decrementedStock.map((item) =>
          this.productModel
            .updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } },
            )
            .exec(),
        ),
      );

      if (createdOrder) {
        if (createdInvoice) {
          await this.invoiceModel.deleteOne({ _id: createdInvoice._id }).exec();
        }

        await this.deliveryModel
          .deleteMany({ orderId: createdOrder._id.toString() })
          .exec();
        await this.orderModel.deleteOne({ _id: createdOrder._id }).exec();

        if (claimedCard) {
          await this.cardModel
            .updateOne({ _id: claimedCard._id }, { status: 'active' })
            .exec();
        }
      }

      this.handleServiceError(error, 'Checkout could not be completed');
    }
  }

  async findOrdersForUser(userId: string) {
    try {
      const orders = await this.orderModel
        .find({ customerId: userId.trim() })
        .sort({ createdAt: -1 })
        .exec();

      return orders.map((order) => this.sanitizeOrder(order));
    } catch (error) {
      this.handleServiceError(error, 'Orders could not be listed');
    }
  }

  async findAllOrders() {
    try {
      const orders = await this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      return orders.map((order) => this.sanitizeOrder(order));
    } catch (error) {
      this.handleServiceError(error, 'Orders could not be listed');
    }
  }

  async findOneOrder(id: string) {
    try {
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return this.sanitizeOrder(order);
    } catch (error) {
      this.handleServiceError(error, 'Order could not be fetched');
    }
  }

  async findOrderDeliveryStatusForUser(userId: string) {
    try {
      const normalizedUserId = userId.trim();
      const [orders, deliveries] = await Promise.all([
        this.orderModel
          .find({ customerId: normalizedUserId })
          .sort({ createdAt: -1 })
          .exec(),
        this.deliveryModel
          .find({ customerId: normalizedUserId })
          .sort({ createdAt: -1 })
          .exec(),
      ]);

      return orders.map((order) => {
        const orderId = order._id.toString();
        const orderDeliveries = deliveries
          .filter((delivery) => delivery.orderId === orderId)
          .map((delivery) => this.sanitizeDelivery(delivery));
        const deliveryStatus = orderDeliveries.length
          ? this.getOrderStatusFromDeliveries(orderDeliveries)
          : order.status;

        return {
          order: this.sanitizeOrder(order),
          deliveryStatus,
          deliveries: orderDeliveries,
        };
      });
    } catch (error) {
      this.handleServiceError(error, 'Order and delivery status could not be listed');
    }
  }

  async findOrderInvoice(orderId: string) {
    try {
      const order = await this.orderModel.findById(orderId).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const invoice =
        (await this.invoiceModel.findOne({ orderId }).exec()) ??
        (await this.createInvoiceForOrder(order, false));

      return this.sanitizeInvoice(invoice);
    } catch (error) {
      this.handleServiceError(error, 'Invoice could not be fetched');
    }
  }

  async findOrderInvoicePdf(orderId: string) {
    try {
      const order = await this.orderModel.findById(orderId).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const invoice =
        (await this.invoiceModel.findOne({ orderId }).exec()) ??
        (await this.createInvoiceForOrder(order, false));

      if (!invoice.pdfBase64) {
        invoice.pdfBase64 = (
          await this.buildInvoicePdf(order, invoice.invoiceNumber)
        ).toString('base64');
        invoice.pdfFileName =
          invoice.pdfFileName || this.buildInvoiceFileName(orderId);
        invoice.pdfUrl = `/orders/${orderId}/invoice/pdf`;
        await invoice.save();
      }

      return {
        fileName: invoice.pdfFileName || this.buildInvoiceFileName(orderId),
        contentType: 'application/pdf',
        base64: invoice.pdfBase64,
      };
    } catch (error) {
      this.handleServiceError(error, 'Invoice PDF could not be fetched');
    }
  }

  async emailOrderInvoice(orderId: string) {
    try {
      const order = await this.orderModel.findById(orderId).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const invoice =
        (await this.invoiceModel.findOne({ orderId }).exec()) ??
        (await this.createInvoiceForOrder(order, false));

      if (!invoice.pdfBase64) {
        invoice.pdfBase64 = (
          await this.buildInvoicePdf(order, invoice.invoiceNumber)
        ).toString('base64');
        invoice.pdfFileName =
          invoice.pdfFileName || this.buildInvoiceFileName(orderId);
        invoice.pdfUrl = `/orders/${orderId}/invoice/pdf`;
      }

      const emailedInvoice = await this.sendInvoiceEmail(invoice, order, false);

      if (emailedInvoice.emailStatus !== 'sent') {
        throw new InternalServerErrorException(
          emailedInvoice.emailError || 'Invoice email failed',
        );
      }

      return this.sanitizeInvoice(emailedInvoice);
    } catch (error) {
      this.handleServiceError(error, 'Invoice email could not be sent');
    }
  }

  mockPayment(payload: { userId: string; amount?: number; orderId?: string }) {
    try {
      const amount = Number(payload.amount ?? 0);

      if (!payload.userId?.trim()) {
        throw new BadRequestException('userId is required');
      }

      if (Number.isNaN(amount) || amount < 0) {
        throw new BadRequestException('amount must be a positive number');
      }

      return {
        paymentId: `PAY-${Date.now()}`,
        userId: payload.userId,
        orderId: payload.orderId ?? null,
        amount,
        status: 'approved',
        paymentConfirmed: true,
        provider: 'mock-payment',
      };
    } catch (error) {
      this.handleServiceError(error, 'Mock payment could not be completed');
    }
  }

  async updateOrderStatus(payload: UpdateOrderStatusDto) {
    try {
      const order = await this.orderModel.findById(payload.orderId).exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.assertValidDeliveryTransition(order.status, payload.status);

      order.status = payload.status;
      await order.save();

      const completed = payload.status === 'delivered';
      await this.deliveryModel
        .updateMany(
          { orderId: payload.orderId },
          { status: payload.status, completed },
          { runValidators: true },
        )
        .exec();

      return this.sanitizeOrder(order);
    } catch (error) {
      this.handleServiceError(error, 'Order status could not be updated');
    }
  }

  async updateDeliveryStatus(payload: UpdateDeliveryStatusDto) {
    try {
      const delivery = await this.deliveryModel
        .findOne({ deliveryId: payload.deliveryId })
        .exec();

      if (!delivery) {
        throw new NotFoundException('Delivery not found');
      }

      this.assertValidDeliveryTransition(delivery.status, payload.status);

      delivery.status = payload.status;
      delivery.completed = payload.status === 'delivered';
      await delivery.save();

      const deliveriesForOrder = await this.deliveryModel
        .find({ orderId: delivery.orderId })
        .select('status')
        .lean()
        .exec();
      const orderStatus = this.getOrderStatusFromDeliveries(deliveriesForOrder);

      await this.orderModel
        .findByIdAndUpdate(delivery.orderId, { status: orderStatus })
        .exec();

      return this.sanitizeDelivery(delivery);
    } catch (error) {
      this.handleServiceError(error, 'Delivery status could not be updated');
    }
  }

  async findDeliveries() {
    try {
      const deliveries = await this.deliveryModel
        .find()
        .sort({ createdAt: -1 })
        .exec();

      return deliveries.map((delivery) => this.sanitizeDelivery(delivery));
    } catch (error) {
      this.handleServiceError(error, 'Deliveries could not be listed');
    }
  }

  async findDeliveriesForUser(userId: string) {
    try {
      const deliveries = await this.deliveryModel
        .find({ customerId: userId.trim() })
        .sort({ createdAt: -1 })
        .exec();

      return deliveries.map((delivery) => this.sanitizeDelivery(delivery));
    } catch (error) {
      this.handleServiceError(error, 'Deliveries could not be listed');
    }
  }

  async deleteCard(id: string) {
    try {
      const card = await this.cardModel.findByIdAndDelete(id).exec();

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      return {
        id,
        deleted: true,
      };
    } catch (error) {
      this.handleServiceError(error, 'Card could not be deleted');
    }
  }
}
