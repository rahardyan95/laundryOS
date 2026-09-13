<?php

namespace App\Domains\Identity\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:10',
                Rule::unique('outlets', 'code')->where('tenant_id', $this->user()->tenant_id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode outlet wajib diisi.',
            'code.unique' => 'Kode outlet sudah dipakai.',
            'name.required' => 'Nama outlet wajib diisi.',
        ];
    }
}
