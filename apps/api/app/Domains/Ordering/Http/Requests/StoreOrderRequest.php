<?php

namespace App\Domains\Ordering\Http\Requests;

use App\Domains\Ordering\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'outlet_id' => ['required', 'integer', Rule::exists('outlets', 'id')->where('tenant_id', $tenantId)],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)->where('active', true)),
            ],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'pickup_requested' => ['sometimes', 'boolean'],
            'delivery_requested' => ['sometimes', 'boolean'],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'paid_amount' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'outlet_id.exists' => 'Outlet tidak valid.',
            'customer_id.required' => 'Pelanggan wajib dipilih.',
            'customer_id.exists' => 'Pelanggan tidak valid.',
            'items.required' => 'Order minimal memiliki satu layanan.',
            'items.*.service_id.exists' => 'Layanan tidak tersedia.',
            'items.*.qty.min' => 'Jumlah harus lebih dari 0.',
            'paid_amount.min' => 'Nominal dibayar tidak boleh negatif.',
        ];
    }
}
