<?php

namespace App\Domains\Operations\Http\Requests;

use App\Domains\Operations\Enums\CashEntryType;
use App\Domains\Ordering\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outlet_id' => [
                'required',
                'integer',
                Rule::exists('outlets', 'id')->where('tenant_id', $this->user()->tenant_id),
            ],
            'type' => ['required', Rule::enum(CashEntryType::class)],
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'integer', 'min:1'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'order_id' => [
                'nullable',
                'integer',
                Rule::exists('orders', 'id')->where('tenant_id', $this->user()->tenant_id),
            ],
            'note' => ['nullable', 'string'],
            'occurred_at' => ['sometimes', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'type.required' => 'Jenis kas wajib dipilih.',
            'category.required' => 'Kategori wajib diisi.',
            'amount.required' => 'Nominal wajib diisi.',
            'amount.min' => 'Nominal minimal Rp1.',
        ];
    }
}
