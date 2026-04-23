import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { PrismaService } from '../common/prisma.service';

export interface BookingEmailData {
  bookingId: string;
  guestName: string;
  guestEmail: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
  address: string;
  contactPhone?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@uclicky.com');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'UCLICK-Y');
  }

  async sendBookingConfirmation(data: BookingEmailData) {
    const subject = `Booking Confirmed - ${data.hotelName} | UCLICK-Y`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #003580; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">UCLICK-Y</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Booking Confirmed!</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #003580; margin-top: 0;">Hello ${data.guestName},</h2>
      <p style="color: #555; line-height: 1.6;">Your booking has been confirmed! Here are your details:</p>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Booking ID</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.bookingId.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Hotel</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.hotelName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Room</td>
            <td style="padding: 8px 0; text-align: right;">${data.roomName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Check-in</td>
            <td style="padding: 8px 0; text-align: right;">${data.checkIn}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Check-out</td>
            <td style="padding: 8px 0; text-align: right;">${data.checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #777; font-size: 14px;">Duration</td>
            <td style="padding: 8px 0; text-align: right;">${data.nights} night${data.nights > 1 ? 's' : ''}</td>
          </tr>
          <tr style="border-top: 2px solid #e0e0e0;">
            <td style="padding: 12px 0 0; color: #003580; font-weight: bold;">Total Amount</td>
            <td style="padding: 12px 0 0; font-weight: bold; font-size: 18px; text-align: right; color: #003580;">
              ${data.currency} ${data.totalAmount.toLocaleString()}
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #e8f4fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #003580;">
          <strong>Hotel Address:</strong><br>${data.address}
        </p>
        ${data.contactPhone ? `<p style="margin: 8px 0 0; font-size: 14px; color: #003580;"><strong>Contact:</strong> ${data.contactPhone}</p>` : ''}
      </div>

      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
        Thank you for choosing UCLICK-Y. Have a wonderful stay!
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.log(`[DEV] Email would be sent to: ${data.guestEmail}`);
        this.logger.log(`[DEV] Subject: ${subject}`);
      } else {
        await sgMail.send({
          to: data.guestEmail,
          from: { email: this.fromEmail, name: this.fromName },
          subject,
          html,
        });
      }

      // Log email
      await this.prisma.emailLog.create({
        data: {
          bookingId: data.bookingId,
          toEmail: data.guestEmail,
          subject,
          status: 'sent',
        },
      });

      this.logger.log(`Confirmation email sent for booking: ${data.bookingId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send confirmation email', error);

      await this.prisma.emailLog.create({
        data: {
          bookingId: data.bookingId,
          toEmail: data.guestEmail,
          subject,
          status: 'failed',
          error: (error as Error).message,
        },
      });

      return { success: false, error: (error as Error).message };
    }
  }

  async sendBookingRejection(data: BookingEmailData & { reason?: string }) {
    const subject = `Booking Update - ${data.hotelName} | UCLICK-Y`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #dc3545; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0;">UCLICK-Y</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Booking Update</p>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
      <h2 style="color: #333;">Hello ${data.guestName},</h2>
      <p>Unfortunately, your booking at <strong>${data.hotelName}</strong> could not be confirmed.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      <p>A full refund of <strong>${data.currency} ${data.totalAmount.toLocaleString()}</strong> will be processed.</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
        We apologize for the inconvenience. Please try another property on UCLICK-Y.
      </p>
    </div>
  </div>
</body>
</html>`;

    try {
      if (this.configService.get('NODE_ENV') !== 'development') {
        await sgMail.send({
          to: data.guestEmail,
          from: { email: this.fromEmail, name: this.fromName },
          subject,
          html,
        });
      }

      await this.prisma.emailLog.create({
        data: { bookingId: data.bookingId, toEmail: data.guestEmail, subject, status: 'sent' },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send rejection email', error);
      return { success: false };
    }
  }
}
