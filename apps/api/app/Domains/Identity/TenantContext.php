<?php

namespace App\Domains\Identity;

class TenantContext
{
    public static function id(): ?int
    {
        $user = auth()->user();

        $tenantId = $user?->getAttribute('tenant_id');

        return $tenantId === null ? null : (int) $tenantId;
    }
}
