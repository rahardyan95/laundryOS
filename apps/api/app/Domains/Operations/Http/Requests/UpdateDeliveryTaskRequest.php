<?php

namespace App\Domains\Operations\Http\Requests;

use App\Domains\Identity\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDeliveryTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'scheduled_at' => ['sometimes', 'required', 'date', 'after:now'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'driver_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('tenant_id', $tenantId)
                    ->where('role', Role::Driver->value)),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'scheduled_at.after' => 'Jadwal harus waktu yang akan datang.',
            'driver_id.exists' => 'Kurir tidak valid.',
        ];
    }
}
