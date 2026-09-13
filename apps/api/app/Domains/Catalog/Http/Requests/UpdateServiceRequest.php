<?php

namespace App\Domains\Catalog\Http\Requests;

use App\Domains\Catalog\Enums\ServiceUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'unit' => ['sometimes', 'required', Rule::enum(ServiceUnit::class)],
            'price_per_unit' => ['sometimes', 'required', 'integer', 'min:0'],
            'estimated_hours' => ['sometimes', 'required', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
