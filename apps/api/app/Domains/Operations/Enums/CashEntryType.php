<?php

namespace App\Domains\Operations\Enums;

enum CashEntryType: string
{
    case Income = 'income';
    case Expense = 'expense';
}
