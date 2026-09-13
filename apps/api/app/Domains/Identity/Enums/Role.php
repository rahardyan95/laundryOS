<?php

namespace App\Domains\Identity\Enums;

enum Role: string
{
    case Owner = 'owner';
    case Manager = 'manager';
    case Cashier = 'cashier';
    case Operator = 'operator';
    case Driver = 'driver';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Pemilik',
            self::Manager => 'Manajer',
            self::Cashier => 'Kasir',
            self::Operator => 'Operator',
            self::Driver => 'Kurir',
        };
    }
}
