<?php

namespace App\Domains\Identity\Enums;

enum PlanTier: string
{
    case Starter = 'starter';
    case Growth = 'growth';
    case MultiOutlet = 'multi_outlet';
}
