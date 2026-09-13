<?php

namespace App\Domains\Identity\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    protected function resetUrl(mixed $notifiable): string
    {
        return rtrim((string) config('app.frontend_url'), '/')
            .'/reset-password?'.http_build_query([
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset kata sandi LaundryOS')
            ->line('Kami menerima permintaan reset kata sandi untuk akun Anda.')
            ->action('Reset Kata Sandi', $this->resetUrl($notifiable))
            ->line('Tautan ini berlaku selama 60 menit.')
            ->line('Jika Anda tidak meminta reset, abaikan email ini.');
    }
}
