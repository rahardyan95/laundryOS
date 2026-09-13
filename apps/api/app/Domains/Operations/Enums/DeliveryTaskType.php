<?php

namespace App\Domains\Operations\Enums;

enum DeliveryTaskType: string
{
    case Pickup = 'pickup';
    case Delivery = 'delivery';
}
