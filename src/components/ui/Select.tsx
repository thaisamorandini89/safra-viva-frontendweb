import React, { SelectHTMLAttributes, ReactNode } from 'react';

// O <T> permite que o Select aceite qualquer tipo de dado (string, objeto, etc)
interface SelectProps<T> extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options?: T[]; 
  children?: ReactNode;
  error?: boolean;
  // Adicionamos uma função opcional para extrair o valor e o texto se for um objeto
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => string | number;
}

export default function Select<T>({ 
  placeholder, 
  options = [], 
  children, 
  error = false,
  getOptionLabel, 
  getOptionValue, 
  ...props 
}: SelectProps<T>) {
  const borda = error
    ? "border-red-400 focus:ring-red-400"
    : "border-gray-300 focus:ring-green-400";
  return (
    <select
      {...props}
      className={`w-full border rounded-md px-3 py-2 text-sm text-gray-500
        focus:outline-none focus:ring-2 focus:border-transparent bg-white appearance-none transition ${borda}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      
      {/* Mapeamento flexível para objetos ou strings */}
      {options.map((o, index) => (
        <option 
          key={index} 
          value={getOptionValue ? getOptionValue(o) : String(o)}
        >
          {getOptionLabel ? getOptionLabel(o) : String(o)}
        </option>
      ))}
      
      {children}
    </select>
  );
}