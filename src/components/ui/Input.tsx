import React, { InputHTMLAttributes } from 'react';

// Garante que o nosso componente aceite todas as propriedades de um input HTML padrão
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = "", type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition ${className}`}
      {...props} // <-- Essencial para o value e onChange do CEP funcionarem!
    />
  );
}