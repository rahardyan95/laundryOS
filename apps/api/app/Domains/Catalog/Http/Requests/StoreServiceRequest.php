<?php

namespace App\Domains\Catalog\Http\Requests;

use App\Domains\Catalog\Enums\ServiceUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'unit' => ['required', Rule::enum(ServiceUnit::class)],
            'price_per_unit' => ['required', 'integer', 'min:0'],
            'estimated_hours' => ['required', 'integer', 'min:1'],
            'active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama layanan wajib diisi.',
            'unit.required' => 'Satuan wajib dipilih.',
            'unit.enum' => 'Satuan tidak valid.',
            'price_per_unit.required' => 'Harga wajib diisi.',
            'estimated_hours.required' => 'Estimasi waktu wajib diisi.',
        ];
    }
}
