<?php

namespace App\Domains\Operations\Http\Requests;

use App\Domains\Identity\Enums\Role;
use App\Domains\Operations\Enums\DeliveryTaskType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeliveryTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'order_id' => ['required', 'integer', Rule::exists('orders', 'id')->where('tenant_id', $tenantId)],
            'type' => ['required', Rule::enum(DeliveryTaskType::class)],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'driver_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)->where('role', Role::Driver->value)),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => 'Order wajib dipilih.',
            'order_id.exists' => 'Order tidak valid.',
            'type.required' => 'Jenis task wajib dipilih.',
            'scheduled_at.required' => 'Jadwal wajib diisi.',
            'scheduled_at.date' => 'Format jadwal tidak valid.',
            'driver_id.exists' => 'Kurir tidak valid.',
        ];
    }
}
