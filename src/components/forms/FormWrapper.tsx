import React, { ReactNode } from 'react';
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import FormActions from "../ui/FormActions";

// 1. Defina a interface das Props.
// O símbolo '?' torna a propriedade opcional, impedindo o erro de "missing property".
interface FormWrapperProps {
  breadcrumb: string;
  page: string;
  title: string;
  description: string;
  saveLabel?: string; 
  onCancel?: () => void;
  onSave?: () => void;
  children: ReactNode; // 'children' é obrigatório para envolver o conteúdo
}

// 2. Aplique a interface ao componente.
export default function FormWrapper(props: FormWrapperProps) {
  // Desestruturando as props para usar dentro do componente
  const { 
    breadcrumb, page, title, description, 
    saveLabel = "Salvar", onCancel, onSave, children 
  } = props;

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar breadcrumb={breadcrumb} page={page} />
      <div className="px-6 py-8 lg:px-10">
        <div className="max-w-5xl mx-auto w-full">
          <PageHeader title={title} description={description} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 mt-4">
            {children}

            <FormActions
              onCancel={onCancel}
              onSave={onSave}
              saveLabel={saveLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}