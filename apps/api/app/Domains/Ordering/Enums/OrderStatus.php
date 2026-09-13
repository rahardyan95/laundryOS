<?php

namespace App\Domains\Ordering\Enums;

enum OrderStatus: string
{
    case Received = 'received';
    case Washing = 'washing';
    case Drying = 'drying';
    case Ironing = 'ironing';
    case Ready = 'ready';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function next(): ?self
    {
        return match ($this) {
            self::Received => self::Washing,
            self::Washing => self::Drying,
            self::Drying => self::Ironing,
            self::Ironing => self::Ready,
            self::Ready => self::Completed,
            default => null,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Received => 'Diterima',
            self::Washing => 'Dicuci',
            self::Drying => 'Dikeringkan',
            self::Ironing => 'Disetrika',
            self::Ready => 'Siap Diambil',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
