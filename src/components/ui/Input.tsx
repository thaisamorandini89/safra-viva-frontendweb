import React, { InputHTMLAttributes } from 'react';

// Garante que o nosso componente aceite todas as propriedades de um input HTML padrão
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function Input({ className = "", type = "text", error = false, ...props }: InputProps) {
  const borda = error
    ? "border-red-400 focus:ring-red-400"
    : "border-gray-300 focus:ring-green-400";
  return (
    <input
      type={type}
      className={`w-full border rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${borda} ${className}`}
      {...props} // <-- Essencial para o value e onChange do CEP funcionarem!
    />
  );
}